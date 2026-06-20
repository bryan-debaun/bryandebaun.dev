#!/usr/bin/env node
/*
  ⚠️ DEPRECATED: This script is no longer functional.
  
  The MCP server removed the PATCH /api/admin/users/{id} endpoint.
  User role management should now be done directly in Supabase.
  
  To assign admin roles, set the role in APP metadata (app_metadata), NOT user
  metadata. user_metadata is user-editable and must never be trusted for
  authorization; app_metadata is admin-controlled and is the location both
  requireAdmin (this repo, src/lib/auth-guard.ts) and the MCP server
  (src/auth/jwt.ts `roleFromToken`) read.

  Supabase SQL (preferred — app_metadata lives in raw_app_meta_data):
    UPDATE auth.users
    SET raw_app_meta_data =
      jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"')
    WHERE email = 'your-email@example.com';

  Or via the Admin API (service role key required):
    supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } })

  Previous usage (no longer works):
    MCP_BASE_URL=https://bad-mcp.onrender.com MCP_API_KEY=xxxxx tsx scripts/associate-admin.ts --user-id 123 --role admin
*/

console.error('⚠️  DEPRECATED: This script no longer works.');
console.error('The MCP server removed admin user management endpoints.');
console.error('Please manage user roles directly in Supabase.');
console.error('See script comments for instructions.');
process.exit(1);
