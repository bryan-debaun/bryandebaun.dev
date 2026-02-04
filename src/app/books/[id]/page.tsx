import { RatingWithDetails } from '@bryandebaun/mcp-client';
import Stars from '@/components/Stars';
import StatusBadge from '@/components/StatusBadge';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { formatDate } from '@/lib/dates';

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

        const book = await getBookById(id);
        if (!book) throw new Error(`Failed to fetch book ${id}`);

        const ratings = await listRatings({ bookId: id });

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
                                    book.authors.map((a, i: number) => {
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

                <section>
                    <h2 className="text-lg font-medium">My Rating:</h2>
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
        return <main className="p-6">Book not found</main>;
    }
}
