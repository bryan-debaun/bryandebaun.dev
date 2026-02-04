import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Providers from '@/components/Providers';
import { ItemStatus } from '@bryandebaun/mcp-client';
import { useBooks } from '../useBooks';

const sampleBook = (id: number, avg?: number) => ({
    id,
    title: `Book ${id}`,
    status: ItemStatus.NOT_STARTED,
    createdAt: '',
    updatedAt: '',
    authors: [],
    averageRating: avg,
});

function Harness({ books, ratings }: { books: any[]; ratings: any[] }) {
    const { rows, toggleStatus } = useBooks(books, ratings);
    return (
        <div>
            <div data-testid="rating">{rows[0]?.averageRating?.toFixed(1)}</div>
            <button onClick={() => toggleStatus(rows[0])}>toggle</button>
        </div>
    );
}

describe('useBooks override/merge behavior', () => {
    afterEach(() => vi.restoreAllMocks());

    it('applies server override even when using initialBooks as source', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, averageRating: 9.0 }) } as any));

        render(
            <Providers>
                <Harness books={[sampleBook(1, 1.0)]} ratings={[]} />
            </Providers>,
        );

        // initial value
        expect(screen.getByTestId('rating')).toHaveTextContent('1.0');

        // trigger optimistic toggle -> server responds with avg 9.0 -> override should update row even when using initialBooks
        fireEvent.click(screen.getByRole('button', { name: /toggle/i }));

        expect(await screen.findByText('9.0')).toBeInTheDocument();
    });
});