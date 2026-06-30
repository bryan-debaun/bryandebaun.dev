'use client';
import type React from 'react';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/auth';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

export default function LoginPage() {
    const router = useRouter();
    const { refresh } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const payload = await res.json();
            if (!res.ok) {
                setError(payload?.error || 'Login failed');
                setLoading(false);
                return;
            }
            // Refresh user context then redirect
            try {
                await refresh();
            } catch {
                /* ignore */
            }
            router.push('/');
        } catch {
            setError('Login failed');
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="login-email" className="block text-sm">
                        Email
                    </label>
                    <input
                        id="login-email"
                        data-testid="login-email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="mt-1 w-full form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                    />
                </div>
                <div>
                    <label htmlFor="login-password" className="block text-sm">
                        Password
                    </label>
                    <input
                        id="login-password"
                        data-testid="login-password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="mt-1 w-full form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                    />
                </div>
                {error ? (
                    <div className="text-sm text-red-600">{error}</div>
                ) : null}
                <div className="form-actions">
                    <button
                        data-testid="login-submit"
                        className="btn btn--primary w-full md:w-auto"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </div>
                <div className="mt-2 text-sm">
                    <a
                        href="/forgot-password"
                        className="text-[var(--color-norwegian-700)] hover:underline"
                    >
                        Forgot password?
                    </a>
                </div>
            </form>
            <div
                className="my-6 flex items-center gap-3 text-sm text-[var(--color-norwegian-700)]"
                aria-hidden="true"
            >
                <span className="h-px flex-1 bg-current opacity-30" />
                <span>or</span>
                <span className="h-px flex-1 bg-current opacity-30" />
            </div>
            <SocialAuthButtons />
        </div>
    );
}
