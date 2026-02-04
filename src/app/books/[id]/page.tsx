import { RatingWithDetails } from '@bryandebaun/mcp-client';
import Stars from '@/components/Stars';
import StatusBadge from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { formatDate } from '@/lib/dates';
import BookEnrich from '@/components/BookEnrich';

export default async function BookPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
    const p = await params;
    const id = Number(p.id);

    try {
        // Use the local proxy rather than calling the external MCP directly. This centralizes
        // base URL configuration and makes behavior more predictable in dev/test.
        // Use the server-safe fetch helper which retries with an absolute origin when needed.
        const [{ getBookById }, { listRatings }] = await Promise.all([
            import('@/lib/services/books'),
            import('@/lib/services/ratings'),
        ]);

        // Fetch book details with diagnostic info so we can show helpful errors
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        const bookRes = await fetchWithFallback(`/api/mcp/books/${id}`);
        if (!bookRes.ok) {
            const txt = await bookRes.text().catch(() => '');
            throw new Error(`Failed to fetch book ${id}: ${bookRes.status}${txt ? ` - ${txt}` : ''}`);
        }
        const book = await bookRes.json();

        const ratings = await listRatings({ bookId: id });

        // Try server-side enrichment via OpenLibrary so we can show suggestions immediately
        let initialMetadata = null;
        try {
            const { fetchByIsbn } = await import('@/lib/services/openLibrary');
            initialMetadata = await fetchByIsbn(book.isbn);
        } catch (e) {
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
                        <BookEnrich bookId={book.id} isbn={book.isbn} initialMetadata={initialMetadata} serverAuthors={book.authors} />
                    </div>
                ) : (
                    <>
                        <section className="mb-6">
                            <h2 className="text-lg font-medium">Description</h2>
                            <p className="mt-2 text-sm text-[var(--color-norwegian-700)] text-center">{book.description ?? 'No description'}</p>
                        </section>

                        <section className="mb-6">
                            <h2 className="text-lg font-medium">Details</h2>
                            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-center">
                                <div>
                                    <dt className="text-xs text-gray-500">ISBN</dt>
                                    <dd className="mt-1">{book.isbn ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Author</dt>
                                    <dd className="mt-1">
                                        {book.authors && book.authors.length ? (
                                            book.authors.map((a: any, i: number) => {
                                                type AuthorRef = { author?: { id?: number; name?: string }; id?: number; name?: string };
                                                const ref = a as AuthorRef;
                                                const authorId = ref?.author?.id ?? ref?.id;
                                                const name = ref?.author?.name ?? ref?.name ?? 'Unknown';
                                                return (
                                                    <span key={`${authorId ?? name}-${i}`}>
                                                        {authorId ? (
                                                            <Link href={`/authors/${authorId}`} className="text-[var(--color-norwegian-600)] hover:underline">{name}</Link>
                                                        ) : (
                                                            <span>{name}</span>
                                                        )}{i < (book.authors?.length ?? 0) - 1 ? ', ' : ''}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span>Unknown</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Published</dt>
                                    <dd className="mt-1">{formatDate(book.publishedAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Updated</dt>
                                    <dd className="mt-1">{formatDate(book.updatedAt)}</dd>
                                </div>
                            </dl>
                        </section>
                    </>
                )}

                <section>
                    <h2 className="text-lg font-medium">My Rating</h2>
                    <div className="mt-2 space-y-2 text-center">
                        {ratings.length ? (
                            ratings.map((r: RatingWithDetails) => (
                                <div key={r.id} className="p-3 rounded border border-[var(--tw-prose-td-borders)] text-center">
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-center sm:gap-3">
                                        <div className="flex items-center gap-3">
                                            <Stars value={r.rating} />
                                            <div className="text-sm">{r.rating} / 10</div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 sm:mt-0">{formatDate(r.createdAt)}</div>
                                    </div>
                                    {r.review ? <div className="mt-2 text-sm text-center">{r.review}</div> : null}
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500">No ratings yet</div>
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
                <p className="mt-2">Go back to the <a href="/books" className="text-[var(--color-norwegian-600)] hover:underline">books list</a>.</p>
            </main>
        );
    }
}
