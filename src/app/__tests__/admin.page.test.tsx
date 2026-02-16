import { render, screen } from '@testing-library/react';
import AdminPage from '@/app/admin/page';
import { AuthContext } from '@/lib/auth';
import { describe, it, expect, vi } from 'vitest';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

describe('Admin page guard', () => {
    it('redirects to /login when unauthenticated', () => {
        render(
            <AuthContext.Provider value={{ user: null, refresh: async () => { }, logout: async () => { }, isAuthenticated: false }}>
                <AdminPage />
            </AuthContext.Provider>
        );
        expect(pushMock).toHaveBeenCalledWith('/login');
    });

    it('redirects to / when authenticated but not admin', () => {
        const user = { id: 1, email: 'me@example.com', isAdmin: false } as any;
        render(
            <AuthContext.Provider value={{ user, refresh: async () => { }, logout: async () => { }, isAuthenticated: true }}>
                <AdminPage />
            </AuthContext.Provider>
        );
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('renders admin UI for admin users', () => {
        const user = { id: 1, email: 'admin@example.com', isAdmin: true } as any;
        render(
            <AuthContext.Provider value={{ user, refresh: async () => { }, logout: async () => { }, isAuthenticated: true }}>
                <AdminPage />
            </AuthContext.Provider>
        );

        expect(screen.getByText(/Admin dashboard placeholder/i)).toBeInTheDocument();
    });
});
