/**
 * Device-management route check.
 *
 * Exercises the `/api/hardware/devices*` surface over HTTP and asserts the one property that has to
 * hold in EVERY deployment, including this one where no Supabase project is connected: **no
 * unauthenticated request can read, register, change or provision anything.** A management endpoint
 * that answers 200 to a stranger is the failure this script exists to catch, and it is catchable
 * without a database — the session gate runs first.
 *
 *   node scripts/check-hardware-routes.mjs [--base http://127.0.0.1:3000] [--quiet]
 *
 * What this script CANNOT prove, and says so out loud rather than passing quietly: the
 * cross-cooperative assertions (a manager of Cooperative A refused on Cooperative B's device), the
 * one-time disclosure of a real secret, and the audit rows. Every one of those needs a real Auth
 * server with two users and two real memberships. `npm run test:management` proves the DECISION for
 * those cases with no database at all; running it against a provisioned project is listed as a
 * remaining blocker in the phase report, not as a pass here.
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

const note = (text) => console.log(`  note  ${text}`);
const section = (name) => console.log(`\n${name}`);

/** Bodies collected so the hygiene pass can search every one of them at the end. */
const seen = [];

function keyNames(value) {
  if (Array.isArray(value)) return value.flatMap(keyNames);
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, nested]) => [key, ...keyNames(nested)]);
  return [];
}

/**
 * The endpoints and the methods each exposes, as one table. A new management method has to be added
 * here to be tested, which is the point: the property "every management endpoint requires a session"
 * is only worth anything if it is checked against the WHOLE surface rather than the routes someone
 * remembered.
 */
const SURFACE = [
  ['GET', '/api/hardware/devices'],
  ['POST', '/api/hardware/devices'],
  ['GET', '/api/hardware/devices/INTELLIGENCE_PROBE_01'],
  ['PATCH', '/api/hardware/devices/INTELLIGENCE_PROBE_01'],
  // The listing that answers "which credential should I revoke", and the one read on this surface
  // whose AUTHENTICATED body is metadata rather than a secret. Unauthenticated it must be as silent
  // as every other route here: an id list is a map of who can be locked out.
  ['GET', '/api/hardware/devices/INTELLIGENCE_PROBE_01/credentials'],
  ['POST', '/api/hardware/devices/INTELLIGENCE_PROBE_01/credentials'],
  ['POST', '/api/hardware/devices/INTELLIGENCE_PROBE_01/credentials/rotate'],
  ['POST', '/api/hardware/devices/INTELLIGENCE_PROBE_01/credentials/revoke'],
];

/** A body that WOULD be accepted by the payload rules, to prove the session gate runs before them. */
const registrationBody = {
  node_id: 'INTELLIGENCE_PROBE_01',
  name: 'Probe — must never be registered',
  field_site_id: 1,
};

async function call(method, path, { body, headers = {}, label } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => null);
  const text = JSON.stringify(json ?? {});
  seen.push({ label: label ?? `${method} ${path}`, status: res.status, text, json, headers: res.headers });
  return { res, json, text };
}

const DENIAL_CODES = ['unauthenticated', 'auth_unavailable', 'database_not_configured', 'database_unavailable'];

async function main() {
  console.log(`Device-management routes at ${BASE}`);

  section('The whole surface refuses a caller with no session');
  for (const [method, path] of SURFACE) {
    const { res, json } = await call(method, path, { body: method === 'GET' ? undefined : registrationBody, label: `no session ${method} ${path}` });
    assert(`${method} ${path} → 401 unauthenticated`, res.status === 401 && json?.error?.code === 'unauthenticated', `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    assert(`${method} ${path} carries a www-authenticate hint`, /Bearer/i.test(String(res.headers.get('www-authenticate'))), res.headers.get('www-authenticate'));
    assert(`${method} ${path} returns no data to a stranger`, json?.data === null || json?.data === undefined, json?.data);
    assert(`${method} ${path} is not a 200 or 201`, res.status !== 200 && res.status !== 201, res.status);
  }

  section('A session is checked BEFORE the payload, the path and the database');
  {
    // A body that breaks every rule at once. If any payload or validation error came back, the gate
    // had moved in front of the session check — which is how an unauthenticated caller learns the
    // shape of a form.
    const { res, json } = await call('POST', '/api/hardware/devices', { body: { node_id: '../../etc/passwd', cooperative_id: 999, field_site_id: -1, secret_token: 'x' }, label: 'invalid body, no session' });
    assert('a malformed body with no session is still a 401, not a 400', res.status === 401 && json?.error?.code === 'unauthenticated', `${res.status} ${json?.error?.code}`);
    assert('and the refusal does not explain the payload rules', !/field_site_id|node_id/.test(String(json?.error?.message)), json?.error?.message);

    const badPath = await call('GET', '/api/hardware/devices/..%2F..%2Fetc%2Fpasswd', { label: 'traversal in path, no session' });
    assert('a hostile path segment is refused at the session gate (401/404), never executed', badPath.res.status === 401 || badPath.res.status === 404, `${badPath.res.status} ${badPath.json?.error?.code}`);
    assert('…and it is never a 500', badPath.res.status !== 500, badPath.res.status);
  }

  section('A token the Auth server does not confirm is a denial, in either direction');
  // A sample rather than the whole table, because each call here is slow. Selected by what the path
  // IS instead of by its index, so adding an endpoint above cannot silently change what gets probed.
  for (const [method, path] of SURFACE.filter(([, entry]) => entry === '/api/hardware/devices' || entry.endsWith('/credentials'))) {
    const { res, json } = await call(method, path, {
      headers: { authorization: 'Bearer this-is-not-a-session-token-but-it-looks-like-one' },
      body: method === 'GET' ? undefined : registrationBody,
      label: `bogus bearer ${method} ${path}`,
    });
    // 401 = Auth rejected it. 503 = Auth could not be reached (no project configured here), and the
    // route DENIES rather than proceeding. Both are correct; a 200 would be the incident.
    const denied = (res.status === 401 && json?.error?.code === 'unauthenticated') || (res.status === 503 && json?.error?.code === 'auth_unavailable');
    assert(`${method} ${path} with a bogus bearer is denied, not served`, denied, `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    assert(`${method} ${path} never answers 200 with an unverified token`, res.status !== 200, res.status);
    note(`${method} ${path} answered ${res.status} ${json?.error?.code} — ${DENIAL_CODES.includes(json?.error?.code) ? 'a denial' : 'CHECK THIS'}`);
  }
  {
    const basic = await call('GET', '/api/hardware/devices', { headers: { authorization: 'Basic dXNlcjpwYXNz' }, label: 'basic auth' });
    assert('a Basic credential is not treated as a session', basic.res.status === 401, `${basic.res.status} ${basic.json?.error?.code}`);
    const bare = await call('GET', '/api/hardware/devices', { headers: { authorization: 'Bearer ' }, label: 'bearer with no value' });
    assert('"Bearer " with no token is refused without contacting Auth', bare.res.status === 401 && bare.json?.error?.code === 'unauthenticated', `${bare.res.status} ${bare.json?.error?.code}`);
    const cookie = await call('GET', '/api/hardware/devices', { headers: { cookie: 'session=guess' }, label: 'cookie only' });
    assert('a cookie is not a session bearer token', cookie.res.status === 401, `${cookie.res.status} ${cookie.json?.error?.code}`);
  }

  section('A query string cannot substitute for a membership');
  {
    const q = await call('GET', '/api/hardware/devices?cooperative_id=1', { label: 'cooperative in query, no session' });
    assert('naming a cooperative in the URL is a 401, not a listing', q.res.status === 401, `${q.res.status} ${q.json?.error?.code}`);
    assert('…and the response carries no device array', !Array.isArray(q.json?.data?.devices), q.json?.data);
  }

  section('Response hygiene on every request above');
  {
    const stacks = seen.filter((e) => /at\s+\S+\.\S+|TypeError|ReferenceError|undefined is not|Internal Server Error/i.test(e.text));
    assert(`no response body carries a JavaScript stack (${seen.length} bodies searched)`, stacks.length === 0, stacks.map((s) => s.label).join(', '));
    const sql = seen.filter((e) => /constraint|violates|relation .* does not exist|Postgres|23505|23503|cooperative_members|management_audit/i.test(e.text));
    assert('no response body leaks a schema, table or constraint name', sql.length === 0, sql.map((s) => s.label).join(', '));
    const digests = seen.filter((e) => /[0-9a-f]{64}/.test(e.text) || keyNames(e.json).some((k) => /token|secret|hash/i.test(k)));
    assert('no response body carries a digest or a credential-shaped field', digests.length === 0, digests.map((d) => d.label).join(', '));
    const cached = seen.filter((e) => !/no-store/.test(String(e.headers.get('cache-control'))));
    assert('every management response is no-store (a cached list is a cached tenant breach)', cached.length === 0, cached.map((c) => `${c.label}: ${c.headers.get('cache-control')}`).join(', '));
    const shapes = seen.filter((e) => e.status >= 400 && (e.json?.ok !== false || typeof e.json?.message !== 'string' || typeof e.json?.error?.code !== 'string'));
    assert('every failure has the documented envelope: ok:false, message, error.code, data:null', shapes.length === 0, shapes.map((s) => s.label).slice(0, 5).join(', '));
    const fives = seen.filter((e) => e.status >= 500 && !['database_not_configured', 'database_unavailable', 'auth_unavailable'].includes(e.json?.error?.code));
    assert('nothing fails as an unlabelled 500', fives.length === 0, fives.map((f) => `${f.label}: ${f.status}`).join(', '));
  }

  section('NOT VERIFIED by this script — and not by any local run');
  {
    console.log('  These need a configured Supabase project with Auth enabled, two users and two');
    console.log('  cooperatives (docs/field-intelligence-setup.md, sections 4 and 7):');
    console.log('    · a manager of Cooperative A refused on a Cooperative B device (tenant isolation');
    console.log('      across the wire — the DECISION is covered by npm run test:management, the');
    console.log('      HTTP path around it is not observable without real memberships);');
    console.log('    · the one-time disclosure of a real issued secret, and that no later read of the');
    console.log('      same device ever returns it;');
    console.log('    · GET …/credentials with a REAL manager session: that its rows carry only id,');
    console.log('      dates, hash ALGORITHM and state. The key-hygiene rule above only sees bodies');
    console.log('      this script can cause, and every one of them is a refusal with data:null — the');
    console.log('      authenticated shape is graded by npm run test:fieldintel instead;');
    console.log('    · that a revoked credential stops being accepted by /api/v1/hardware/logs;');
    console.log('    · that app.management_audit holds a row for each action above.');
    console.log('  Until those are run against a real project, this phase is not device-verified.');
  }

  console.log(`\n${checks - failures}/${checks} assertions passed.`);
  if (failures > 0) {
    console.log(`${failures} FAILED.`);
    process.exitCode = 1;
  } else {
    console.log('Every management endpoint denies an unauthenticated caller. Authorization decisions are graded by npm run test:management.');
  }
}

main().catch((err) => {
  console.error('\nChecker could not run:', err instanceof Error ? err.message : err);
  console.error('Is the dev server up? Try: npm run dev, then re-run this script.');
  process.exitCode = 2;
});
