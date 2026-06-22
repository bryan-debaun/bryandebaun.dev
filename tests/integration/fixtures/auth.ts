import {
    type APIRequestContext,
    request as playwrightRequest,
    test as base,
} from '@playwright/test';
import { getIntegrationEnv, type IntegrationEnv } from './env';

/**
 * Per-request timeout for any call that proxies to the prod MCP server. Render's
 * free tier can cold-start, so a wake-up shouldn't fail the run.
 */
export const MCP_REQ_TIMEOUT = 90_000;

function resolveBaseURL(): string {
    return (
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, '') ||
        'http://localhost:3000'
    );
}

/**
 * Logs in against the real `/api/auth/login` route inside a fresh
 * APIRequestContext. The login route uses @supabase/ssr, which writes the
 * session as `Set-Cookie` headers on the response; Playwright captures those
 * into the context's cookie jar, so subsequent `/api/admin/*` calls on the same
 * context are authenticated exactly as a browser would be.
 */
async function loginContext(
    email: string,
    password: string,
): Promise<APIRequestContext> {
    const ctx = await playwrightRequest.newContext({ baseURL: resolveBaseURL() });
    const res = await ctx.post('/api/auth/login', {
        data: { email, password },
        failOnStatusCode: false,
        timeout: MCP_REQ_TIMEOUT,
    });
    if (res.status() !== 200) {
        const body = await res.text().catch(() => '');
        await ctx.dispose();
        throw new Error(
            `Login failed for ${email}: ${res.status()} ${body.slice(0, 200)}`,
        );
    }
    return ctx;
}

export interface IntegrationWorkerFixtures {
    /** Validated integration environment (credentials + MCP config). */
    env: IntegrationEnv;
    /** Authenticated as the e2e admin (passes requireAdmin). Worker-scoped. */
    adminRequest: APIRequestContext;
    /** Authenticated as a confirmed non-admin (for 403 tests). Worker-scoped. */
    userRequest: APIRequestContext;
}

export interface IntegrationTestFixtures {
    /** Run-unique id used to namespace test records: `[e2e-<runId>]`. */
    runId: string;
    /** Unauthenticated context (for 401 tests). */
    anonRequest: APIRequestContext;
}

/**
 * Auth contexts are WORKER-scoped: each user logs in exactly once per worker
 * rather than once per test. Supabase Auth rate-limits `signInWithPassword`, and
 * repeated logins of the same user in quick succession can transiently fail
 * token validation — worker scope makes the suite both faster and resilient to
 * that. `env` is worker-scoped too so a worker-scoped fixture may depend on it.
 */
export const test = base.extend<
    IntegrationTestFixtures,
    IntegrationWorkerFixtures
>({
    env: [
        async ({}, use) => {
            await use(getIntegrationEnv());
        },
        { scope: 'worker' },
    ],

    adminRequest: [
        async ({ env }, use) => {
            const ctx = await loginContext(env.adminEmail, env.adminPassword);
            await use(ctx);
            await ctx.dispose();
        },
        { scope: 'worker' },
    ],

    userRequest: [
        async ({ env }, use) => {
            const ctx = await loginContext(env.userEmail, env.userPassword);
            await use(ctx);
            await ctx.dispose();
        },
        { scope: 'worker' },
    ],

    // A normal test file may use Date.now(); the workflow-script ban does not
    // apply here. Combine time + a short random suffix so parallel/retried runs
    // never collide on a namespace.
    runId: async ({}, use) => {
        const stamp = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 6);
        await use(`${stamp}-${rand}`);
    },

    anonRequest: async ({}, use) => {
        const ctx = await playwrightRequest.newContext({
            baseURL: resolveBaseURL(),
        });
        await use(ctx);
        await ctx.dispose();
    },
});

export { expect } from '@playwright/test';
