'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type OAuthProvider = 'github' | 'google';

interface ProviderConfig {
    provider: OAuthProvider;
    label: string;
    icon: React.ReactNode;
}

function GitHubIcon() {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.762-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.468-2.382 1.236-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.806 5.624-5.48 5.92.43.372.814 1.103.814 2.222 0 1.604-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 22.296 24 17.798 24 12.5 24 5.87 18.627.5 12 .5Z" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width="20"
            height="20"
            viewBox="0 0 24 24"
        >
            <path
                fill="#4285F4"
                d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
            />
            <path
                fill="#FBBC05"
                d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.98-3.09Z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
            />
        </svg>
    );
}

const PROVIDERS: ProviderConfig[] = [
    { provider: 'github', label: 'Continue with GitHub', icon: <GitHubIcon /> },
    { provider: 'google', label: 'Continue with Google', icon: <GoogleIcon /> },
];

interface SocialAuthButtonsProps {
    /** Path to return to after a successful sign-in. Defaults to `/`. */
    next?: string;
}

export default function SocialAuthButtons({
    next = '/',
}: SocialAuthButtonsProps) {
    const [pending, setPending] = useState<OAuthProvider | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function signIn(provider: OAuthProvider) {
        setError(null);
        setPending(provider);
        try {
            const supabase = createClient();
            const callback = new URL('/auth/callback', window.location.origin);
            if (next && next !== '/') {
                callback.searchParams.set('next', next);
            }
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: callback.toString() },
            });
            if (oauthError) {
                setError(oauthError.message || 'Sign-in failed. Please try again.');
                setPending(null);
            }
            // On success the browser is redirected to the provider; no further
            // work is needed here.
        } catch {
            setError('Sign-in failed. Please try again.');
            setPending(null);
        }
    }

    return (
        <div className="space-y-3">
            {PROVIDERS.map(({ provider, label, icon }) => (
                <button
                    key={provider}
                    type="button"
                    data-testid={`oauth-${provider}`}
                    aria-label={label}
                    className="btn btn--outline w-full gap-2"
                    disabled={pending !== null}
                    onClick={() => signIn(provider)}
                >
                    {icon}
                    <span>
                        {pending === provider ? 'Redirecting…' : label}
                    </span>
                </button>
            ))}
            {error ? (
                <div role="alert" className="text-sm text-red-600">
                    {error}
                </div>
            ) : null}
        </div>
    );
}
