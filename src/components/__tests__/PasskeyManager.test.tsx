import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PasskeyManager from '@/components/auth/PasskeyManager';

const list = vi.fn();
const registerPasskey = vi.fn();
const passkeyDelete = vi.fn();
const update = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            registerPasskey,
            passkey: { list, delete: passkeyDelete, update },
        },
    }),
}));

const SAMPLE = [
    {
        id: 'pk-1',
        friendly_name: 'MacBook Touch ID',
        created_at: '2026-06-01T00:00:00.000Z',
        last_used_at: '2026-06-20T00:00:00.000Z',
    },
    {
        id: 'pk-2',
        friendly_name: 'iPhone',
        created_at: '2026-06-10T00:00:00.000Z',
    },
];

describe('PasskeyManager', () => {
    beforeEach(() => {
        list.mockReset();
        registerPasskey.mockReset();
        passkeyDelete.mockReset();
        update.mockReset();
        list.mockResolvedValue({ data: SAMPLE, error: null });
        registerPasskey.mockResolvedValue({ data: {}, error: null });
        passkeyDelete.mockResolvedValue({ data: null, error: null });
        update.mockResolvedValue({ data: SAMPLE[0], error: null });
        cleanup();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('renders nothing when the passkey flag is off', () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', '');
        const { container } = render(<PasskeyManager />);
        expect(container).toBeEmptyDOMElement();
        expect(list).not.toHaveBeenCalled();
    });

    it('lists the user passkeys when the flag is on', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeyManager />);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
        expect(await screen.findByText('MacBook Touch ID')).toBeInTheDocument();
        expect(screen.getByText('iPhone')).toBeInTheDocument();
    });

    it('adds a passkey via registerPasskey then reloads the list', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeyManager />);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByTestId('passkey-add'));
        await waitFor(() => expect(registerPasskey).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    });

    it('deletes a passkey with the passkeyId', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeyManager />);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
        fireEvent.click(await screen.findByTestId('passkey-delete-pk-1'));
        await waitFor(() =>
            expect(passkeyDelete).toHaveBeenCalledWith({ passkeyId: 'pk-1' }),
        );
    });

    it('renames a passkey via update with friendlyName', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        render(<PasskeyManager />);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
        fireEvent.click(await screen.findByTestId('passkey-rename-pk-2'));
        const input = screen.getByTestId('passkey-rename-input-pk-2');
        fireEvent.change(input, { target: { value: 'My Phone' } });
        fireEvent.click(screen.getByTestId('passkey-rename-save-pk-2'));
        await waitFor(() =>
            expect(update).toHaveBeenCalledWith({
                passkeyId: 'pk-2',
                friendlyName: 'My Phone',
            }),
        );
    });

    it('shows a friendly message when a credential already exists', async () => {
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PASSKEYS', 'true');
        registerPasskey.mockResolvedValueOnce({
            data: null,
            error: { code: 'webauthn_credential_exists', message: 'exists' },
        });
        render(<PasskeyManager />);
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByTestId('passkey-add'));
        expect(
            await screen.findByText(/already registered/i),
        ).toBeInTheDocument();
    });
});
