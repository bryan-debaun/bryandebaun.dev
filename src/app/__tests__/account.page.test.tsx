import { render, screen, fireEvent } from '@testing-library/react';
import AccountPage from '@/app/account/page';
import { AuthContext } from '@/lib/auth';
import { describe, it, expect, vi } from 'vitest';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

describe('Account page', () => {
    it('shows sign-in prompt when unauthenticated', () => {
        render(
            <AuthContext.Provider value={{ user: null, refresh: async () => { }, logout: async () => { }, isAuthenticated: false }}>
                <AccountPage />
            </AuthContext.Provider>
        );

        expect(screen.getByText(/You are not signed in/i)).toBeInTheDocument();
        expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });

    it('shows user info and signs out', async () => {
        const mockLogout = vi.fn(async () => { });
        const user = { id: 1, email: 'me@example.com', isAdmin: false } as any;
        render(
            <AuthContext.Provider value={{ user, refresh: async () => { }, logout: mockLogout, isAuthenticated: true }}>
                <AccountPage />
            </AuthContext.Provider>
        );

        expect(screen.getByText(/me@example.com/i)).toBeInTheDocument();
        const btn = screen.getByTestId('account-signout');
        fireEvent.click(btn);
        expect(mockLogout).toHaveBeenCalled();
        const { waitFor } = await import('@testing-library/react');
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    });
});
