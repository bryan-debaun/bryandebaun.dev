'use client';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/auth';

export default function AdminPage() {
    const { user, isAuthenticated } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!user?.isAdmin) {
            // Non-admin users should not access the admin UI
            router.push('/');
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || !user?.isAdmin) {
        return <div className="prose">Checking authentication…</div>;
    }

    return (
        <div className="prose">
            <h1 className="text-2xl font-semibold mb-4">Admin</h1>
            <p className="mb-4">
                Admin dashboard placeholder. Protected by client-side guard.
            </p>
            <p className="text-sm text-muted-foreground">
                Use the MCP admin endpoints from the server/API routes.
            </p>
        </div>
    );
}
