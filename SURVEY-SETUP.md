# Survey deployment: Vercel + Turso

The site design and survey questions are unchanged. Root `api/` functions expose the existing handler; `server/turso-db.js` connects it to durable Turso libSQL storage. Vercel continues serving `dist`. No rewrite or framework is needed. The old Cloudflare deployment instructions in README are an alternative, not this deployment path.

## Connect storage

1. In the existing Vercel project, add the Turso Cloud integration from Storage/Marketplace and create a libSQL (SQLite-compatible) database. Connect it to **Production only**. Leave **Create database branch for deployment → Production** unchecked: production must use the permanent database, not a new copy per deployment. Review the selected plan before accepting it.
2. Confirm the integration supplies `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as server-side production environment variables. Never place these values in `dist`, Git, screenshots, or chat.
3. In that database's SQL console, run the existing `db/001_poll.sql` once against the new empty database. It creates `responses` and `contacts`; it inserts no test data. Do not rerun it on an initialized database.
4. Set production `POLL_SECRET` to a securely generated random value of at least 32 characters. Keep it stable across deployments so duplicate detection remains consistent. Set `ALLOWED_ORIGIN=https://www.mightymattkit.com`, `POLL_ENABLED=true`, and `PREVIEW_MODE=false`. `ADMIN_TOKEN` is optional and only needed for staff verbal entry; leave it unset otherwise.
5. Push the reviewed local changes yourself and redeploy through the existing Vercel project. Project root must be this `site` directory, framework Other, build `npm run build`, output `dist`. Both root `api/` and `package-lock.json` must be included. Environment changes require a new deployment. Preview deployments deliberately keep collection disabled.

## Verify before printing QR codes

- Open the production survey in a browser. Its `/api/status` request includes `X-Poll-Device`; it must return 200 with `accepting:true`. Opening that API directly without a browser marker returns 400 by design.
- Submit one clearly labelled launch-test response. Confirm `/api/poll` returns 201 with `saved:true` and an ID; inspect that exact ID in the Turso `responses` table.
- Reload and confirm the browser reports an existing response. Retrying with the same marker must return 409, with one database row. Verify the response remains after a subsequent deployment.
- Check `/api/results`: counts must reflect saved rows and contain no contact details or free text. Optional contact submission must create a corresponding `contacts` row; anonymous submission must not.
- Remove only the identified launch-test rows through authenticated database administration (contacts first, then responses). Recheck counts before collection. Do not wipe tables.

Local tests use temporary databases and never connect to the campaign database. Passing local tests is not proof of live persistence; the production checks above are still required.

References: https://vercel.com/docs/functions/runtimes/node-js and https://vercel.com/marketplace/tursocloud

## Verified production launch — October 2, 2026

Production is deployed at https://www.mightymattkit.com. The responses and contacts tables are initialized. Live submission returned 201, duplicate submission returned 409, and the saved response and duplicate marker survived redeployment after automatic production database branching was disabled. The production verification record was removed and aggregate results returned to zero. All 13 local tests pass on Node 24. Keep POLL_SECRET stable and keep production database branching disabled.
