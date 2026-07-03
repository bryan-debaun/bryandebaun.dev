import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextType } from '@/lib/auth';

const createResumeRequest = vi.fn();
vi.mock(
    '@/lib/repositories/resumeRequestsRepository',
    async (importOriginal) => {
        const original = (await importOriginal()) as Record<string, unknown>;
        return {
            ...original,
            createResumeRequest: (...args: unknown[]) =>
                createResumeRequest(...args),
        };
    },
);

import ResumeRequestButton from '../ResumeRequestButton';

function renderWithAuth(isAuthenticated: boolean) {
    const value: AuthContextType = {
        user: isAuthenticated ? { id: 'u1', email: 'user@example.com' } : null,
        refresh: async () => {},
        logout: async () => {},
        isAuthenticated,
    };
    return render(
        <AuthContext.Provider value={value}>
            <ResumeRequestButton />
        </AuthContext.Provider>,
    );
}

describe('ResumeRequestButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a sign-in link when signed out', () => {
        renderWithAuth(false);
        const link = screen.getByRole('link', { name: /sign in to request/i });
        expect(link).toHaveAttribute('href', '/login');
    });

    it('submits a request and shows a success message when signed in', async () => {
        createResumeRequest.mockResolvedValue({ id: 'req-1' });
        renderWithAuth(true);

        await userEvent.type(
            screen.getByLabelText(/reason/i),
            'Considering you',
        );
        await userEvent.click(
            screen.getByRole('button', { name: /request full résumé/i }),
        );

        await waitFor(() =>
            expect(createResumeRequest).toHaveBeenCalledWith({
                reason: 'Considering you',
            }),
        );
        expect(await screen.findByRole('status')).toHaveTextContent(
            /your request was submitted/i,
        );
    });

    it('surfaces the server error message inline on failure', async () => {
        const { ResumeRequestError } = await import(
            '@/lib/repositories/resumeRequestsRepository'
        );
        createResumeRequest.mockRejectedValue(
            new ResumeRequestError(
                "You've reached the limit of 3 requests per 30 days.",
                429,
            ),
        );
        renderWithAuth(true);

        await userEvent.click(
            screen.getByRole('button', { name: /request full résumé/i }),
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /limit of 3 requests/i,
        );
    });
});
