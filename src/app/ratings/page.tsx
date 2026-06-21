import type { Metadata } from 'next';
import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';

export const metadata: Metadata = {
    title: 'My Ratings — Bryan DeBaun',
    description:
        'Bryan DeBaun’s personal book ratings and short reviews from his reading library.',
};

export default async function Page() {
    // Ratings are now embedded in books - fetch books and show those with ratings
    const res = await fetchWithFallback('/api/mcp/books', {
        cache: 'no-store',
    });
    const data = await res.json();

    const books: BookWithAuthors[] = data?.books ?? [];
    const booksWithRatings = books.filter((b) => typeof b.rating === 'number');

    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none">
            <h2>My Ratings</h2>
            {booksWithRatings.length === 0 ? (
                <p>No ratings found.</p>
            ) : (
                <ul>
                    {booksWithRatings.map((b) => (
                        <li key={b.id}>
                            {b.title} — {b.rating}
                            {b.review ? (
                                <p className="ml-4 text-sm">{b.review}</p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
