# Mighty Matt agricultural campaign microsite

Campaign microsite with a Cloudflare Worker/D1 launch configuration. `vercel.json` publishes only the static `dist` site; it does not deploy the poll backend. Cloudflare deployment and live validation remain pending account authentication. See [CLOUDFLARE-LAUNCH.md](CLOUDFLARE-LAUNCH.md) for exact launch commands and verification.

## Review and build

Open `review.html` for a standalone visual review without a local server. It contains the complete site, real assets, and navigable poll questions. Submission is unavailable in this standalone file because it has no persistent backend. It does not fabricate results.

This is a dependency-free HTML/CSS/JavaScript site with a Cloudflare Worker-compatible poll API and a SQLite/D1 database. Node 24+ is needed for development and tests; no package installation is required.

From this directory:

```sh
npm run build
npm test
node scripts/review.mjs
npm run dev
```

`npm run dev` starts an optional local preview at http://127.0.0.1:4173 using `.local/preview.sqlite`. Local collection is clearly marked as testing and must never be exported as campaign research. The local preview server was not started during delivery because permission was declined. The approved offline browser run used an in-memory database and no listener.

## Source map

- `dist/index.html`: modular page sections and approved messaging.
- `dist/styles.css`: responsive layout, accessible focus states, reduced motion.
- `dist/config.js`: purchase link and verified ECS contact information.
- `dist/poll-schema.js`: shared question definitions and validation.
- `dist/app.js`: poll steps, optional contact, retries and count-only results.
- `server/worker.js`: production-compatible request handler using prepared D1 queries.
- `db/001_poll.sql`: initial SQLite/D1 schema, schema only; no sample responses.
- `server/local-db.js`: SQLite adapter for local preview and tests.
- `scripts/staff-entry.mjs`: authenticated manual entry of verbal responses; not a public admin screen.
- `ASSET-SOURCES.md`: provenance, excluded material and exact photo-edit prompt.
- `DELIVERY.md`: verification results and remaining launch requirements.

`dist` is authored source, not disposable output. `npm run build` validates it and copies public assets, Worker code and SQL into ignored `build/`. It does not install dependencies, deploy, alter DNS or create QR codes.

## Poll contract

- `GET /api/status`: reports actual backend availability and this device's submission state.
- `POST /api/poll`: validates the versioned response server-side; stores it transactionally; returns 201 after success, 409 for a duplicate, 400 for invalid input, 503 when unavailable. Browser sends a random UUID in `X-Poll-Device`.
- `GET /api/results`: aggregate counts only for the active survey version; no names, contact details, markers or open responses. Can be saved as JSON for manual post-event graphics. Priority questions allow up to three selections, so percentages can exceed 100%.
- `POST /api/admin/poll`: same validated research data, plus a stable UUID `reference`, authorized with the secret `ADMIN_TOKEN` bearer token. Records channel `verbal`. Reusing a reference prevents double entry after a retry. Mary/ECS can later use a small protected interface backed by this route.

Research fields: `version`, `current` (array), `placement`, `concerns` (array), `priorities` (array), `usefulness`, `improvement`, optional `currentOther`, `placementOther`, `concernsOther`; contact fields `contactName`, `contactEmail`, `contactConsent`. See `poll-schema.js` for exact enumerations. Consent must be true to save optional contact information. Nothing requires contact information.

## Duplicate deterrence and privacy

A browser UUID is retained in localStorage and mirrored in an HttpOnly cookie. The server stores only an HMAC of it, with a unique survey/version constraint. Cookie fallback handles lost localStorage; retries and concurrent writes are protected by database uniqueness. Clearing both markers, private browsing, another device, or a scripted client can bypass this. It is lightweight deterrence, not identity verification or a bot defense. No fingerprinting, IP storage or third-party analytics is used. A honeypot, same-origin POST check, bounded request bodies, server validation, and prepared SQL reduce routine misuse.

Private contact data is stored separately with consent and timestamp. Open answers and other-location descriptions are private. Public results select only fixed-choice counts. Keep database/admin access restricted, choose a retention period and backup owner before collection, and process respondent questions via the verified ECS email.

## Production launch with Cloudflare

`wrangler.jsonc` binds `dist` as `ASSETS`, `server/worker.js` as the Worker, and D1 as `DB`, using the existing `db/001_poll.sql` migration. All requests run through the Worker so API routing and its static-response security headers are preserved. `keep_vars` preserves host-managed plain-text settings on subsequent deploys; secrets also remain host-managed. No runtime setting values or credentials are embedded in the configuration.

Follow [CLOUDFLARE-LAUNCH.md](CLOUDFLARE-LAUNCH.md). The only account-specific configuration placeholder is the real D1 database ID. This environment is not authenticated to Cloudflare; no Worker/D1 resource, production binding, secret, DNS change, or live test response was created by this change. Build and all seven existing backend tests pass locally.

The browser uses relative `/api/*` URLs. Serve the campaign page and Worker on the same canonical HTTPS origin. Deploying the Worker at a separate URL while leaving the campaign solely on Vercel does not activate collection. The runbook covers the domain handoff and apex/`www` choice without changing `vercel.json` or DNS in this repository task.

The remaining content approvals still apply: confirm the GO-specific purchase/payment destination (`config.purchaseUrl`), product-image fidelity, final layout including 200% text, retention period and backup owner. Generate or replace printed QR material only after validating the permanent campaign URL.

Environment examples are in `.env.example`; the local preview intentionally uses isolated fixed review settings and does not load production secrets.
