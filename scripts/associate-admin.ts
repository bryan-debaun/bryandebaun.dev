#!/usr/bin/env node
/*
  ⚠️ DEPRECATED: This script is no longer functional.
  
  The MCP server removed the PATCH /api/admin/users/{id} endpoint.
  User role management should now be done directly in Supabase.
  
  To assign admin roles:
  1. Access your Supabase project dashboard
  2. Navigate to Authentication > Users
  3. Find the user by email
  4. Update the user metadata to include role information
  
  Alternatively, use Supabase SQL:
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
    WHERE email = 'your-email@example.com';
  
  Previous usage (no longer works):
    MCP_BASE_URL=https://bad-mcp.onrender.com MCP_API_KEY=xxxxx tsx scripts/associate-admin.ts --user-id 123 --role admin
*/

console.error('⚠️  DEPRECATED: This script no longer works.');
console.error('The MCP server removed admin user management endpoints.');
console.error('Please manage user roles directly in Supabase.');
console.error('See script comments for instructions.');
process.exit(1);
