'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const payload = await res.json();
            if (!res.ok) {
                setError(payload?.error || 'Registration failed');
                setLoading(false);
                return;
            }
            // Registration succeeded — redirect to login
            router.push('/login');
        } catch {
            setError('Registration failed');
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="register-email" className="block text-sm">Email</label>
                    <input id="register-email" data-testid="register-email" className="mt-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>
                <div>
                    <label htmlFor="register-password" className="block text-sm">Password</label>
                    <input id="register-password" data-testid="register-password" className="mt-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                </div>
                <div>
                    <label htmlFor="register-confirm" className="block text-sm">Confirm password</label>
                    <input id="register-confirm" data-testid="register-confirm" className="mt-1 w-full" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" />
                </div>
                {error ? <div className="text-sm text-red-600">{error}</div> : null}
                <div>
                    <button data-testid="register-submit" className="btn" type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register'}</button>
                </div>
            </form>
        </div>
    );
}
