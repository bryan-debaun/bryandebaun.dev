'use client';
import React, { useState } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (!email) {
            setError('Email is required.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(payload?.error || 'Failed to send password reset email');
                setLoading(false);
                return;
            }
            setMessage(`If an account with that email exists, we've sent a password reset link. Please check your email.`);
            setLoading(false);
        } catch {
            setError('Failed to send password reset email');
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-semibold mb-4">Reset Your Password</h1>
            <p className="text-sm text-gray-600 mb-6">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="reset-email" className="block text-sm">Email</label>
                    <input id="reset-email" data-testid="reset-email" placeholder="you@example.com" autoComplete="email" className="mt-1 w-full form-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </div>
                {error ? <div className="text-sm text-red-600">{error}</div> : null}
                {message ? <div className="text-sm text-green-700">{message}</div> : null}
                <div className="form-actions">
                    <button data-testid="reset-submit" className="btn btn--primary w-full md:w-auto" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
                </div>
            </form>
        </div>
    );
}
