import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';

describe('Header (mobile nav)', () => {
    it('toggles mobile menu and manages focus + ARIA attributes', async () => {
        const { container } = render(<Header />);

        const toggle = screen.getByRole('button', { name: /open navigation/i });
        expect(toggle).toBeInTheDocument();

        const menu = screen.getByRole('menu', { hidden: true });
        expect(menu).toHaveAttribute('aria-hidden', 'true');

        // Use fireEvent to avoid user-event document setup dependency in this environment
        const { fireEvent, waitFor } = await import('@testing-library/react');

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(menu).toHaveAttribute('aria-hidden', 'false');

        const first = screen.getByRole('menuitem', { name: /about/i });
        await waitFor(() => expect(first).toHaveFocus());

        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => expect(menu).toHaveAttribute('aria-hidden', 'true'));
        await waitFor(() => expect(toggle).toHaveFocus());

        // Axe accessibility check
        const results = await axe(container);
        expect(results.violations).toHaveLength(0);
    });
});
