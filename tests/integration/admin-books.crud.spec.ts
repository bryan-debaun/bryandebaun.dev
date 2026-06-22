import type {
    BookWithAuthors,
    ListBooksResponse,
} from '@bryandebaun/mcp-client';
import { MCP_REQ_TIMEOUT, expect, test } from './fixtures/auth';
import { missingEnvKeys } from './fixtures/env';
import { TestData, sweepLeftovers } from './helpers/factories';

/**
 * Admin Books CRUD happy path against the LIVE prod MCP server, folding in the
 * logic from the retired one-off `agent-artifacts/verify-admin-crud.ts`:
 *   create (201) -> assert present in list + get -> edit (200) -> assert ->
 *   delete (204) -> assert gone.
 *
 * Safety model: every record is namespaced `[e2e-<runId>]`; a pre-run sweep
 * reaps leftovers from crashed runs; a `finally` block deletes everything this
 * test created even if an assertion failed. See tests/integration/README.md.
 *
 * Why everything lives inside the test body (not beforeAll): the `adminRequest`
 * fixture is test-scoped, so its APIRequestContext is disposed once the test
 * ends. Capturing it in `beforeAll` and reusing it in the test races against
 * that teardown. Keeping the whole flow in one test with `finally` cleanup is
 * both correct and the clearest teardown guarantee.
 *
 * If the MCP server rejects the Supabase admin JWT for writes (the #84 blocker),
 * `createBook` throws on the non-201 and the test fails LOUDLY with the upstream
 * status — exactly the regression this suite is meant to catch.
 */

test.beforeAll(() => {
    const missing = missingEnvKeys();
    test.skip(
        missing.length > 0,
        `Missing integration env: ${missing.join(', ')}`,
    );
});

test('Admin Books CRUD (live MCP): create -> read -> update -> delete', async ({
    adminRequest,
    runId,
}) => {
    const admin = adminRequest;
    const data = new TestData(admin, runId);

    // Reap any leftovers from a previously crashed run before we start.
    const swept = await sweepLeftovers(admin);
    if (swept.books > 0) {
        console.info(`sweepLeftovers reaped ${swept.books} stale book(s)`);
    }

    try {
        // CREATE
        const created = await data.createBook('crud', {
            description: 'integration verification record — safe to delete',
        });
        expect(created.id).toBeGreaterThan(0);
        expect(created.title).toBe(`${data.tag()} crud`);

        // READ (get by id)
        const getRes = await admin.get(`/api/mcp/books/${created.id}`, {
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(getRes.ok()).toBeTruthy();
        const fetched = (await getRes.json()) as BookWithAuthors;
        expect(fetched.id).toBe(created.id);
        expect(fetched.title).toBe(created.title);

        // READ (present in list)
        const listRes = await admin.get('/api/mcp/books?limit=200', {
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(listRes.ok()).toBeTruthy();
        const list = (await listRes.json()) as ListBooksResponse;
        expect(list.books.some((b) => b.id === created.id)).toBeTruthy();

        // UPDATE
        const newTitle = `${data.tag()} crud (edited)`;
        const patchRes = await admin.patch(`/api/admin/books/${created.id}`, {
            data: { title: newTitle },
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(patchRes.status()).toBe(200);
        const updated = (await patchRes.json()) as { title: string };
        expect(updated.title).toBe(newTitle);

        // assert the edit persisted
        const afterEdit = await admin.get(`/api/mcp/books/${created.id}`, {
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(afterEdit.ok()).toBeTruthy();
        expect(((await afterEdit.json()) as BookWithAuthors).title).toBe(
            newTitle,
        );

        // DELETE
        const delRes = await admin.delete(`/api/admin/books/${created.id}`, {
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(delRes.status()).toBe(204);
        data.untrack(created.id); // we deleted it ourselves; don't re-delete

        // assert gone
        const goneRes = await admin.get(`/api/mcp/books/${created.id}`, {
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        expect(goneRes.ok()).toBeFalsy();
    } finally {
        // Guaranteed teardown — deletes anything still tracked even on failure.
        await data.cleanup();
    }
});
