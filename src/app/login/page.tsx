'use client';
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/auth';

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
            try { await refresh(); } catch { /* ignore */ }
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
                    <label htmlFor="login-email" className="block text-sm">Email</label>
                    <input id="login-email" data-testid="login-email" className="mt-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>
                <div>
                    <label htmlFor="login-password" className="block text-sm">Password</label>
                    <input id="login-password" data-testid="login-password" className="mt-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                </div>
                {error ? <div className="text-sm text-red-600">{error}</div> : null}
                <div>
                    <button data-testid="login-submit" className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
                </div>
            </form>
        </div>
    );
}
