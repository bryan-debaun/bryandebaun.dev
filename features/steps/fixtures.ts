import { type APIRequestContext, type APIResponse, mergeTests } from '@playwright/test';
import { test as bdd } from 'playwright-bdd';
import { test as integration } from '../../tests/integration/fixtures/auth';

/**
 * The feature steps reuse the integration suite's auth fixtures (issue #84):
 * `anonRequest` (no session) and `userRequest` (a real non-admin Supabase
 * session, worker-scoped). playwright-bdd needs its own base `test`, so the
 * two are merged. `exchange` is the one addition: a per-scenario slot the
 * When step fills and the Then step reads.
 */
export interface Exchange {
    response?: APIResponse;
}

export const test = mergeTests(bdd, integration).extend<{ exchange: Exchange }>({
    exchange: async ({}, use) => {
        await use({});
    },
});

/** A guard-only request: dummy payloads are fine, the guard runs before parsing. */
export async function send(
    context: APIRequestContext,
    method: string,
    path: string,
): Promise<APIResponse> {
    const options = { data: { title: 'should-be-rejected' }, failOnStatusCode: false };
    switch (method) {
        case 'POST':
            return context.post(path, options);
        case 'PATCH':
            return context.patch(path, options);
        case 'DELETE':
            return context.delete(path, { failOnStatusCode: false });
        default:
            throw new Error(`unsupported method ${method}`);
    }
}
