import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default async function AuthorPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
    const p = await params;
    const id = Number(p.id);

    try {
        const { getAuthorById } = await import('@/lib/services/authors');
        const author = await getAuthorById(id);
        if (!author) throw new Error(`Failed to fetch author ${id}`);

        return (
            <main className="p-6">
                <div className="mb-3"><BackButton fallbackHref="/authors" /></div>
                <h1 className="text-2xl font-semibold mb-2">{author.name}</h1>
                <div className="mb-4 text-sm text-[var(--color-norwegian-700)]">{author.bio ?? 'No bio available'}</div>

                <section>
                    <h2 className="text-lg font-medium">Books by this author</h2>
                    <div className="mt-2 space-y-2">
                        {author.books && author.books.length ? (
                            author.books.map((b: { id?: number; title?: string }, i: number) => (
                                <div key={b?.id ?? `${b?.title ?? 'book'}-${i}`} className="text-sm">
                                    <Link href={`/books/${b?.id ?? ''}`} className="text-[var(--color-norwegian-600)] hover:underline">{b.title}</Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500">No books listed</div>
                        )}
                    </div>
                </section>
            </main>
        );
    } catch (e: unknown) {
        console.error('Failed to fetch author', e);
        return <main className="p-6">Author not found</main>;
    }
}
