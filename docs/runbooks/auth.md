# Auth runbook — registration troubleshooting

Purpose
-------
This runbook documents how to reproduce, debug, and verify the registration/auth flows and how to associate an email address with an admin user when needed.

Reproduce
---------
1. Open the site and navigate to `/register`.
2. Submit a registration for the target email (e.g. `brn.dbn@gmail.com`).
3. Inspect site logs (server-side) and the MCP server logs for the `/api/mcp/auth/magic-link/register` call.

Key checks
----------
- Confirm the frontend POST is to `/api/auth/register` with `Content-Type: application/json`.
- Confirm the site proxy forwards to `/api/mcp/auth/magic-link/register` (server logs or DEBUG_MCP).
- If MCP upstream returns non-2xx, production will surface a sanitized `{"error":"Registration failed"}`. Enable `DEBUG_AUTH=1` locally to see upstream body in logs.

Associate an admin email (one-off)
---------------------------------
1. Find the user id for the email in Supabase (or via MCP admin endpoints):
   `select id, email from auth.users where email = 'brn.dbn@gmail.com';`
2. Use the helper script (requires `MCP_BASE_URL` and `MCP_API_KEY`):
   `npm run associate:admin -- --user-id 123 --role admin`

Regenerate MCP client
---------------------
- Command: `npm run generate:mcp-client`
- Purpose: pick up new MCP admin endpoints (e.g. Spotify tools) and include them in the website packages.
- Verify: `git status` should show updated files under `packages/mcp-client/src` — run `npm test` and `npm run build:packages` after generation.

Debug flags
-----------
- `DEBUG_AUTH=1` — show verbose logs for registration proxy and upstream bodies (safe only for local/dev).
- `DEBUG_MCP=1` — enable MCP proxy debug logs.

Rollout
-------
- Fix -> staging -> reproduce registration end-to-end -> promote.
- In production, upstream error bodies are sanitized to avoid leaking internal errors; use `DEBUG_AUTH` in staging for deeper diagnostics.
