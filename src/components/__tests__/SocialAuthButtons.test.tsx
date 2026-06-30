import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

const signInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: { signInWithOAuth },
    }),
}));

describe('SocialAuthButtons', () => {
    beforeEach(() => {
        signInWithOAuth.mockReset();
        signInWithOAuth.mockResolvedValue({ error: null });
        cleanup();
    });

    it('renders GitHub and Google buttons', () => {
        render(<SocialAuthButtons />);
        expect(screen.getByTestId('oauth-github')).toBeInTheDocument();
        expect(screen.getByTestId('oauth-google')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /continue with github/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /continue with google/i }),
        ).toBeInTheDocument();
    });

    it('signs in with GitHub using the callback redirect', async () => {
        render(<SocialAuthButtons />);
        fireEvent.click(screen.getByTestId('oauth-github'));
        await waitFor(() =>
            expect(signInWithOAuth).toHaveBeenCalledTimes(1),
        );
        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    });

    it('signs in with Google using the callback redirect', async () => {
        render(<SocialAuthButtons />);
        fireEvent.click(screen.getByTestId('oauth-google'));
        await waitFor(() =>
            expect(signInWithOAuth).toHaveBeenCalledTimes(1),
        );
        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    });

    it('appends a next param to the redirect when provided', async () => {
        render(<SocialAuthButtons next="/account" />);
        fireEvent.click(screen.getByTestId('oauth-github'));
        await waitFor(() =>
            expect(signInWithOAuth).toHaveBeenCalledTimes(1),
        );
        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=%2Faccount`,
            },
        });
    });

    it('surfaces an error when sign-in fails', async () => {
        signInWithOAuth.mockResolvedValueOnce({
            error: { message: 'OAuth provider unavailable' },
        });
        render(<SocialAuthButtons />);
        fireEvent.click(screen.getByTestId('oauth-google'));
        expect(
            await screen.findByText(/oauth provider unavailable/i),
        ).toBeInTheDocument();
    });
});
