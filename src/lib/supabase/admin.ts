import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client constructed with a privileged SECRET key.
 *
 * This key bypasses Row Level Security and can perform privileged
 * `auth.admin.*` operations (listing users, generating invite links, deleting
 * users). It MUST NEVER reach the browser:
 *  - `import 'server-only'` makes any client-bundle import a build error.
 *  - As a defensive runtime backstop we also throw if `window` is defined.
 *
 * The client is created lazily and the configuration is env-gated, so the app
 * builds and runs without the key. Admin-user features then report
 * "not configured" (HTTP 503) instead of crashing.
 *
 * Key choice (see docs/adr/0003-supabase-api-keys.md): we use the MODERN
 * Supabase **secret key** (`sb_secret_*`), which replaces the legacy
 * `service_role` JWT. Supabase recommends switching off the JWT-based
 * `anon`/`service_role` keys (they keep working only until end of 2026). We
 * read `SUPABASE_SECRET_KEY` first and fall back to the legacy
 * `SUPABASE_SERVICE_ROLE_KEY` so existing deployments keep working during the
 * transition.
 *
 * Required env:
 *  - `NEXT_PUBLIC_SUPABASE_URL` (already used by the public clients)
 *  - `SUPABASE_SECRET_KEY` (server-only; Supabase dashboard → Project Settings →
 *    API Keys → Secret keys). Legacy fallback: `SUPABASE_SERVICE_ROLE_KEY`.
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
 * - `reason: 'unconfigured'` — the secret key (or the Supabase URL) is missing.
 *   Callers should map this to a 503 ("not configured").
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
    // Prefer the modern secret key; fall back to the legacy service_role key
    // during migration. See docs/adr/0003-supabase-api-keys.md.
    const secretKey =
        process.env.SUPABASE_SECRET_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !secretKey) {
        return { ok: false, reason: 'unconfigured' };
    }

    cachedClient = createClient(url, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return { ok: true, client: cachedClient };
}
