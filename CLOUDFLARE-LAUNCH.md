# Cloudflare production launch — October 2–3, 2026

Repository configuration is supplied; account provisioning and live validation are pending. This task's `wrangler whoami` returned **not authenticated**. No credentials, account IDs, database IDs or production results have been invented. Commands below run from the repository root with Node 24+. Wrangler 4.146.0 is pinned in these commands; the application still needs no installed dependencies.

## 1. Authenticate and bind the database

```sh
npx --yes wrangler@4.146.0 login
npx --yes wrangler@4.146.0 whoami
npx --yes wrangler@4.146.0 d1 list
```

Select the approved Cloudflare account. If more than one is available, set `CLOUDFLARE_ACCOUNT_ID` in your shell to its actual account ID. For noninteractive deployment, supply an account-scoped `CLOUDFLARE_API_TOKEN` through the deployment environment, with Workers Scripts write, D1 write and Account Settings read access. Custom-domain setup also needs the appropriate zone access. Never commit the token.

If `mighty-matt-poll` does not already exist in that account:

```sh
npx --yes wrangler@4.146.0 d1 create mighty-matt-poll
```

Replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` in `wrangler.jsonc` with the actual returned D1 UUID. Keep `binding: "DB"`, `database_name: "mighty-matt-poll"` and `migrations_dir: "db"`. The ID is not a secret; it can be committed once verified. Do not copy a local test database into production.

```sh
npm run build
npm test
npx --yes wrangler@4.146.0 d1 migrations list DB --remote
npx --yes wrangler@4.146.0 d1 migrations apply DB --remote
npx --yes wrangler@4.146.0 deploy
```

The migration command applies `db/001_poll.sql` and tracks it in D1's migration table, so subsequent runs skip it. Do not separately execute the raw SQL and then apply it as a migration. If reusing a database whose tables were created manually, inspect its schema and migration history before proceeding; do not recreate or drop its tables. The first deployment fails closed for collection while runtime settings are absent.

## 2. Set host-side runtime values

In Cloudflare → Workers & Pages → `mighty-matt-kit` → Settings → Variables and Secrets, add the following. Save/deploy the settings. `keep_vars: true` preserves dashboard variables across later Wrangler deploys; secrets are preserved as well. Do not add a `vars` block containing these values to the repository.

| Name | Type | Value |
| --- | --- | --- |
| `POLL_SECRET` | Secret | Strong random value of at least 32 characters; reuse the established value if this poll already collected data. |
| `ADMIN_TOKEN` | Secret | Separate strong random value of at least 32 characters if staff entry is needed; leave absent to disable staff entry. |
| `ALLOWED_ORIGIN` | Text | Exact canonical HTTPS origin, no trailing slash. Use `https://mightymattkit.com` if apex serves the page, or `https://www.mightymattkit.com` if the permanent URL redirects to `www`. |
| `PREVIEW_MODE` | Text | `false` for production. This is a label, not a separate database or collection switch. |
| `POLL_ENABLED` | Text | `false` during setup; `true` for the controlled live check and then campaign collection after cleanup. |

Secrets can instead be entered at Wrangler's prompts:

```sh
npx --yes wrangler@4.146.0 secret put POLL_SECRET
# Optional, only for staff entry:
npx --yes wrangler@4.146.0 secret put ADMIN_TOKEN
```

Generate each secret independently in a password manager and retain it securely. Do not rotate `POLL_SECRET` casually: changing it changes the stored duplicate-marker hashes.

## 3. Connect the same-origin campaign URL

The browser requests relative `/api/*` URLs and the Worker requires same-origin POSTs. A separate backend URL alone does not activate the Vercel-hosted poll. This launch configuration serves both the existing `dist` site and its API through one Worker; it is not a cross-origin API configuration.

In the approved account, ensure the campaign DNS zone is active in Cloudflare. On `mighty-matt-kit` → Settings → Domains & Routes → Add → Custom Domain, enter the chosen canonical hostname (`mightymattkit.com` or `www.mightymattkit.com`). Review the existing Vercel DNS record before replacing it with the Worker custom-domain mapping. Route the other hostname to the canonical origin with an HTTPS redirect, preserving paths and query strings. If the domain is not in this account, zone onboarding/domain control is an additional account-side prerequisite; do not guess nameservers or record targets.

Set `ALLOWED_ORIGIN` to that exact canonical origin. For a preliminary workers.dev check, temporarily use the **actual URL printed by deploy** as `ALLOWED_ORIGIN`, then restore the canonical value and repeat the check there. This repository intentionally contains no guessed workers.dev hostname or custom-domain route.

Confirm the page, `/api/status`, and `/api/results` all reach this Worker at the canonical hostname over HTTPS. Check the permanent QR destination's final redirect target too. The following live test must run before public collection, with `POLL_ENABLED=true`. Leave collection disabled if setup or validation fails.

## 4. Verify the live contract and remove the test response

Run this in a controlled launch window. It creates **one explicitly synthetic response**, with no contact details. It checks actual JSON responses, a successful save, retry/duplicate rejection, cookie fallback, status after submission, aggregate counts and the aggregate-only response shape. Run from the repository root. Set `CAMPAIGN_ORIGIN` to the actual canonical origin chosen above; this example uses apex.

```sh
export CAMPAIGN_ORIGIN=https://mightymattkit.com
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {version} from './dist/poll-schema.js';
const origin = process.env.CAMPAIGN_ORIGIN;
assert.equal(new URL(origin).origin, origin, 'Use the canonical origin without a path or trailing slash');
const marker = crypto.randomUUID();
const request = async (path, body, headers = {}) => {
  const r = await fetch(origin + path, {
    redirect: 'error',
    method: body ? 'POST' : 'GET',
    headers: {'X-Poll-Device': marker, ...(body ? {'Content-Type': 'application/json', Origin: origin} : {}), ...headers},
    ...(body ? {body: JSON.stringify(body)} : {})
  });
  assert.match(r.headers.get('content-type') || '', /application\/json/);
  return {status: r.status, data: await r.json(), cookie: r.headers.get('set-cookie')};
};
let r = await request('/api/status');
assert.equal(r.status, 200);
assert.deepEqual(r.data, {accepting: true, preview: false, submitted: false});
const before = await request('/api/results');
assert.equal(before.status, 200);
const body = {version, current: ['barn'], placement: 'vehicle', concerns: ['bleeding'],
  priorities: ['portability', 'accessibility'], usefulness: 'depends',
  improvement: 'LAUNCH TEST ONLY — remove before campaign collection',
  currentOther: '', placementOther: '', concernsOther: '',
  contactName: '', contactEmail: '', contactConsent: false};
r = await request('/api/poll', body);
// Print cleanup ID before assertions so it remains available if a later check fails.
if (r.data.id) console.log('TEST_RESPONSE_ID=' + r.data.id);
assert.equal(r.status, 201);
assert.equal(r.data.saved, true);
const id = r.data.id;
assert.match(r.cookie || '', /HttpOnly/);
assert.match(r.cookie || '', /Secure/);
const cookie = r.cookie.split(';')[0];
assert.equal((await request('/api/poll', body)).status, 409); // retry after lost confirmation
assert.equal((await request('/api/poll', body, {'X-Poll-Device': crypto.randomUUID(), Cookie: cookie})).status, 409);
r = await request('/api/status', null, {'X-Poll-Device': crypto.randomUUID(), Cookie: cookie});
assert.equal(r.status, 200);
assert.equal(r.data.submitted, true);
const after = await request('/api/results');
assert.equal(after.status, 200);
assert.deepEqual(Object.keys(after.data).sort(), ['version', 'total', 'placement', 'usefulness', 'priorities', 'generatedAt'].sort());
assert.equal(after.data.version, version);
assert.equal(after.data.total, before.data.total + 1);
for (const [field, value] of [['placement', 'vehicle'], ['usefulness', 'depends'], ['priorities', 'portability'], ['priorities', 'accessibility']]) {
  assert.equal(after.data[field][value], (before.data[field][value] || 0) + 1);
}
assert.ok(!JSON.stringify(after.data).includes(id));
assert.ok(!JSON.stringify(after.data).includes(body.improvement));
console.log('Live checks passed. Remove only TEST_RESPONSE_ID before opening collection.');
JS
```

If a test fails after saving, retain the printed ID and clean it up before retrying. If the response was lost before an ID was printed, inspect D1 for the exact launch-test text and timestamp and confirm the row manually; never delete all responses or all responses from a date. Do not simulate backend outages on the campaign database: the existing local suite covers transaction failures and safe retry without risking real data.

In the following commands replace `TEST_RESPONSE_UUID` with the exact UUID printed above. These are targeted authenticated D1 administration commands, not public API endpoints:

```sh
npx --yes wrangler@4.146.0 d1 execute DB --remote --command "SELECT id, improvement FROM responses WHERE id='TEST_RESPONSE_UUID'; SELECT COUNT(*) AS contacts_for_test FROM contacts WHERE response_id='TEST_RESPONSE_UUID';"
# Verify this is the synthetic launch response and contacts_for_test is 0, then:
npx --yes wrangler@4.146.0 d1 execute DB --remote --command "DELETE FROM responses WHERE id='TEST_RESPONSE_UUID' AND improvement='LAUNCH TEST ONLY — remove before campaign collection';"
npx --yes wrangler@4.146.0 d1 execute DB --remote --command "SELECT COUNT(*) AS remaining FROM responses WHERE id='TEST_RESPONSE_UUID'; SELECT COUNT(*) AS remaining_contacts FROM contacts WHERE response_id='TEST_RESPONSE_UUID';"
curl --fail-with-body "$CAMPAIGN_ORIGIN/api/results"
```

Both remaining counts must be 0. In the controlled window, aggregate counts must return to the baseline observed before the test. Do not remove genuine campaign responses to force a baseline match. Record the deployed URL, migration success, checks and cleanup outcome in `DELIVERY.md`. No live-check success is claimed until these steps actually run.

After cleanup and domain verification, leave `POLL_ENABLED=true`, `PREVIEW_MODE=false`, and the canonical `ALLOWED_ORIGIN` in the host. To pause collection, set `POLL_ENABLED=false`; do not delete the database or rotate the poll secret. Confirm the retention period, backup owner and existing content approvals before public collection.

Configuration references: [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [static asset binding](https://developers.cloudflare.com/workers/static-assets/binding/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
