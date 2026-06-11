import Stars from '@/components/Stars';
import StatusBadge from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { formatDate } from '@/lib/dates';
import BookEnrich from '@/components/BookEnrich';
import { getBookById } from '@/lib/services/books';

export default async function BookPage({
    params,
}: {
    params: { id: string } | Promise<{ id: string }>;
}) {
    const p = await params;
    const id = Number(p.id);

    try {
        // Use the service layer function which handles direct MCP calls + fallback logic
        const book = await getBookById(id);

        if (!book) {
            throw new Error(`Book ${id} not found`);
        }

        // Try server-side enrichment via OpenLibrary so we can show suggestions immediately
        let initialMetadata:
            | import('@/lib/services/openLibrary').OpenLibraryMetadata
            | null = null;
        try {
            const { fetchByIsbn } = await import('@/lib/services/openLibrary');
            initialMetadata = await fetchByIsbn(book.isbn);
        } catch {
            // ignore enrichment failures — we still render the page
        }

        return (
            <main className="p-6">
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <div className="flex items-center">
                        <BackButton fallbackHref="/books" />
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-semibold">{book.title}</h1>
                    </div>

                    <div className="flex justify-end">
                        {/* reserved for page actions */}
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-center gap-3">
                    <StatusBadge status={book.status} />
                </div>

                {/* If OpenLibrary suggested metadata exists, prefer it as the canonical section. Otherwise fall back to Description + Details */}
                {initialMetadata ? (
                    <div className="mb-6">
                        <BookEnrich
                            bookId={book.id}
                            isbn={book.isbn}
                            initialMetadata={initialMetadata}
                            serverAuthors={book.authors}
                        />
                    </div>
                ) : (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-medium">Description</h2>
                            <p className="mt-2 text-sm text-[var(--color-norwegian-700)] text-center">
                                {book.description ?? 'No description'}
                            </p>
                        </section>

                        <section className="mb-6">
                            <h2 className="text-lg font-medium">Details</h2>
                            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-center">
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        ISBN
                                    </dt>
                                    <dd className="mt-1">{book.isbn ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        Author
                                    </dt>
                                    <dd className="mt-1">
                                        {book.authors?.length ? (
                                            book.authors.map(
                                                (
                                                    a: {
                                                        author?: {
                                                            id?: number;
                                                            name?: string;
                                                        };
                                                        id?: number;
                                                        name?: string;
                                                    },
                                                    i: number,
                                                ) => {
                                                    const authorId =
                                                        a?.author?.id ?? a?.id;
                                                    const name =
                                                        a?.author?.name ??
                                                        a?.name ??
                                                        'Unknown';
                                                    return (
                                                        <span
                                                            key={`${authorId ?? name}-${i}`}
                                                        >
                                                            {authorId ? (
                                                                <Link
                                                                    href={`/authors/${authorId}`}
                                                                    className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                                                                >
                                                                    {name}
                                                                </Link>
                                                            ) : (
                                                                <span>
                                                                    {name}
                                                                </span>
                                                            )}
                                                            {i <
                                                            (book.authors
                                                                ?.length ?? 0) -
                                                                1
                                                                ? ', '
                                                                : ''}
                                                        </span>
                                                    );
                                                },
                                            )
                                        ) : (
                                            <span>Unknown</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        Published
                                    </dt>
                                    <dd className="mt-1">
                                        {formatDate(book.publishedAt)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">
                                        Updated
                                    </dt>
                                    <dd className="mt-1">
                                        {formatDate(book.updatedAt)}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    </>
                )}

                <section>
                    <h2 className="text-lg font-medium">My Rating</h2>
                    <div className="mt-2 text-center">
                        {typeof book.rating === 'number' ? (
                            <div className="p-3 rounded border border-[var(--tw-prose-td-borders)] text-center">
                                <div className="flex flex-col sm:flex-row items-center sm:justify-center sm:gap-3">
                                    <div className="flex items-center gap-3">
                                        <Stars value={book.rating} />
                                        <div className="text-sm">
                                            {book.rating} / 10
                                        </div>
                                    </div>
                                    {book.ratedAt && (
                                        <div className="text-xs text-gray-500 mt-2 sm:mt-0">
                                            {formatDate(book.ratedAt)}
                                        </div>
                                    )}
                                </div>
                                {book.review ? (
                                    <div className="mt-2 text-sm text-center">
                                        {book.review}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                No rating yet
                            </div>
                        )}
                    </div>
                </section>
            </main>
        );
    } catch (e: unknown) {
        console.error('Failed to fetch book', e);
        const msg = e instanceof Error ? e.message : String(e);
        return (
            <main className="p-6">
                <h2 className="text-lg font-semibold">Book not found</h2>
                <p className="mt-2 text-sm text-red-600">{msg}</p>
                <p className="mt-2">
                    Go back to the{' '}
                    <Link
                        href="/books"
                        className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                    >
                        books list
                    </Link>
                    .
                </p>
            </main>
        );
    }
}
