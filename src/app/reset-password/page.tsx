'use client';
import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!password) {
            setError('Password is required');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const payload = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(payload?.error || 'Failed to reset password');
                setLoading(false);
                return;
            }

            setMessage('Password updated successfully! Redirecting...');
            setTimeout(() => {
                router.push('/account');
            }, 2000);
        } catch {
            setError('Failed to reset password');
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-semibold mb-4">Set New Password</h1>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-sm">
                        New Password
                    </label>
                    <input
                        id="password"
                        data-testid="password"
                        type="password"
                        autoComplete="new-password"
                        className="mt-1 w-full form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="block text-sm">
                        Confirm Password
                    </label>
                    <input
                        id="confirm-password"
                        data-testid="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        className="mt-1 w-full form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                </div>
                {error ? (
                    <div className="text-sm text-red-600">{error}</div>
                ) : null}
                {message ? (
                    <div className="text-sm text-green-700">{message}</div>
                ) : null}
                <div className="form-actions">
                    <button
                        data-testid="reset-submit"
                        className="btn btn--primary w-full md:w-auto"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Updating…' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
