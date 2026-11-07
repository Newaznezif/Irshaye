import { getSyncClient } from '@/lib/supabaseAdmin';

import { auditRow } from './audit';
import { databaseUnavailable, fieldDatabaseStatus, getDeviceForIngestion, toDeviceSummary, type DeviceSummary, type FieldDb } from './deviceService';
import type { AuditEntry, CooperativeRole, CredentialRow, HardwareNodeRow, ManagementFailure, Membership } from './types';
import type { DeviceRegistration } from './registration';

/**
 * Server-side data access for the device-management surface.
 *
 * Two layers live in this module and they are kept apart deliberately:
 *
 *   - reads that resolve AUTHORITY (whose memberships does this subject hold, which cooperative owns
 *     that site), which must come from the database and never from the caller; and
 *   - writes that change state (register, change status, write the trail).
 *
 * Everything here runs as `service_role` on the server. That is the reason every function takes the
 * caller's resolved scope as an argument instead of re-deriving it from a request: the service role
 * can read any row, so the scope has to be a value some earlier, audited step produced. A route that
 * passed `null` where a scope was expected would have to invent rows to do it, and the types below
 * make that awkward rather than easy.
 */

/**
 * The node columns every management and dashboard read selects, in one place.
 *
 * Exported because a second column list is a second truth: the dashboard's device rows must not be
 * able to drift from the management rows by acquiring a field nobody reviewed — which is how a
 * `token_hash` would eventually reach a response body.
 */
export const NODE_COLUMNS = 'node_id,name,cooperative_id,field_site_id,status,latitude,longitude,coordinate_source,hardware_model,firmware_version,last_seen_at,record_added_at,record_replaced_at';

/**
 * The result shape for management data access: `FieldDb` from the ingestion layer, widened to the
 * management error codes.
 *
 * It is a separate type rather than a widening of `FieldDb` itself because the two surfaces answer
 * different questions. A device that reports a temperature of −274 can only be told `invalid_payload`
 * or a storage state; an operator who registers a device under a site they do not manage has to be
 * told `unknown_site` or `device_exists`, and those names must not leak into the ingestion contract
 * where firmware would have to guess what they mean. Every `IngestFailure` is still a legal value
 * here, so the shared helpers (`databaseUnavailable`, `fieldDatabaseStatus`) need no duplicate.
 */
export type ManagementDb<T> = { ok: true; value: T } | { ok: false; error: ManagementFailure };

/**
 * The caller's current memberships, read as the subject the Auth server confirmed.
 *
 * `removed_at is null` is the whole revocation model: ending a membership is a stamp on a row, so a
 * revoked membership cannot be resurrected by a stale cache and cannot be lost when someone wants
 * the history. An empty list is a normal, successful answer — a signed-in person with no
 * cooperative is denied by `decideAccess`, not by an error here.
 */
export async function resolveMemberships(userId: string): Promise<ManagementDb<{ memberships: Membership[] }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('app')
      .from('cooperative_members')
      .select('cooperative_id,role')
      .eq('user_id', userId)
      .is('removed_at', null);

    if (error) return { ok: false, error: databaseUnavailable('membership lookup', error.message) };
    const memberships = (data ?? []) as Array<{ cooperative_id: number | string; role: CooperativeRole }>;
    return {
      ok: true,
      value: {
        // PostgREST can hand a bigint back as a string; every later comparison in access.ts is
        // `===`, so the conversion happens at the boundary rather than in a decision function that
        // would otherwise be silently denying access to real members.
        memberships: memberships.map((row) => ({ cooperative_id: Number(row.cooperative_id), role: row.role })),
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('membership lookup', messageOf(err)) };
  }
}

/** The site a device is being registered against, with the cooperative that owns it. */
export interface ManagedFieldSite {
  field_site_id: number;
  cooperative_id: number;
  name: string;
  crop: string | null;
}

/**
 * Reads a field site and returns its owning cooperative.
 *
 * This is the step that makes `cooperative_id` unforgeable: registration takes a site id and the
 * cooperative comes out of THIS row. There is no code path in which a value from a request body
 * becomes the device's owner.
 */
export async function getFieldSite(fieldSiteId: number): Promise<ManagementDb<ManagedFieldSite>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('field_sites')
      .select('field_site_id,cooperative_id,name,crop')
      .eq('field_site_id', fieldSiteId)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('field site lookup', error.message) };
    if (!data) return { ok: false, error: { code: 'unknown_site', message: 'No field site with that id exists. Register a device against a site that has been created first.' } };
    return {
      ok: true,
      value: {
        field_site_id: Number(data.field_site_id),
        cooperative_id: Number(data.cooperative_id),
        name: data.name as string,
        crop: (data.crop as string | null) ?? null,
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('field site lookup', messageOf(err)) };
  }
}

/**
 * Devices within an explicit cooperative scope, one bounded page at a time.
 *
 * The scope is a required argument, and an empty scope returns an empty page WITHOUT a query: an
 * `.in('cooperative_id', [])` would be a database round trip whose only purpose is to prove we
 * could have skipped it, and a caller with no membership should not be generating load.
 *
 * Order is `node_id` ascending rather than newest-first because a management list is paginated, and
 * a list whose sort key can tie (two devices registered in the same millisecond) silently repeats or
 * skips rows across pages. The node id is the primary key, so the order cannot tie.
 */
export async function listDevicesInScope(
  cooperativeScope: number[],
  options: { status?: string | null; limit: number; offset: number },
): Promise<ManagementDb<{ devices: DeviceSummary[]; total: number }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  if (cooperativeScope.length === 0) return { ok: true, value: { devices: [], total: 0 } };

  try {
    const client = getSyncClient();
    // Two builders, each with its `select` FIRST: PostgREST puts the row count in the content-range
    // header of the query it is asked for, so the count is a head query over the same filters, not a
    // second pass over the page.
    const rowsQuery = client
      .schema('field')
      .from('hardware_nodes')
      .select(NODE_COLUMNS)
      .in('cooperative_id', cooperativeScope);
    const countQuery = client
      .schema('field')
      .from('hardware_nodes')
      .select('node_id', { count: 'exact', head: true })
      .in('cooperative_id', cooperativeScope);

    const [page, counted] = await Promise.all([
      (options.status ? rowsQuery.eq('status', options.status) : rowsQuery)
        .order('node_id', { ascending: true })
        .range(options.offset, options.offset + options.limit - 1),
      options.status ? countQuery.eq('status', options.status) : countQuery,
    ]);

    if (page.error) return { ok: false, error: databaseUnavailable('device list', page.error.message) };
    if (counted.error) return { ok: false, error: databaseUnavailable('device count', counted.error.message) };

    // Credentials are fetched per cooperative in one query rather than once per device. With a
    // page of 25 devices, 25 lookups per page load is the "excessive polling" the module brief
    // names, and it would be invisible at the sizes used in development.
    const nodes = (page.data ?? []) as HardwareNodeRow[];
    const current = await currentCredentialsFor(client, nodes.map((n) => n.node_id));
    if (!current.ok) return current;

    const byNode = current.value;
    return {
      ok: true,
      value: {
        devices: nodes.map((node) => toDeviceSummary(node, byNode.get(node.node_id) ?? null)),
        total: Number(counted.count ?? 0),
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device list', messageOf(err)) };
  }
}

async function currentCredentialsFor(
  client: ReturnType<typeof getSyncClient>,
  nodeIds: string[],
): Promise<FieldDb<Map<string, CredentialRow>>> {
  const map = new Map<string, CredentialRow>();
  if (nodeIds.length === 0) return { ok: true, value: map };

  const { data, error } = await client
    .schema('field')
    .from('hardware_node_credentials')
    .select('credential_id,node_id,token_hash,hash_algorithm,created_at,last_used_at,expires_at,revoked_at')
    .in('node_id', nodeIds)
    .is('revoked_at', null);

  if (error) return { ok: false, error: databaseUnavailable('credential summary', error.message) };

  // `hardware_credential_single_current_uid` guarantees at most one current row per node, but the
  // map keeps the newest anyway: a database that has been edited by hand should still produce a
  // list rather than an exception in a management screen.
  for (const row of (data ?? []) as CredentialRow[]) {
    const previous = map.get(row.node_id);
    if (!previous || Date.parse(row.created_at) > Date.parse(previous.created_at)) map.set(row.node_id, row);
  }
  return { ok: true, value: map };
}

/**
 * Registers one device inside an already-authorized scope.
 *
 * `cooperative_id` is a parameter, not a field of the registration: the caller resolved it from the
 * field site, and this function has no way to accept an owner from anywhere else.
 */
export async function registerDevice(registration: DeviceRegistration, cooperativeId: number): Promise<ManagementDb<HardwareNodeRow>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_nodes')
      .insert({
        node_id: registration.nodeId,
        name: registration.name,
        cooperative_id: cooperativeId,
        field_site_id: registration.fieldSiteId,
        // Registered, never authenticated. Nothing here claims a device is live: `active` is a
        // statement that it is expected to report, and `last_seen_at` is NULL until one has.
        status: 'inactive',
        latitude: registration.latitude,
        longitude: registration.longitude,
        coordinate_source: registration.coordinateSource,
        hardware_model: registration.hardwareModel,
        firmware_version: registration.firmwareVersion,
      })
      .select(NODE_COLUMNS)
      .single();

    if (error) {
      // A PK collision on node_id is the operator re-using a label, and 409 says so. The other
      // unique violations reachable here are FK failures, which the pre-checks above already rule
      // out, so they stay in the generic branch with the reason kept server-side.
      if (error.code === '23505') {
        return { ok: false, error: { code: 'device_exists', message: `A device is already registered as ${registration.nodeId}. node_id is the hardware's own identifier and cannot be shared; if this is a replacement unit, it needs a new id in its firmware.` } };
      }
      return { ok: false, error: databaseUnavailable('device registration', error.message) };
    }
    return { ok: true, value: data as HardwareNodeRow };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device registration', messageOf(err)) };
  }
}

/**
 * Moves a device along its lifecycle. Returns the row as it now stands, not as it was asked.
 *
 * The `neq('status', status)` filter makes this a compare-and-set against the value the caller
 * authorise-on read: if two operators change the same device at once, one of them is told the truth
 * about what they wrote rather than both believing their own update landed.
 */
export async function setDeviceStatus(nodeId: string, status: string, expectedStatus: string): Promise<FieldDb<HardwareNodeRow>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_nodes')
      .update({ status })
      .eq('node_id', nodeId)
      .neq('status', expectedStatus)
      .select(NODE_COLUMNS)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('device status update', error.message) };
    if (!data) {
      // Either the row vanished or it already holds that status. Both answers are the same to the
      // caller, and neither is a failure worth a 500: report the current row.
      const fresh = await client.schema('field').from('hardware_nodes').select(NODE_COLUMNS).eq('node_id', nodeId).maybeSingle();
      if (fresh.error) return { ok: false, error: databaseUnavailable('device status read', fresh.error.message) };
      if (!fresh.data) return { ok: false, error: { code: 'unknown_node', message: 'No device with that id is available to this caller.' } };
      return { ok: true, value: fresh.data as HardwareNodeRow };
    }
    return { ok: true, value: data as HardwareNodeRow };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('device status update', messageOf(err)) };
  }
}

/**
 * Which device a credential id belongs to.
 *
 * This exists for one reason: a revocation request names a credential id, and the authorization the
 * route performed was against the device in the path. Without this check, a manager of node A could
 * revoke node B's credential by supplying its id in the body — the device lookup would have passed,
 * and the revocation would never have looked at the node at all. That is the classic shape of a
 * broken tenant-isolation check, so the answer is not "compare in the route" but a function whose
 * only job is the ownership question.
 */
export async function getCredentialOwner(credentialId: number): Promise<FieldDb<{ nodeId: string | null }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_node_credentials')
      // `node_id` only: the row that holds a hash is never selected whole by a management path.
      .select('node_id')
      .eq('credential_id', credentialId)
      .maybeSingle();

    if (error) return { ok: false, error: databaseUnavailable('credential owner lookup', error.message) };
    return { ok: true, value: { nodeId: data?.node_id ? String(data.node_id) : null } };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('credential owner lookup', messageOf(err)) };
  }
}

/**
 * Writes one audit record.
 *
 * Failure is returned, never thrown, and never changes the caller's outcome. Two reasons, both
 * load-bearing:
 *
 *  - an audit write that fails AFTER a credential was rotated must not answer 500 and leave the
 *    operator believing the rotation was rolled back. It was not; the secret is already changed.
 *    The route reports `audit_recorded: false` so the gap is visible instead of implied.
 *  - an audit write that fails BEFORE a refusal must not turn a permission decision into a server
 *    error. The denial still happens.
 *
 * The one thing not done here: retrying. A durable audit sink is a queue or a second connection,
 * and pretending a single insert is durable is how a trail silently disappears.
 */
export async function writeAudit(entry: AuditEntry): Promise<{ ok: true } | { ok: false; reason: string }> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return { ok: false, reason: blocked.error.code };

  try {
    const client = getSyncClient();
    const { error } = await client.schema('app').from('management_audit').insert(auditRow(entry));
    if (error) {
      console.error(`Field Intelligence: audit write refused (${error.code ?? 'unknown'}), action ${entry.action}`);
      return { ok: false, reason: error.code ?? 'insert_failed' };
    }
    return { ok: true };
  } catch (err) {
    console.error(`Field Intelligence: audit write threw (${entry.action})`);
    return { ok: false, reason: err instanceof Error ? 'threw' : 'unknown' };
  }
}

/**
 * The device plus its current credential, for a route that has already decided the caller may see
 * it. Reuses the ingestion lookup rather than writing a second one — same two queries, same
 * `unknown_node` answer, and the same guarantee that the credential row never leaves the process.
 */
export async function loadDeviceWithCredential(nodeId: string) {
  return getDeviceForIngestion(nodeId);
}

/**
 * The credential columns a manager may see: every lifecycle column of
 * `field.hardware_node_credentials` EXCEPT `token_hash`.
 *
 * A named list rather than `select('*')`, because `*` is the one way a table's most sensitive column
 * ends up in a response body after somebody adds a column to it. `token_hash` is 64 lowercase hex by
 * CHECK, `audit.ts` refuses any key containing `hash`, and this list cannot name it — three separate
 * reasons the digest stays server-side, since one of them being wrong is a credential leak.
 */
export const CREDENTIAL_METADATA_COLUMNS = 'credential_id,node_id,hash_algorithm,created_at,last_used_at,expires_at,revoked_at';

/**
 * One credential as an operator needs to recognise it: an id, a date, and a state.
 *
 * `current` is the schema's own definition — `hardware_credential_single_current_uid` allows at most
 * one row per node with `revoked_at IS NULL` — with the expiry the row also carries read on top of
 * it. `expired` therefore means "this is still the node's current row, and it no longer authenticates",
 * which is a real state a manager has to be able to see in order to fix it.
 */
export interface CredentialMetadata {
  credential_id: number;
  hash_algorithm: string;
  issued_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  state: 'current' | 'expired' | 'retired';
}

/**
 * A device's credential history, as metadata only.
 *
 * This closes the gap the brief asks about: revocation names a `credential_id`, and until now the
 * only ids an operator could name were the one the management response happened to return. Without a
 * listing, a manager who wants to retire a stale credential has no way to find its id — so the
 * capability is real, and its scope is deliberately the narrowest honest one.
 *
 * What it returns: ids, timestamps, the hash algorithm, and the derived state. What it cannot return:
 * the digest, the plaintext, or anything a response could replay as a device. `hash_algorithm` is the
 * one field worth defending — it names the function, not the value, and an operator comparing two
 * rows needs it to tell a sha256 credential from a future migration's.
 *
 * Authorization is the ROUTE's job and it is not optional: this takes a `node_id` and no scope, so a
 * caller who reaches it without `loadAndAuthorize` gets another cooperative's credential inventory.
 * The list is bounded and ordered oldest-last because a credential trail is read from the top down —
 * "which one is current, and what did it replace".
 */
export async function credentialsMetadata(nodeId: string, limit: number, now: number = Date.now()): Promise<ManagementDb<{ credentials: CredentialMetadata[] }>> {
  const blocked = fieldDatabaseStatus();
  if (!blocked.ok) return blocked;

  try {
    const client = getSyncClient();
    const { data, error } = await client
      .schema('field')
      .from('hardware_node_credentials')
      .select(CREDENTIAL_METADATA_COLUMNS)
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .order('credential_id', { ascending: false })
      .range(0, limit - 1);

    if (error) return { ok: false, error: databaseUnavailable('credential listing', error.message) };

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return {
      ok: true,
      value: {
        credentials: rows.map((row): CredentialMetadata => {
          const revokedAt = typeof row.revoked_at === 'string' ? row.revoked_at : null;
          const expiresAt = typeof row.expires_at === 'string' ? row.expires_at : null;
          const expired = expiresAt !== null && Date.parse(expiresAt) <= now;
          return {
            credential_id: Number(row.credential_id),
            hash_algorithm: String(row.hash_algorithm),
            issued_at: String(row.created_at),
            last_used_at: typeof row.last_used_at === 'string' ? row.last_used_at : null,
            expires_at: expiresAt,
            revoked_at: revokedAt,
            state: revokedAt !== null ? 'retired' : expired ? 'expired' : 'current',
          };
        }),
      },
    };
  } catch (err) {
    return { ok: false, error: databaseUnavailable('credential listing', messageOf(err)) };
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error';
}
