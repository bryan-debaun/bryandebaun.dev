/**
 * Centralized access to the environment configuration the integration suite
 * needs. `.env.local` is loaded by `playwright.integration.config.ts` before
 * tests run; in CI the same keys arrive as secrets in `process.env`.
 */

export interface IntegrationEnv {
    adminEmail: string;
    adminPassword: string;
    userEmail: string;
    userPassword: string;
    mcpApiKey: string;
    mcpBaseUrl: string;
    siteUrl: string;
}

/** Keys required for the auth fixtures + CRUD specs to run. */
const REQUIRED_KEYS = [
    'E2E_ADMIN_EMAIL',
    'E2E_ADMIN_PASSWORD',
    'E2E_USER_EMAIL',
    'E2E_USER_PASSWORD',
    'MCP_API_KEY',
    'MCP_BASE_URL',
] as const;

/**
 * Returns the list of required env keys that are missing/empty. CI uses this to
 * SKIP the suite gracefully on forks where secrets are unavailable.
 */
export function missingEnvKeys(): string[] {
    return REQUIRED_KEYS.filter((k) => {
        const v = process.env[k];
        return v === undefined || v === '';
    });
}

/**
 * Reads and validates the integration env. Throws a clear error listing any
 * missing keys — callers that want to skip instead should consult
 * `missingEnvKeys()` first.
 */
export function getIntegrationEnv(): IntegrationEnv {
    const missing = missingEnvKeys();
    if (missing.length > 0) {
        throw new Error(
            `Integration env missing required keys: ${missing.join(', ')}. ` +
                'Populate .env.local locally or provide the secrets in CI.',
        );
    }

    return {
        adminEmail: process.env.E2E_ADMIN_EMAIL as string,
        adminPassword: process.env.E2E_ADMIN_PASSWORD as string,
        userEmail: process.env.E2E_USER_EMAIL as string,
        userPassword: process.env.E2E_USER_PASSWORD as string,
        mcpApiKey: process.env.MCP_API_KEY as string,
        mcpBaseUrl: (process.env.MCP_BASE_URL as string).replace(/\/+$/u, ''),
        siteUrl: (
            process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        ).replace(/\/+$/u, ''),
    };
}
