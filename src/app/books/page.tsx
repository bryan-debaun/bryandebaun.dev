import type { Metadata } from 'next';
import BooksTable from '@/components/BooksTable';

export const metadata: Metadata = {
    title: 'Books — Bryan DeBaun',
    description:
        'Books Bryan DeBaun has read, with personal ratings and reviews.',
};

// Force dynamic rendering so preview builds always render live data instead of stale SSG
export const dynamic = 'force-dynamic';

export default async function Page() {
    // Server-side fetch to our API routes via services.
    // Books now include embedded personal ratings (rating, review, ratedAt).
    const books = await import('@/lib/services/books').then((m) =>
        m.listBooks(),
    );

    const hasBooks = Boolean(books && books.length > 0);

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            {hasBooks ? (
                <BooksTable books={books} />
            ) : (
                <p className="text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    No books to show just yet — check back soon.
                </p>
            )}
        </main>
    );
}
