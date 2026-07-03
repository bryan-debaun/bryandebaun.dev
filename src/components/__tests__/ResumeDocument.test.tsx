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
    it('public variant hides email/phone and renders the request slot', () => {
        render(
            <ResumeDocument
                resume={RESUME}
                requestSlot={<div data-testid="request-slot">request here</div>}
            />,
        );

        // Direct contact info must never appear in the public render (ADR 0007).
        expect(screen.queryByText('private@example.com')).toBeNull();
        expect(screen.queryByText('(913) 555-0100')).toBeNull();

        expect(screen.getByTestId('request-slot')).toBeInTheDocument();
    });

    it('full variant renders email/phone as mailto/tel and drops the request slot', () => {
        render(
            <ResumeDocument
                resume={RESUME}
                includePrivateContact
                requestSlot={<div data-testid="request-slot">request here</div>}
            />,
        );

        const email = screen.getByRole('link', {
            name: 'private@example.com',
        });
        expect(email).toHaveAttribute('href', 'mailto:private@example.com');

        const phone = screen.getByRole('link', { name: '(913) 555-0100' });
        expect(phone).toHaveAttribute('href', 'tel:9135550100');

        // The request slot is public-only and must be absent from the gated PDF.
        expect(screen.queryByTestId('request-slot')).toBeNull();
    });
});
