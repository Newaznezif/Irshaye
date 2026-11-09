/**
 * Field Intelligence route check.
 *
 * Exercises `/api/v1/hardware/logs` over HTTP the way device firmware does, and asserts the
 * contract the setup documentation promises: which refusal each malformed request produces, which
 * status it carries, that nothing is cached, and — the part that matters most — that no response
 * ever contains the submitted device secret, a stack trace, or a database detail.
 *
 *   node scripts/check-field-routes.mjs [--base http://127.0.0.1:3000] [--quiet]
 *
 * It writes NOTHING. Every request it sends is refused before the insert step, either by the
 * payload rules or, for a well-formed probe, by the database: with no Supabase project connected
 * that is `503 database_not_configured`, and with one connected it is `404 unknown_node` because
 * the probe node ids are not registered. Both are accepted here, and which one happened is
 * printed, so the same script is honest on a laptop and on a provisioned deployment — and a `201`
 * for a node that was never provisioned would be the failure it catches.
 *
 * Run `npm run dev` first. `npm run check:data` covers the read routes; this covers the write one.
 */

const args = process.argv.slice(2);
const BASE = (() => {
  const i = args.indexOf('--base');
  return i === -1 ? 'http://127.0.0.1:3000' : args[i + 1];
})();
const QUIET = args.includes('--quiet');

const ENDPOINT = '/api/v1/hardware/logs';
/** Distinctive so a leak of it in any response body is unmistakable. */
const PROBE_SECRET = 'PROBE_ONLY_DEVICE_SECRET_0123456789ab';
const MAX_BODY_BYTES = 8192;

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

/** Bodies collected so the secrets-hygiene pass can search every one of them at the end. */
const seen = [];

/** Every key name in a parsed body, so "names a field" can be told from "echoes a value". */
function keyNames(value) {
  if (Array.isArray(value)) return value.flatMap(keyNames);
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, nested]) => [key, ...keyNames(nested)]);
  return [];
}

async function post(body, init = {}) {
  const res = await fetch(`${BASE}${ENDPOINT}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...init.headers },
    ...init,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  const text = JSON.stringify(json ?? {});
  seen.push({ label: init.__label ?? `${res.status}`, status: res.status, text, json, headers: res.headers });
  return { res, json, text };
}

const section = (name) => console.log(`\n${name}`);

const reading = (over = {}) => ({
  node_id: 'FIELD_INTELLIGENCE_PROBE_01',
  secret_token: PROBE_SECRET,
  soil_moisture: 41.5,
  measured_at: new Date(Date.now() - 60_000).toISOString(),
  ...over,
});

/** Deletes a key entirely, which is what "not sent" means in JSON. */
const without = (key) => {
  const body = reading();
  delete body[key];
  return body;
};

async function main() {
  console.log(`Field Intelligence routes at ${BASE}`);

  section('GET — the endpoint describes itself');
  {
    const res = await fetch(`${BASE}${ENDPOINT}`, { headers: { accept: 'application/json' } });
    const json = await res.json().catch(() => null);
    const text = JSON.stringify(json ?? {});
    seen.push({ label: 'GET descriptor', status: res.status, text, json, headers: res.headers });
    assert('GET answers 200', res.status === 200, res.status);
    assert('it names the method and content type a device must use', json?.data?.method === 'POST' && json?.data?.content_type === 'application/json', json?.data);
    assert('it states the byte ceiling', json?.data?.max_body_bytes === MAX_BODY_BYTES, json?.data?.max_body_bytes);
    assert('it states the clock-drift allowance in seconds', typeof json?.data?.rules?.clock_drift_tolerance_seconds === 'number', json?.data?.rules);
    assert('it says the rate limit is not shared across processes', json?.data?.rules?.rate_limit?.shared === false, json?.data?.rules?.rate_limit);
    assert('it reports the database state as a boolean, not a value', typeof json?.data?.database_configured === 'boolean', json?.data?.database_configured);
    assert('it points at the setup documentation', typeof json?.data?.setup_documentation === 'string', json?.data?.setup_documentation);
    assert('every answer is marked no-store', res.headers.get('cache-control') === 'no-store', res.headers.get('cache-control'));
    console.log(`  note  database_configured=${json?.data?.database_configured} — writes are refused with 503 when it is false, 404 when it is true.`);
  }

  section('POST — request-level refusals, before any payload rule');
  {
    const form = await post('node_id=FIELD_INTELLIGENCE_PROBE_01', { headers: { 'content-type': 'application/x-www-form-urlencoded' }, __label: 'form post' });
    assert('a form POST is refused with invalid_content_type', form.res.status === 400 && form.json?.error?.code === 'invalid_content_type', `${form.res.status} ${form.json?.error?.code}`);
    const plain = await post(JSON.stringify(reading()), { headers: { 'content-type': 'text/plain' }, __label: 'plain' });
    assert('a text/plain body is refused the same way', plain.res.status === 400 && plain.json?.error?.code === 'invalid_content_type', `${plain.res.status} ${plain.json?.error?.code}`);
    const huge = await post(JSON.stringify(reading({ blob: 'x'.repeat(MAX_BODY_BYTES * 2) })), { __label: 'oversize' });
    assert('an oversize body is refused with 413, not 400', huge.res.status === 413 && huge.json?.error?.code === 'payload_too_large', `${huge.res.status} ${huge.json?.error?.code}`);
    assert('the oversize refusal states the limit', typeof huge.json?.error?.message === 'string' && huge.json.error.message.includes(String(MAX_BODY_BYTES)), huge.json?.error?.message);
    const broken = await post('{"node_id":', { __label: 'broken json' });
    assert('truncated JSON is refused with malformed_json', broken.res.status === 400 && broken.json?.error?.code === 'malformed_json', `${broken.res.status} ${broken.json?.error?.code}`);
    const html = await post('<html><body>redirect</body></html>', { __label: 'captive portal' });
    assert('a captive-portal HTML page is refused, not parsed', html.res.status === 400 && html.json?.error?.code === 'malformed_json', `${html.res.status} ${html.json?.error?.code}`);
  }

  section('POST — payload refusals');
  {
    const cases = [
      ['a body that is an array', [reading()], 'invalid_payload'],
      ['a missing node_id', without('node_id'), 'invalid_payload'],
      ['a node_id with a path in it', reading({ node_id: '../../etc/passwd' }), 'invalid_payload'],
      ['a node_id that is a number', reading({ node_id: 12345 }), 'invalid_payload'],
      ['a missing secret_token', without('secret_token'), 'invalid_payload'],
      ['a too-short secret', reading({ secret_token: 'tooshort' }), 'invalid_payload'],
      ['a secret with URL-unsafe characters', reading({ secret_token: 'abc+def=ghi.jklmnop' }), 'invalid_payload'],
      ['a measurement sent as a string', reading({ soil_moisture: '41.5' }), 'invalid_payload'],
      ['a soil moisture above 100', reading({ soil_moisture: 140 }), 'invalid_payload'],
      ['a negative humidity', reading({ humidity: -5 }), 'invalid_payload'],
      ['an impossible temperature', reading({ ambient_temp: -274 }), 'invalid_payload'],
      ['a battery voltage off the scale', reading({ battery_voltage: 240 }), 'invalid_payload'],
      ['a reading with no measurements', { node_id: reading().node_id, secret_token: PROBE_SECRET, measured_at: reading().measured_at }, 'invalid_payload'],
      ['a timestamp from last month', reading({ measured_at: new Date(Date.now() - 40 * 86_400_000).toISOString() }), 'timestamp_out_of_window'],
      ['a timestamp two hours in the future', reading({ measured_at: new Date(Date.now() + 7_200_000).toISOString() }), 'timestamp_out_of_window'],
      ['a timestamp that is not a date', reading({ measured_at: 'not-a-date' }), 'timestamp_out_of_window'],
    ];
    for (const [label, body, code] of cases) {
      const { res, json } = await post(body, { __label: label });
      assert(`${label} → ${code}`, res.status === 400 && json?.error?.code === code, `${res.status} ${json?.error?.code}: ${json?.error?.message}`);
    }
    const boundary = await post(reading({ soil_moisture: 100, ambient_temp: 60, humidity: 0, battery_voltage: 30 }), { __label: 'boundaries' });
    assert('the extreme-but-plausible values on every range are accepted for the right reasons', boundary.res.status !== 400, `${boundary.res.status} ${boundary.json?.error?.code}`);
  }

  section('POST — a well-formed probe reaches the database and is refused there');
  {
    const { res, json } = await post(reading(), { __label: 'probe reading' });
    const code = json?.error?.code;
    const acceptedRefusal = (res.status === 503 && code === 'database_not_configured') || (res.status === 404 && code === 'unknown_node');
    assert('it is refused by storage or registration, never accepted', acceptedRefusal, `${res.status} ${code}: ${json?.error?.message}`);
    assert('and the refusal says nothing was stored or that the node is unknown', /not_configured|unknown_node/.test(String(code)), code);
    assert('it is never a 500 with a stack', res.status !== 500, res.status);
    console.log(`  note  got ${res.status} ${code} — ${json?.error?.message?.slice(0, 120)}`);
  }

  section('POST — the per-device budget');
  {
    // Deliberately a node id no deployment has registered, so every attempt here is a refusal
    // that must still consume budget: throttling is keyed on the identifier, not on success.
    const floodId = 'FIELD_INTELLIGENCE_FLOOD_PROBE';
    let sawLimited = false;
    let limited = null;
    for (let i = 0; i < 26; i += 1) {
      const { res, json } = await post(reading({ node_id: floodId, measured_at: new Date(Date.now() - i * 1000).toISOString() }), { __label: `flood ${i}` });
      if (res.status === 429) {
        sawLimited = true;
        limited = { res, json };
        break;
      }
    }
    assert('a device that submits more than its window budget is refused with 429', sawLimited, 'no 429 in 26 attempts');
    assert('the 429 carries a retry-after header', limited === null || /^\d+$/.test(String(limited.res.headers.get('retry-after'))), limited?.res.headers.get('retry-after'));
    assert('and a retry-after in the body too', limited === null || typeof limited.json?.error?.retryAfterSeconds === 'number', limited?.json?.error);
    assert('the code is rate_limited', limited === null || limited.json?.error?.code === 'rate_limited', limited?.json?.error?.code);
  }

  section('Secrets hygiene across every response above');
  {
    const leaked = seen.filter((entry) => entry.text.includes(PROBE_SECRET));
    assert(`no response body contains the submitted device secret (${seen.length} bodies searched)`, leaked.length === 0, leaked.map((l) => l.label).join(', '));
    // Messages DO name the field — `secret_token must be the 16-128 character credential…` is the
    // instruction a firmware author needs. What must never appear is a `secret_token` KEY holding a
    // value, which is the difference between documenting a field and echoing a credential.
    const echoed = seen.filter((entry) => keyNames(entry.json).includes('secret_token'));
    assert('no response body carries a secret_token FIELD', echoed.length === 0, echoed.map((l) => l.label).join(', '));
    const digests = seen.filter((entry) => /^[0-9a-f]{64}$/.test(String(entry.text).match(/[0-9a-f]{64}/)?.[0] ?? '') || keyNames(entry.json).some((k) => /hash/i.test(k)));
    assert('no response body carries a credential digest or a hash field', digests.length === 0, digests.map((l) => l.label).join(', '));
    const stacks = seen.filter((entry) => /at\s+\S+\.\S+|TypeError|ReferenceError|undefined is not/i.test(entry.text));
    assert('no response body carries a JavaScript stack', stacks.length === 0, stacks.map((l) => l.label).join(', '));
    const sql = seen.filter((entry) => /constraint|violates|relation .* does not exist|index .* for type|Postgres|23505|23503/i.test(entry.text));
    assert('no response body carries a database detail', sql.length === 0, sql.map((l) => l.label).join(', '));
    const cached = seen.filter((entry) => entry.headers.get('cache-control') !== 'no-store');
    assert('every response is no-store', cached.length === 0, cached.map((l) => l.label).join(', '));
    const shapes = seen.filter((entry) => entry.status !== 200 && (entry.json?.ok !== false || typeof entry.json?.message !== 'string' || typeof entry.json?.error?.code !== 'string'));
    assert('every failure has the documented envelope: ok:false, message, error.code', shapes.length === 0, shapes.map((l) => l.label).slice(0, 4).join(', '));
  }

  console.log(`\n${checks - failures}/${checks} assertions passed.`);
  if (failures > 0) {
    console.log(`${failures} FAILED.`);
    process.exitCode = 1;
  } else {
    console.log('The ingestion contract holds for every request this script can send without a database.');
  }
}

main().catch((err) => {
  console.error('\nChecker could not run:', err instanceof Error ? err.message : err);
  console.error('Is the dev server up? Try: npm run dev, then re-run this script.');
  process.exitCode = 2;
});
