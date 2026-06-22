import { createClient } from '@supabase/supabase-js';
import { expect, test } from './fixtures/auth';
import { missingEnvKeys } from './fixtures/env';

/**
 * MCP server auth probe — folds in the retired one-off
 * `agent-artifacts/probe-mcp-admin-auth.ts`.
 *
 * Isolates website-vs-server: signs in to Supabase as the e2e admin, then hits
 * the LIVE MCP server's POST /api/books DIRECTLY (the website route is bypassed)
 * with three auth shapes:
 *   1. Bearer <Supabase JWT>
 *   2. Bearer <Supabase JWT> + X-MCP-Api-Key   (the shape src/lib/mcp.ts sends)
 *   3. Bearer <MCP_API_KEY>
 *
 * This proves whether the server trusts the admin JWT for writes — the #84
 * blocker. It DELETEs anything it manages to create so it never orphans data.
 * It asserts only that the probe completed and logs a verdict; the website-path
 * CRUD spec is what gates on writes actually working end to end.
 */

interface ProbeResult {
    label: string;
    status: number;
    body: string;
}

test.beforeAll(() => {
    const missing = missingEnvKeys();
    test.skip(
        missing.length > 0,
        `Missing integration env: ${missing.join(', ')}`,
    );
});

test('probe: does the MCP server trust the Supabase admin JWT for writes?', async ({
    env,
    runId,
}) => {
    const supa = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    );
    const { data, error } = await supa.auth.signInWithPassword({
        email: env.adminEmail,
        password: env.adminPassword,
    });
    expect(error, error?.message).toBeNull();
    expect(data.session).not.toBeNull();
    const jwt = data.session!.access_token;

    const mcp = env.mcpBaseUrl;
    const created: number[] = [];

    const tryPost = async (
        label: string,
        headers: Record<string, string>,
    ): Promise<ProbeResult> => {
        const res = await fetch(`${mcp}/api/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...headers,
            },
            body: JSON.stringify({ title: `[e2e-${runId}] probe` }),
        });
        const body = await res.text();
        if (res.status === 201) {
            try {
                const id = (JSON.parse(body) as { id?: number }).id;
                if (typeof id === 'number') created.push(id);
            } catch {
                /* non-JSON body; nothing to track */
            }
        }
        console.info(`  ${label}: ${res.status} — ${body.slice(0, 160)}`);
        return { label, status: res.status, body };
    };

    let results: ProbeResult[] = [];
    try {
        results = [
            await tryPost('Bearer <JWT>', { Authorization: `Bearer ${jwt}` }),
            await tryPost('Bearer <JWT> + X-MCP-Api-Key', {
                Authorization: `Bearer ${jwt}`,
                'X-MCP-Api-Key': env.mcpApiKey,
            }),
            await tryPost('Bearer <MCP_API_KEY>', {
                Authorization: `Bearer ${env.mcpApiKey}`,
            }),
        ];
    } finally {
        // Never orphan probe records, regardless of which auth shape worked.
        for (const id of created) {
            await fetch(`${mcp}/api/books/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    'X-MCP-Api-Key': env.mcpApiKey,
                },
            }).catch(() => {});
        }
    }

    const jwtAccepted = results
        .slice(0, 2)
        .some((r) => r.status === 201);
    const keyAccepted = results[2]?.status === 201;
    const verdict = jwtAccepted
        ? 'Server ACCEPTS the Supabase admin JWT for writes.'
        : keyAccepted
          ? 'Server accepts the API key but NOT the JWT for writes.'
          : 'Server REJECTS all auth shapes for writes.';
    console.info(`\nMCP write-path verdict: ${verdict}`);

    // Diagnostic spec: assert only that the probe ran and produced statuses, so
    // it surfaces the verdict without flaking the suite on the known blocker.
    expect(results).toHaveLength(3);
    for (const r of results) {
        expect(typeof r.status).toBe('number');
    }
});
