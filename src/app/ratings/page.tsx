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
        <main style={{ padding: 24 }}>
            <h1>My Ratings</h1>
            {booksWithRatings.length === 0 ? (
                <p>No ratings found.</p>
            ) : (
                <ul>
                    {booksWithRatings.map((b) => (
                        <li key={b.id}>
                            {b.title} — {b.rating}
                            {b.review && (
                                <p
                                    style={{
                                        marginLeft: 16,
                                        fontSize: '0.9em',
                                    }}
                                >
                                    {b.review}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
