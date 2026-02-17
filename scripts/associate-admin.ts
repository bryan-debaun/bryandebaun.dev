#!/usr/bin/env node
/*
  Usage (example):
    MCP_BASE_URL=https://bad-mcp.onrender.com MCP_API_KEY=xxxxx tsx scripts/associate-admin.ts --user-id 123 --role admin

  Notes:
  - This script patches an existing user via the MCP admin endpoint.
  - It intentionally requires a numeric user id to avoid accidental mass updates.
*/

const argv = process.argv.slice(2);
function getFlag(name: string) {
    const idx = argv.indexOf(name);
    if (idx === -1) return null;
    return argv[idx + 1] ?? null;
}

const userId = getFlag('--user-id');
const role = getFlag('--role') || 'admin';

if (!userId) {
    console.error('Missing --user-id. To find a user id by email, query your Supabase DB:');
    console.error("  select id, email from auth.users where email = 'brn.dbn@gmail.com';");
    process.exit(1);
}

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';
const MCP_API_KEY = process.env.MCP_API_KEY;
if (!MCP_API_KEY) {
    console.error('Missing MCP_API_KEY environment variable. Provide a valid server/API key to call admin endpoints.');
    process.exit(1);
}

(async () => {
    const url = `${MCP_BASE_URL.replace(/\/+$/, '')}/api/admin/users/${encodeURIComponent(userId)}`;
    console.log(`Patching user ${userId} via ${url} (role=${role})`);

    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${MCP_API_KEY}` },
        body: JSON.stringify({ role }),
    });

    if (!res.ok) {
        console.error('Failed to patch user:', res.status, await res.text());
        process.exit(2);
    }

    console.log('User patched successfully:', await res.json());
})();
