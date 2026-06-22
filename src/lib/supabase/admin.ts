import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client constructed with the SERVICE ROLE key.
 *
 * The service-role key bypasses Row Level Security and can perform privileged
 * `auth.admin.*` operations (listing users, generating invite links, deleting
 * users). It MUST NEVER reach the browser:
 *  - `import 'server-only'` makes any client-bundle import a build error.
 *  - As a defensive runtime backstop we also throw if `window` is defined.
 *
 * The client is created lazily and the configuration is env-gated, so the app
 * builds and runs without `SUPABASE_SERVICE_ROLE_KEY`. Admin-user features then
 * report "not configured" (HTTP 503) instead of crashing.
 *
 * Required env:
 *  - `NEXT_PUBLIC_SUPABASE_URL` (already used by the public clients)
 *  - `SUPABASE_SERVICE_ROLE_KEY` (server-only; Supabase dashboard → API settings)
 */

// Defensive backstop in case a future refactor strips the `server-only` import.
if (typeof window !== 'undefined') {
    throw new Error(
        'src/lib/supabase/admin.ts must never be imported in the browser.',
    );
}

/**
 * Discriminated result of attempting to obtain the service-role client.
 *
 * - `ok: true` — a configured client is available.
 * - `reason: 'unconfigured'` — `SUPABASE_SERVICE_ROLE_KEY` (or the Supabase URL)
 *   is missing. Callers should map this to a 503 ("not configured").
 */
export type AdminSupabaseResult =
    | { ok: true; client: SupabaseClient }
    | { ok: false; reason: 'unconfigured' };

let cachedClient: SupabaseClient | null = null;

/**
 * Return the service-role Supabase client, or an `unconfigured` result when the
 * required env vars are absent. Never throws for missing configuration. Secrets
 * are never logged.
 */
export function getAdminSupabase(): AdminSupabaseResult {
    if (cachedClient) {
        return { ok: true, client: cachedClient };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !serviceRoleKey) {
        return { ok: false, reason: 'unconfigured' };
    }

    cachedClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return { ok: true, client: cachedClient };
}
