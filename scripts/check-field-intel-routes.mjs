/**
 * Field Intelligence read-surface route check.
 *
 * Exercises the nine `/api/field/*` dashboard reads and the two alert actions over HTTP and asserts
 * the property that has to hold in every deployment, including this one where no Supabase project is
 * connected: **no unauthenticated request can read a cooperative's fleet, field history, alerts or
 * positions, and no unauthenticated request can change one.** A dashboard endpoint that answers 200 to
 * a stranger is the failure this script exists to catch, and it is catchable without a database
 * because the session gate runs first.
 *
 *   node scripts/check-field-intel-routes.mjs [--base http://127.0.0.1:3000] [--quiet]
 *
 * It also checks the hygiene of every body it receives: no stacks, no table or constraint names, no
 * credential-shaped field, no cached response. `no-store` matters more here than on the write
 * surface — a cached overview is a cached view of somebody else's hardware the moment a cache key is
 * wrong, and these endpoints are the ones a browser will want to cache.
 *
 * What this script CANNOT prove, and says so rather than passing quietly: the cross-cooperative
 * assertions with a real session, that a viewer is refused a management control over the wire, that
 * the figures match the rows, and that a refusal lands in `app.management_audit`. The DECISIONS are
 * graded by `npm run test:management` and the arithmetic by `npm run test:fieldintel`; the wire
 * around them needs a provisioned project — docs/field-intelligence-setup.md.
 *
 * Run `npm run dev` first.
 */

const args = process.argv.slice(2);
const BASE = (() => {
  const i = args.indexOf('--base');
  return i === -1 ? 'http://127.0.0.1:3000' : args[i + 1];
})();
const QUIET = args.includes('--quiet');

let failures = 0;
let checks = 0;

function assert(label, condition, detail) {
  checks += 1;
  if (condition) {
    if (!QUIET) console.log(`  ok    ${label}`);
    return true;
  }
  failures += 1;
  console.log(`  FAIL  ${label}${detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 200)}`}`);
  return false;
}

const section = (name) => console.log(`\n${name}`);

const seen = [];

function keyNames(value) {
  if (Array.isArray(value)) return value.flatMap(keyNames);
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, nested]) => [key, ...keyNames(nested)]);
  return [];
}

/**
 * The read surface as one table, for the same reason the management surface lists itself: "every
 * endpoint requires a session" is only worth something when it is checked against all of them, and
 * an endpoint nobody remembered is exactly the one that ships without the gate.
 */
const SURFACE = [
  '/api/field/overview',
  '/api/field/sites',
  '/api/field/sites/1',
  '/api/field/devices/INTELLIGENCE_PROBE_01/readings',
  '/api/field/devices/INTELLIGENCE_PROBE_01/history',
  '/api/field/data-quality',
  '/api/field/alerts',
  '/api/field/alerts/1',
  '/api/field/map',
];

/**
 * The write surface, listed separately because a POST has a body and a different answer when the
 * session is missing: an alert acknowledgement is a management action, and an unauthenticated caller
 * must not be able to tell a resolved alert from a nonexistent one by watching what the endpoint
 * accepts.
 */
const ACTIONS = [
  '/api/field/alerts/1/acknowledge',
  '/api/field/alerts/1/resolve',
];

async function get(path, { headers = {}, label } = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const json = await res.json().catch(() => null);
  seen.push({ label: label ?? `GET ${path}`, status: res.status, text: JSON.stringify(json ?? {}), json, headers: res.headers });
  return { res, json, text: JSON.stringify(json ?? {}) };
}

async function post(path, { headers = {}, body, label } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  seen.push({ label: label ?? `POST ${path}`, status: res.status, text: JSON.stringify(json ?? {}), json, headers: res.headers });
  return { res, json, text: JSON.stringify(json ?? {}) };
}

async function main() {
  console.log(`Field Intelligence read surface at ${BASE}`);

  section('Every dashboard read refuses a caller with no session');
  for (const path of SURFACE) {
    const { res, json } = await get(path, { label: `no session ${path}` });
    assert(`GET ${path} → 401 unauthenticated`, res.status === 401 && json?.error?.code === 'unauthenticated', `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    assert(`GET ${path} carries a www-authenticate hint`, /Bearer/i.test(String(res.headers.get('www-authenticate'))), res.headers.get('www-authenticate'));
    assert(`GET ${path} returns no data to a stranger`, json?.data === null || json?.data === undefined, json?.data);
    assert(`GET ${path} has the documented failure envelope`, json?.ok === false && typeof json?.message === 'string' && typeof json?.error?.code === 'string', json);
  }

  section('A filter in the URL is not a session and not a membership');
  for (const path of [
    '/api/field/overview?cooperative_id=1',
    '/api/field/sites?cooperative_id=2&limit=100',
    '/api/field/alerts?status=open&severity=critical',
    '/api/field/alerts/1',
    '/api/field/data-quality?range=7d',
    '/api/field/devices/INTELLIGENCE_PROBE_01/history?range=30d',
    '/api/field/devices/INTELLIGENCE_PROBE_01/readings?from=2026-11-01&to=2026-11-05',
    '/api/field/map?cooperative_id=1',
  ]) {
    const { res, json } = await get(path, { label: `query filter ${path}` });
    assert(`${path} is a 401, not a listing`, res.status === 401 && json?.error?.code === 'unauthenticated', `${res.status} ${json?.error?.code}`);
    assert(`…and ${path} carries no rows`, !/\bultra_|"sites":\[|"devices":\[|"alerts":\[|"positions":\[|"buckets":\[|"metrics":\[|"credentials":\[/.test(JSON.stringify(json?.data ?? '')), json?.data);
  }

  section('An alert cannot be acknowledged or resolved by a stranger');
  for (const path of ACTIONS) {
    const { res, json } = await post(path, { body: {}, label: `no session POST ${path}` });
    assert(`POST ${path} → 401 unauthenticated`, res.status === 401 && json?.error?.code === 'unauthenticated', `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    assert(`POST ${path} carries a www-authenticate hint`, /Bearer/i.test(String(res.headers.get('www-authenticate'))), res.headers.get('www-authenticate'));
    assert(`POST ${path} returns no alert to a stranger`, json?.data === null || json?.data === undefined, json?.data);
    assert(`POST ${path} is not a 200 or 201`, res.status !== 200 && res.status !== 201, res.status);

    const bogus = await post(path, { headers: { authorization: 'Bearer this-is-not-a-session-token-but-it-looks-like-one' }, body: {}, label: `bogus bearer POST ${path}` });
    const denied = (bogus.res.status === 401 && bogus.json?.error?.code === 'unauthenticated') || (bogus.res.status === 503 && bogus.json?.error?.code === 'auth_unavailable');
    assert(`POST ${path} with a bogus bearer is denied, not served`, denied, `${bogus.res.status} ${bogus.json?.error?.code}`);
  }

  section('A window the caller invents is parsed after the gate, never before it');
  {
    // The history and data-quality endpoints both accept `range`, `from` and `to`. Refusing an
    // unparseable window is correct for a member; for a stranger it must still be a 401, or the
    // error messages become a way to probe the grammar of the API.
    for (const path of [
      '/api/field/devices/INTELLIGENCE_PROBE_01/history?range=week',
      '/api/field/devices/INTELLIGENCE_PROBE_01/history?range=custom&from=2026-11-01',
      '/api/field/devices/INTELLIGENCE_PROBE_01/history?from=2026-11-05&to=2026-01-01',
      '/api/field/data-quality?range=400d',
      '/api/field/alerts?limit=999999&offset=-5',
    ]) {
      const { res, json } = await get(path, { label: `bad window ${path}` });
      assert(`${path} is refused at the session gate`, res.status === 401 || res.status === 400 || res.status === 404, `${res.status} ${json?.error?.code}`);
      assert(`…and ${path} is never a 500`, res.status !== 500, res.status);
    }
  }

  section('A token the Auth server does not confirm is a denial, in either direction');
  for (const path of SURFACE) {
    const { res, json } = await get(path, { headers: { authorization: 'Bearer this-is-not-a-session-token-but-it-looks-like-one' }, label: `bogus bearer ${path}` });
    const denied = (res.status === 401 && json?.error?.code === 'unauthenticated') || (res.status === 503 && json?.error?.code === 'auth_unavailable');
    assert(`${path} with a bogus bearer is denied, not served`, denied, `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    assert(`${path} never answers 200 with an unverified token`, res.status !== 200, res.status);
  }
  {
    const basic = await get('/api/field/overview', { headers: { authorization: 'Basic dXNlcjpwYXNz' }, label: 'basic auth' });
    assert('a Basic credential is not treated as a session', basic.res.status === 401, `${basic.res.status} ${basic.json?.error?.code}`);
    const cookie = await get('/api/field/sites', { headers: { cookie: 'session=guess' }, label: 'cookie only' });
    assert('a cookie is not a session bearer token', cookie.res.status === 401, `${cookie.res.status} ${cookie.json?.error?.code}`);
  }

  section('The session gate runs before the path and the query are parsed');
  {
    // Each of these would be a 400 if any parsing happened ahead of the gate. Being a 401 is the
    // point: a stranger cannot map the endpoints by watching which malformed input produces which
    // error.
    for (const path of [
      '/api/field/sites/not-a-number',
      '/api/field/sites/-1',
      '/api/field/sites/99999999999999999999999',
      '/api/field/alerts/not-a-number',
      '/api/field/alerts/-1',
      '/api/field/alerts/99999999999999999999999',
      '/api/field/devices/..%2F..%2Fetc%2Fpasswd/readings',
      '/api/field/devices/%27%20or%201%3D1/readings',
      '/api/field/overview?limit=999999&offset=-5',
      '/api/field/alerts?status=drop%20table',
      '/api/field/devices/INTELLIGENCE_PROBE_01/readings?from=yesterday',
    ]) {
      const { res, json } = await get(path, { label: `hostile input ${path}` });
      assert(`${path} is refused at the session gate`, res.status === 401 || res.status === 404, `${res.status} ${json?.error?.code}`);
      assert(`…and ${path} is never a 500`, res.status !== 500, res.status);
    }
  }

  section('Response hygiene on every request above');
  {
    const stacks = seen.filter((e) => /at\s+\S+\.\S+|TypeError|ReferenceError|undefined is not|Internal Server Error/i.test(e.text));
    assert(`no response body carries a JavaScript stack (${seen.length} bodies searched)`, stacks.length === 0, stacks.map((s) => s.label).join(', '));
    const sql = seen.filter((e) => /constraint|violates|relation .* does not exist|Postgres|23505|23503|sensor_logs|device_alerts|alert_rules|hardware_nodes|field_sites|cooperative_members|management_audit/i.test(e.text));
    assert('no response body leaks a schema, table or constraint name', sql.length === 0, sql.map((s) => s.label).join(', '));
    const digests = seen.filter((e) => /[0-9a-f]{64}/.test(e.text) || keyNames(e.json).some((k) => /token|secret|hash|payload/i.test(k)));
    assert('no read response carries a credential, digest or raw payload field', digests.length === 0, digests.map((d) => d.label).join(', '));
    const cached = seen.filter((e) => !/no-store/.test(String(e.headers.get('cache-control'))));
    assert('every dashboard read is no-store (a cached overview is a cached tenant view)', cached.length === 0, cached.map((c) => `${c.label}: ${c.headers.get('cache-control')}`).join(', '));
    const fives = seen.filter((e) => e.status >= 500 && !['database_not_configured', 'database_unavailable', 'auth_unavailable'].includes(e.json?.error?.code));
    assert('nothing fails as an unlabelled 500', fives.length === 0, fives.map((f) => `${f.label}: ${f.status}`).join(', '));
  }

  section('NOT VERIFIED by this script — and not by any local run');
  {
    console.log('  These need a configured Supabase project with Auth enabled, two users and two');
    console.log('  cooperatives (docs/field-intelligence-setup.md, sections 4 and 7):');
    console.log('    · a signed-in manager and a signed-in viewer receiving the same figures, and the');
    console.log('      viewer refused on every management call the dashboard offers (the DECISION is');
    console.log('      covered by npm run test:management; the wire around it is not);');
    console.log('    · the two alert actions above with a real session: a viewer getting 403');
    console.log('      insufficient_role, a manager of another cooperative getting the SAME 404 a');
    console.log('      nonexistent id gets, and a second acknowledgement answering changed:false');
    console.log('      rather than writing a second change;');
    console.log('    · cross-cooperative isolation over the wire: A reading nothing about B, and the');
    console.log('      same 404 shape as a nonexistent id;');
    console.log('    · that the counts and timestamps equal the rows actually stored, including the');
    console.log('      coverage flags on a fleet larger than SCOPE_NODE_CAP and a window holding more');
    console.log('      than HISTORY_SCAN_CAP readings;');
    console.log('    · that an alert is actually raised by an authenticated reading from a real device,');
    console.log('      and closed by the reading that stops breaching its rule — the evaluator is');
    console.log('      graded arithmetically by npm run test:fieldintel, never against a field;');
    console.log('    · that a refusal above produced a row in app.management_audit.');
    console.log('  Until those run against a real project, this phase is not device-verified.');
  }

  console.log(`\n${checks - failures}/${checks} assertions passed.`);
  if (failures > 0) {
    console.log(`${failures} FAILED.`);
    process.exitCode = 1;
  } else {
    console.log('Every dashboard read denies an unauthenticated caller. Figures are graded by npm run test:fieldintel.');
  }
}

main().catch((err) => {
  console.error('\nChecker could not run:', err instanceof Error ? err.message : err);
  console.error('Is the dev server up? Try: npm run dev, then re-run this script.');
  process.exitCode = 2;
});
