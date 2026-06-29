import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
    it('renders an internal next/link with no target', () => {
        render(<Card href="/writing/cptsd" title="CPTSD" />);
        const link = screen.getByRole('link', { name: 'CPTSD' });
        expect(link).toHaveAttribute('href', '/writing/cptsd');
        expect(link).not.toHaveAttribute('target');
    });

    it('renders an external anchor with target and rel', () => {
        render(
            <Card
                external
                href="https://example.com/repo"
                title="Repo"
                ariaLabel="Repo — desc"
            />,
        );
        const link = screen.getByRole('link', { name: 'Repo — desc' });
        expect(link).toHaveAttribute('href', 'https://example.com/repo');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders title, description, meta, and chips', () => {
        render(
            <Card
                href="/x"
                title="Title here"
                description="A description."
                meta="January 2026"
                chips={['a', 'b', 'c']}
            />,
        );
        expect(
            screen.getByRole('heading', { name: 'Title here' }),
        ).toBeInTheDocument();
        expect(screen.getByText('A description.')).toBeInTheDocument();
        expect(screen.getByText('January 2026')).toBeInTheDocument();
        expect(screen.getByText('a')).toBeInTheDocument();
        expect(screen.getByText('b')).toBeInTheDocument();
        expect(screen.getByText('c')).toBeInTheDocument();
    });

    it('caps chips at five', () => {
        render(
            <Card
                href="/x"
                title="T"
                chips={['1', '2', '3', '4', '5', '6', '7']}
            />,
        );
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
        expect(screen.queryByText('6')).not.toBeInTheDocument();
    });

    it('omits description and chips when not provided', () => {
        render(<Card href="/x" title="T" />);
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
});
