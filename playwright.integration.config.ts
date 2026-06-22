import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Integration / E2E test config (issue #84).
 *
 * Kept deliberately SEPARATE from the visual suite (`playwright.config.ts`,
 * testDir `tests/visual`, testMatch `**\/*.playwright.ts`). This config owns
 * `tests/integration` with the `**\/*.spec.ts` naming convention so the two
 * suites never pick up each other's files.
 *
 * These specs exercise real request flows: the Next.js auth + `/api/admin/*`
 * routes, which proxy writes to the LIVE production MCP server. Safety comes
 * from run-unique namespacing (`[e2e-<runId>]`) plus guaranteed teardown — see
 * tests/integration/README.md.
 */

// Node 24 ships `process.loadEnvFile`; load `.env.local` (gitignored) so the
// E2E credentials + MCP config are available without an extra dotenv dep. Env
// vars already present in the process (e.g. CI secrets) win — loadEnvFile does
// not overwrite existing keys.
const envLocal = path.resolve(__dirname, '.env.local');
if (existsSync(envLocal)) {
    process.loadEnvFile(envLocal);
}

const baseURL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, '') ||
    'http://localhost:3000';

export default defineConfig({
    testDir: 'tests/integration',
    testMatch: '**/*.spec.ts',
    // Writes hit the prod MCP on Render's free tier, which can cold-start.
    // Give each test generous headroom; per-request timeouts are tuned in the
    // helpers/fixtures.
    timeout: 120_000,
    // CRUD specs share the prod backend; run serially to keep teardown
    // reasoning simple and avoid cross-test interference on the live data.
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: process.env.CI ? [['github'], ['list']] : [['list']],
    use: {
        baseURL,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            // API-only specs need no browser binary, but a single chromium
            // project keeps parity with the visual suite and allows future
            // UI-driven specs.
            use: {},
        },
    ],
    // Start the app only if one isn't already listening on baseURL. Prefer a
    // prebuilt production server (`pnpm start`) — run `pnpm build` first. If you
    // are iterating locally with `pnpm dev` already running, this reuses it.
    webServer: {
        command: 'pnpm start',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
