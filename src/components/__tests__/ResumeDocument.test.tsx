import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Resume } from '@/lib/resume';
import { ResumeDocument } from '../ResumeDocument';

const RESUME: Resume = {
    basics: {
        name: 'Bryan DeBaun',
        label: 'Senior Software Engineer',
        url: 'https://bryandebaun.dev',
        summary: 'A real summary with no markers.',
        location: { city: 'Merriam', region: 'KS', countryCode: 'US' },
        profiles: [
            {
                network: 'LinkedIn',
                username: 'bryan-debaun',
                url: 'https://www.linkedin.com/in/bryan-debaun',
            },
        ],
        privateContact: {
            email: 'private@example.com',
            phone: '(913) 555-0100',
        },
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
};

describe('ResumeDocument', () => {
    it('public variant hides email/phone and shows the request CTA', () => {
        render(<ResumeDocument resume={RESUME} />);

        // Direct contact info must never appear in the public render (ADR 0007).
        expect(screen.queryByText('private@example.com')).toBeNull();
        expect(screen.queryByText('(913) 555-0100')).toBeNull();

        expect(
            screen.getByRole('link', { name: /request full résumé/i }),
        ).toBeInTheDocument();
    });

    it('full variant renders email/phone as mailto/tel and drops the CTA', () => {
        render(<ResumeDocument resume={RESUME} includePrivateContact />);

        const email = screen.getByRole('link', {
            name: 'private@example.com',
        });
        expect(email).toHaveAttribute('href', 'mailto:private@example.com');

        const phone = screen.getByRole('link', { name: '(913) 555-0100' });
        expect(phone).toHaveAttribute('href', 'tel:9135550100');

        expect(
            screen.queryByRole('link', { name: /request full résumé/i }),
        ).toBeNull();
    });
});
