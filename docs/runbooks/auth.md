# Auth runbook — registration troubleshooting

## Purpose

This runbook documents how to reproduce, debug, and verify the registration/auth flows and how to associate an email address with an admin user when needed.

## Reproduce

1. Open the site and navigate to `/register`.
2. Submit a registration for the target email (e.g. `brn.dbn@gmail.com`).
3. Inspect site logs (server-side) and the MCP server logs for the `/api/mcp/auth/magic-link/register` call.

## Forgot password / magic-link

- Open `/login` and click the **Forgot password?** link (or go to `/forgot-password`).
- Submit an email and verify the site POSTs to `/api/auth/magic-link` and the proxy forwards to `/api/mcp/auth/magic-link`.
- Expected UX: neutral confirmation message (do not reveal whether the email exists).
- For staging diagnostics, enable `DEBUG_AUTH=1` to see upstream bodies in server logs.

## Key checks

- Confirm the frontend POST is to `/api/auth/register` with `Content-Type: application/json`.
- Confirm the site proxy forwards to `/api/mcp/auth/magic-link/register` (server logs or DEBUG_MCP).
- If MCP upstream returns non-2xx, production will surface a sanitized `{"error":"Registration failed"}`. Enable `DEBUG_AUTH=1` locally to see upstream body in logs.

## Associate an admin email (one-off)

⚠️ **The MCP server no longer provides admin user management endpoints.** Manage admin roles directly in Supabase:

### Option 1: Supabase Dashboard UI

1. Navigate to your Supabase project dashboard
2. Go to Authentication > Users
3. Find the user by email
4. Click to edit and update the user metadata with role information

### Option 2: Direct SQL Query

```sql
-- Find the user ID
SELECT id, email FROM auth.users WHERE email = 'brn.dbn@gmail.com';

-- Update user metadata to set admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
)
WHERE email = 'brn.dbn@gmail.com';
```

### Option 3: Supabase Management API

Use Supabase's Admin API to programmatically update user metadata:

```typescript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { role: 'admin' }
});
```

**Note:** The `npm run associate:admin` script is deprecated and no longer functional.

## Regenerate MCP client

- Command: `npm run generate:mcp-client`
- Purpose: pick up new MCP admin endpoints (e.g. Spotify tools) and include them in the website packages.
- Verify: `git status` should show updated files under `packages/mcp-client/src` — run `npm test` and `npm run build:packages` after generation.

## Debug flags

- `DEBUG_AUTH=1` — show verbose logs for registration proxy and upstream bodies (safe only for local/dev).
- `DEBUG_MCP=1` — enable MCP proxy debug logs.

## Rollout

- Fix -> staging -> reproduce registration end-to-end -> promote.
- In production, upstream error bodies are sanitized to avoid leaking internal errors; use `DEBUG_AUTH` in staging for deeper diagnostics.
