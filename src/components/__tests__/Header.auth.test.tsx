const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { AuthContext } from '@/lib/auth';
import { describe, it, expect } from 'vitest';

describe('Header (auth state)', () => {
    it('shows sign in / register when unauthenticated', () => {
        render(
            <AuthContext.Provider value={{ user: null, refresh: async () => { }, logout: async () => { }, isAuthenticated: false }}>
                <Header />
            </AuthContext.Provider>
        );

        expect(screen.getAllByText(/Sign in/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Register/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Account/i).length).toBeGreaterThan(0);
    });

    it('shows user email, sign out and admin link when authenticated as admin', () => {
        const user = { id: 1, email: 'me@example.com', isAdmin: true } as any;
        render(
            <AuthContext.Provider value={{ user, refresh: async () => { }, logout: async () => { }, isAuthenticated: true }}>
                <Header />
            </AuthContext.Provider>
        );

        expect(screen.getAllByText(/me@example.com/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Sign out/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Admin/i).length).toBeGreaterThan(0);
    });
});
