import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';
import type { RatingWithDetails } from '@bryandebaun/mcp-client';
import BooksTable from '@/components/BooksTable';


export default async function Page() {
    // Server-side fetch to our API routes
    const booksRes = await fetchWithFallback('/api/mcp/books');

    // Fetch centralized ratings once and compute averages per book
    const ratingsRes = await fetchWithFallback('/api/mcp/ratings');

    const [booksData, ratingsData] = await Promise.all([booksRes.json(), ratingsRes.json()]);
    const books: BookWithAuthors[] = booksData?.books ?? [];
    const ratings: RatingWithDetails[] = ratingsData?.ratings ?? [];

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            <BooksTable books={books} ratings={ratings} />
        </main>
    );
}

