const pushMock = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    });

    it('shows user email and dropdown with admin/sign out when authenticated', async () => {
        const user = { id: '123', email: 'me@example.com', isAdmin: true };
        render(
            <AuthContext.Provider value={{ user, refresh: async () => { }, logout: async () => { }, isAuthenticated: true }}>
                <Header />
            </AuthContext.Provider>
        );

        // Email button is visible (there may be multiple for mobile/desktop)
        const emailButtons = screen.getAllByText(/me@example.com/i);
        expect(emailButtons.length).toBeGreaterThan(0);

        // Click to open dropdown (click the first one)
        await userEvent.click(emailButtons[0]);

        // Dropdown items should now be visible
        expect(screen.getByText(/^Account$/i)).toBeInTheDocument();
        expect(screen.getByText(/^Admin$/i)).toBeInTheDocument();
        expect(screen.getByText(/Sign out/i)).toBeInTheDocument();
    });
});
