import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PasskeySignInButton from '@/components/auth/PasskeySignInButton';

const signInWithPasskey = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: { signInWithPasskey },
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push, refresh }),
}));

describe('PasskeySignInButton', () => {
    beforeEach(() => {
        signInWithPasskey.mockReset();
        signInWithPasskey.mockResolvedValue({ data: {}, error: null });
        push.mockReset();
        refresh.mockReset();
        cleanup();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('renders nothing when the passkey flag is off', () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', '');
        const { container } = render(<PasskeySignInButton />);
        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByTestId('passkey-signin')).toBeNull();
    });

    it('renders the button when the flag is on', () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeySignInButton />);
        expect(screen.getByTestId('passkey-signin')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /sign in with a passkey/i }),
        ).toBeInTheDocument();
    });

    it('calls signInWithPasskey and navigates on success', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeySignInButton next="/account" />);
        fireEvent.click(screen.getByTestId('passkey-signin'));
        await waitFor(() => expect(signInWithPasskey).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(push).toHaveBeenCalledWith('/account'));
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('renders an error when sign-in fails', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        signInWithPasskey.mockResolvedValueOnce({
            data: null,
            error: { message: 'No passkey available' },
        });
        render(<PasskeySignInButton />);
        fireEvent.click(screen.getByTestId('passkey-signin'));
        expect(
            await screen.findByText(/no passkey available/i),
        ).toBeInTheDocument();
        expect(push).not.toHaveBeenCalled();
    });
});
