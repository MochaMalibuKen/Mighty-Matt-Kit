# Mighty Matt agricultural campaign microsite

Local implementation for review. Nothing has been published, DNS has not been changed, and no production QR has been generated.

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

## Production setup, after explicit approval

The smallest managed backend is one Cloudflare Worker plus D1 with same-origin static assets. The included Worker exports `fetch(request, env)` and accepts `ASSETS` and `DB` bindings. It can be integrated into Sites hosting or deployed through an approved Cloudflare account. No hosted project, credentials, database or domain binding has been created.

1. Confirm the GO payment/product URL and set `config.purchaseUrl`. The existing Essentials store is verified, but a GO-specific destination was not verified. Do not route GO buyers to an unrelated or full-kit SKU.
2. Review the person-removal edit against the physical product. Current GO inventory remains unverified and is intentionally not listed.
3. Choose the approved host/account. For Sites, register the local project only after approval and configure its logical D1 binding, asset bundle and schema migration using the installed Sites hosting workflow. The raw initial SQL is supplied for review; Sites-specific migration metadata and hosted binding configuration remain to be generated during that integration. Do not treat the current bundle as an already registered Sites deployment.
4. Create persistent D1 storage and apply `db/001_poll.sql` once using the chosen host's migration system. Do not use local test data in production. Bind `DB` and `ASSETS`.
5. Configure a strong random `POLL_SECRET` (at least 32 characters), optional separate `ADMIN_TOKEN` (at least 32 characters), `ALLOWED_ORIGIN=https://mightymattkit.com`, `PREVIEW_MODE=false`, and `POLL_ENABLED=true` only when collection is ready. Secrets belong in the host, never public files. Do not rotate the poll secret casually, since that changes duplicate-marker hashes.
6. Run the build/tests, check public origin, HTTPS, mobile and desktop layouts, approved checkout and contact links; submit a clearly identified launch-test response and remove it through authenticated database administration before collecting real responses. Check retry/duplicate and aggregate behavior on the actual deployed backend.
7. Publish and attach DNS only with explicit user approval. Confirm https://mightymattkit.com resolves to this deployed site. Only then generate the final printed QR to that permanent root URL.

Environment examples are in `.env.example`; the local preview intentionally uses isolated fixed review settings and does not load production secrets.
