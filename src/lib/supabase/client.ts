import { createBrowserClient } from '@supabase/ssr';

/**
 * Whether passkey (WebAuthn) support is enabled. Gated by an env flag so the
 * experimental Supabase passkey API can be turned off instantly (ADR 0006).
 * Read once at module scope so the value is stable per build.
 */
export const passkeysEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PASSKEYS === 'true';

/**
 * Create a Supabase client for use in browser/client components
 * Uses environment variables to configure the connection.
 *
 * When `NEXT_PUBLIC_ENABLE_PASSKEYS === 'true'` the experimental passkey API is
 * opted in via `auth.experimental.passkey`; otherwise the client is created
 * exactly as before (no experimental opt-in).
 */
export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        passkeysEnabled
            ? { auth: { experimental: { passkey: true } } }
            : undefined,
    );
};
