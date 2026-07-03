import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Resume } from '@/lib/resume';

const mutateAsync = vi.fn();
const useAdminResume = vi.fn();

vi.mock('@/lib/hooks/useAdminResume', () => ({
    useAdminResume: () => useAdminResume(),
}));

import ResumeEditor from '@/components/admin/ResumeEditor';

const RESUME: Resume = {
    basics: {
        name: 'Bryan DeBaun',
        label: 'Senior Software Engineer',
        url: 'https://bryandebaun.dev',
        summary: 'A real summary.',
        location: { city: 'Merriam', region: 'KS', countryCode: 'US' },
        profiles: [
            {
                network: 'GitHub',
                username: 'bryan-debaun',
                url: 'https://github.com/bryan-debaun',
            },
        ],
        privateContact: { email: 'brn.dbn@example.com', phone: '(913) 555' },
    },
    work: [
        {
            name: 'Cox Automotive',
            position: 'Senior Software Engineer',
            startDate: '2021-05-01',
            endDate: '',
            highlights: ['Scaled the platform.'],
        },
    ],
    education: [],
    skills: [],
    projects: [],
};

beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue(RESUME);
    useAdminResume.mockReturnValue({
        resume: RESUME,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        updateMutation: { mutateAsync, isPending: false },
    });
});

describe('ResumeEditor', () => {
    it('loads the résumé into the form', () => {
        render(<ResumeEditor />);
        // `^Name` avoids matching the profile "Username" label.
        expect(screen.getByLabelText(/^Name/)).toHaveValue('Bryan DeBaun');
        // Private contact section is present and labelled as download-only.
        expect(
            screen.getByText(/only on the downloadable PDF/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toHaveValue(
            'brn.dbn@example.com',
        );
    });

    it('edits a field and submits the updated résumé', async () => {
        const user = userEvent.setup();
        render(<ResumeEditor />);

        // "Label / title" is a unique label (basics + work both have "Summary").
        const label = screen.getByLabelText('Label / title');
        await user.clear(label);
        await user.type(label, 'Staff Engineer');

        await user.click(screen.getByRole('button', { name: /Save résumé/i }));

        await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
        const submitted = mutateAsync.mock.calls[0][0] as Resume;
        expect(submitted.basics.label).toBe('Staff Engineer');
        // Round-trips the private contact + nested arrays.
        expect(submitted.basics.privateContact?.email).toBe(
            'brn.dbn@example.com',
        );
        expect(submitted.work[0].highlights).toEqual(['Scaled the platform.']);
    });

    it('blocks submit when the name is cleared', async () => {
        const user = userEvent.setup();
        render(<ResumeEditor />);

        await user.clear(screen.getByLabelText(/^Name/));
        await user.click(screen.getByRole('button', { name: /Save résumé/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            /Name is required/i,
        );
        expect(mutateAsync).not.toHaveBeenCalled();
    });
});
