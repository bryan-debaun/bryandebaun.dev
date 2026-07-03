'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PasskeySignInButtonProps {
    /** Path to return to after a successful sign-in. Defaults to `/`. */
    next?: string;
}

/**
 * "Sign in with a passkey" button (WebAuthn discoverable credentials).
 *
 * Strictly additive and gated behind `NEXT_PUBLIC_ENABLE_PASSKEYS === 'true'`
 * (ADR 0006). When the flag is off this renders nothing, leaving the
 * email/password and magic-link paths untouched. The flag is read at call time
 * (not module scope) so tests can stub it per-case.
 */
export default function PasskeySignInButton({
    next = '/',
}: PasskeySignInButtonProps) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (process.env.NEXT_PUBLIC_ENABLE_PASSKEYS !== 'true') {
        return null;
    }

    async function signIn() {
        setError(null);
        setPending(true);
        try {
            const supabase = createClient();
            const { error: passkeyError } =
                await supabase.auth.signInWithPasskey();
            if (passkeyError) {
                setError(
                    passkeyError.message ||
                        'Passkey sign-in failed. Please try again.',
                );
                setPending(false);
                return;
            }
            router.push(next ?? '/');
            router.refresh();
        } catch {
            setError('Passkey sign-in failed. Please try again.');
            setPending(false);
        }
    }

    return (
        <div className="mt-3 space-y-3">
            <button
                type="button"
                data-testid="passkey-signin"
                aria-label="Sign in with a passkey"
                className="btn btn--outline w-full"
                disabled={pending}
                onClick={signIn}
            >
                {pending ? 'Signing in…' : 'Sign in with a passkey'}
            </button>
            {error ? (
                <div role="alert" className="text-sm text-red-600">
                    {error}
                </div>
            ) : null}
        </div>
    );
}
