import BooksTable from '@/components/BooksTable';

// Force dynamic rendering so preview builds always render live data instead of stale SSG
export const dynamic = 'force-dynamic';

export default async function Page() {
    // Server-side fetch to our API routes via services
    const [books, ratings] = await Promise.all([
        import('@/lib/services/books').then(m => m.listBooks()),
        import('@/lib/services/ratings').then(m => m.listRatings()),
    ]);

    // Helpful server-side debug log for preview builds — removed when not needed
    if (!books || books.length === 0) console.warn('Books: empty response at render', { length: books?.length ?? 0, origin: process.env.NEXT_PUBLIC_SITE_URL });

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            {/* Show a visible debug banner in preview environments when no books were returned at render time */}
            {(!books || books.length === 0) ? (
                <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <strong>No books available from server at render time.</strong>
                    <div className="mt-1 text-xs text-gray-600">books.length: {books ? books.length : 0} — rendered at {new Date().toISOString()}</div>
                </div>
            ) : null}

            <BooksTable books={books} ratings={ratings} />
        </main>
    );
}

