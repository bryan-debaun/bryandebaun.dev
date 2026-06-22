import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import BooksTable from '@/components/BooksTable';
import Tabs from '@/components/Tabs';

export const metadata: Metadata = {
    title: 'Media — Bryan DeBaun',
    description:
        'Books Bryan DeBaun is reading, with personal ratings and short notes.',
};

export const dynamic = 'force-dynamic';

type MediaTab = {
    id: string;
    label: string;
    panel: ReactNode;
    // Tabs flagged `comingSoon` are kept in the data path but not rendered until
    // they have real content. Flip to `false` (or remove the flag) to re-enable.
    comingSoon?: boolean;
};

export default async function Page() {
    const books = await import('@/lib/services/books').then((m) =>
        m.listBooks(),
    );

    const hasBooks = Boolean(books && books.length > 0);

    const allTabs: MediaTab[] = [
        {
            id: 'books',
            label: 'Books',
            panel: hasBooks ? (
                <BooksTable books={books} />
            ) : (
                <p className="text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    No books to show just yet — check back soon.
                </p>
            ),
        },
        {
            id: 'movies',
            label: 'Movies',
            comingSoon: true,
            panel: (
                <div className="prose">
                    <p>
                        Coming soon — a list of movies I like and short notes.
                    </p>
                </div>
            ),
        },
        {
            id: 'games',
            label: 'Games',
            comingSoon: true,
            panel: (
                <div className="prose">
                    <p>
                        Coming soon — favorite video games and platform notes.
                    </p>
                </div>
            ),
        },
        {
            id: 'creators',
            label: 'Creators',
            comingSoon: true,
            panel: (
                <div className="prose">
                    <p>Coming soon — content creators I follow and why.</p>
                </div>
            ),
        },
    ];

    // Only render tabs that have content; empty "Coming soon" tabs stay hidden.
    const tabs = allTabs
        .filter((t) => !t.comingSoon)
        .map(({ comingSoon: _comingSoon, ...t }) => t);

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold w-full text-center">
                    Media
                </h1>
            </div>

            <Tabs tabs={tabs} />
        </main>
    );
}
