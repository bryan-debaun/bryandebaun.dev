'use client';
import { useContext } from 'react';
import { AuthContext } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import PasskeyManager from '@/components/auth/PasskeyManager';

export default function AccountPage() {
    const { user, logout, isAuthenticated } = useContext(AuthContext);
    const router = useRouter();

    const onSignOut = async () => {
        await logout();
        router.push('/login');
    };

    if (!isAuthenticated) {
        return (
            <div className="prose">
                <h1 className="text-2xl font-semibold mb-4">Account</h1>
                <p>
                    You are not signed in.{' '}
                    <a
                        href="/login"
                        className="text-[var(--color-norwegian-700)] hover:underline"
                    >
                        Sign in
                    </a>{' '}
                    or{' '}
                    <a
                        href="/register"
                        className="text-[var(--color-norwegian-700)] hover:underline"
                    >
                        create an account
                    </a>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="prose">
            <h1 className="text-2xl font-semibold mb-4">Account</h1>
            <p className="mb-4">
                Signed in as <strong>{user?.email}</strong>
            </p>
            {user?.isAdmin ? (
                <p className="mb-4">
                    <a
                        href="/admin"
                        className="text-[var(--color-norwegian-700)] hover:underline"
                    >
                        Go to admin
                    </a>
                </p>
            ) : null}
            <div>
                <button
                    data-testid="account-signout"
                    className="btn"
                    onClick={onSignOut}
                >
                    Sign out
                </button>
            </div>
            <PasskeyManager />
        </div>
    );
}
