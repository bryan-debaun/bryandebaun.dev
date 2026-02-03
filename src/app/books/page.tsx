import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';
import BooksTableClient from '@/components/BooksTableClient';
import { averageByKey } from '@/lib/aggregates';
import type { RatingWithDetails } from '@bryandebaun/mcp-client';

export default async function Page() {
    // Server-side fetch to our API routes
    const booksRes = await fetchWithFallback('/api/mcp/books');

    // Fetch centralized ratings once and compute averages per book
    const ratingsRes = await fetchWithFallback('/api/mcp/ratings');

    const [booksData, ratingsData] = await Promise.all([booksRes.json(), ratingsRes.json()]);
    const books: BookWithAuthors[] = booksData?.books ?? [];
    const ratings: RatingWithDetails[] = ratingsData?.ratings ?? [];

    const avgMap = averageByKey(ratings, r => r.bookId, r => r.rating);

    // Materialize averageRating on each book for client table initial state
    const initialData = books.map((b) => {
        const br = b as BookWithAuthors & Partial<{ averageRating?: number }>;
        const avg = typeof br.averageRating === 'number' && !Number.isNaN(br.averageRating) ? br.averageRating : avgMap.get(b.id);
        return { ...b, averageRating: avg };
    }) as (BookWithAuthors & { averageRating?: number })[];

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            <BooksTableClient initialData={initialData} />
        </main>
    );
}

