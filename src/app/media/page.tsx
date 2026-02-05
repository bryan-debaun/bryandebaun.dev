import BooksTable from '@/components/BooksTable';
import Tabs from '@/components/Tabs';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const [books, ratings] = await Promise.all([
        import('@/lib/services/books').then((m) => m.listBooks()),
        import('@/lib/services/ratings').then((m) => m.listRatings()),
    ]);

    if (!books || books.length === 0) console.warn('Media: empty response at render', { length: books?.length ?? 0, origin: process.env.NEXT_PUBLIC_SITE_URL });

    const tabs = [
        {
            id: 'books',
            label: 'Books',
            panel: (
                <div>
                    <BooksTable books={books} ratings={ratings} />
                </div>
            ),
        },
        {
            id: 'movies',
            label: 'Movies',
            panel: (
                <div className="prose">
                    <p>Coming soon — a list of movies I like and short notes.</p>
                </div>
            ),
        },
        {
            id: 'games',
            label: 'Games',
            panel: (
                <div className="prose">
                    <p>Coming soon — favorite video games and platform notes.</p>
                </div>
            ),
        },
        {
            id: 'creators',
            label: 'Creators',
            panel: (
                <div className="prose">
                    <p>Coming soon — content creators I follow and why.</p>
                </div>
            ),
        },
    ];

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold w-full text-center">Media</h1>
            </div>

            {(!books || books.length === 0) ? (
                <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <strong>No books available from server at render time.</strong>
                    <div className="mt-1 text-xs text-gray-600">books.length: {books ? books.length : 0} — rendered at {new Date().toISOString()}</div>
                </div>
            ) : null}

            <Tabs tabs={tabs} />
        </main>
    );
}
