import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in browser/client components
 * Uses environment variables to configure the connection
 */
export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
};
