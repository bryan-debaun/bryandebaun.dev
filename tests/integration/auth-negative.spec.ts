import { expect, test } from './fixtures/auth';
import { missingEnvKeys } from './fixtures/env';

/**
 * Negative auth coverage for `requireAdmin` (src/lib/auth-guard.ts):
 *   - anonymous  -> 401 Unauthorized
 *   - non-admin  -> 403 Forbidden
 *
 * These exercise only the guard, never the MCP write path, so they must pass
 * reliably regardless of MCP/backend state. This is the priority suite.
 *
 * Endpoint note: `/api/admin/books` defines only POST (no GET handler), so a GET
 * there returns 405, not a guard status. We therefore assert against the routes
 * that actually run `requireAdmin`: POST /api/admin/books, POST
 * /api/admin/authors, and PATCH/DELETE /api/admin/books/[id]. The guard runs
 * before any body parsing or MCP call, so dummy ids/payloads are fine.
 */

// Anon/non-admin specs only need login creds for the non-admin context; if E2E
// creds are absent (e.g. a fork without secrets) skip rather than fail.
test.beforeAll(() => {
    const missing = missingEnvKeys();
    test.skip(
        missing.length > 0,
        `Missing integration env: ${missing.join(', ')}`,
    );
});

test.describe('requireAdmin — anonymous is rejected with 401', () => {
    test('POST /api/admin/books -> 401', async ({ anonRequest }) => {
        const res = await anonRequest.post('/api/admin/books', {
            data: { title: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(401);
    });

    test('POST /api/admin/authors -> 401', async ({ anonRequest }) => {
        const res = await anonRequest.post('/api/admin/authors', {
            data: { name: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(401);
    });

    test('PATCH /api/admin/books/[id] -> 401', async ({ anonRequest }) => {
        const res = await anonRequest.patch('/api/admin/books/1', {
            data: { title: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(401);
    });

    test('DELETE /api/admin/books/[id] -> 401', async ({ anonRequest }) => {
        const res = await anonRequest.delete('/api/admin/books/1', {
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(401);
    });
});

test.describe('requireAdmin — authenticated non-admin is rejected with 403', () => {
    test('POST /api/admin/books -> 403', async ({ userRequest }) => {
        const res = await userRequest.post('/api/admin/books', {
            data: { title: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(403);
    });

    test('POST /api/admin/authors -> 403', async ({ userRequest }) => {
        const res = await userRequest.post('/api/admin/authors', {
            data: { name: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(403);
    });

    test('PATCH /api/admin/books/[id] -> 403', async ({ userRequest }) => {
        const res = await userRequest.patch('/api/admin/books/1', {
            data: { title: 'should-be-rejected' },
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(403);
    });

    test('DELETE /api/admin/books/[id] -> 403', async ({ userRequest }) => {
        const res = await userRequest.delete('/api/admin/books/1', {
            failOnStatusCode: false,
        });
        expect(res.status()).toBe(403);
    });
});
