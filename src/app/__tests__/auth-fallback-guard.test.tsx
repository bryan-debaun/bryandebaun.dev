import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthContext, type AuthContextType } from '@/lib/auth';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';

// The passkey/social buttons construct a Supabase client; stub it so the pages
// render without touching the network.
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
            signInWithPasskey: vi.fn().mockResolvedValue({ error: null }),
        },
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const authValue: AuthContextType = {
    user: null,
    refresh: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
};

function renderWithAuth(node: React.ReactElement) {
    return render(
        <AuthContext.Provider value={authValue}>{node}</AuthContext.Provider>,
    );
}

describe('email/password sign-in is always present (anti-lockout guard)', () => {
    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    for (const flag of ['', 'true']) {
        it(`keeps the login email/password form with the passkey flag = "${flag}"`, () => {
            vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', flag);
            renderWithAuth(<LoginPage />);
            expect(screen.getByTestId('login-email')).toBeInTheDocument();
            expect(screen.getByTestId('login-password')).toBeInTheDocument();
            expect(screen.getByTestId('login-submit')).toBeInTheDocument();
        });

        it(`keeps the register email/password form with the passkey flag = "${flag}"`, () => {
            vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', flag);
            renderWithAuth(<RegisterPage />);
            expect(screen.getByTestId('register-email')).toBeInTheDocument();
            expect(screen.getByTestId('register-password')).toBeInTheDocument();
            expect(screen.getByTestId('register-submit')).toBeInTheDocument();
        });
    }

    it('hides the passkey sign-in button when the flag is off but keeps the password form', () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', '');
        renderWithAuth(<LoginPage />);
        expect(screen.queryByTestId('passkey-signin')).toBeNull();
        expect(screen.getByTestId('login-password')).toBeInTheDocument();
    });

    it('shows the passkey sign-in button when the flag is on, alongside the password form', () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        renderWithAuth(<LoginPage />);
        expect(screen.getByTestId('passkey-signin')).toBeInTheDocument();
        expect(screen.getByTestId('login-password')).toBeInTheDocument();
    });
});
