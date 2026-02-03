import type { Book, BookWithAuthors } from '@bryandebaun/mcp-client'
import { fetchWithFallback } from '@/lib/server-fetch'
import StatusBadge from '@/components/StatusBadge'
import Stars from '@/components/Stars'
import { averageByKey } from '@/lib/aggregates'
import type { RatingWithDetails } from '@bryandebaun/mcp-client'

export default async function Page() {
    // Server-side fetch to our API routes
    const booksRes = await fetchWithFallback('/api/mcp/books')

    // Fetch centralized ratings once and compute averages per book
    const ratingsRes = await fetchWithFallback('/api/mcp/ratings')

    const [booksData, ratingsData] = await Promise.all([booksRes.json(), ratingsRes.json()])
    const books: BookWithAuthors[] = booksData?.books ?? []
    const ratings: RatingWithDetails[] = ratingsData?.ratings ?? []

    const avgMap = averageByKey(ratings, r => r.bookId, r => r.rating)

    const avgRating = (book: BookWithAuthors) => {
        const v = (book as Book as { averageRating?: number }).averageRating
        if (typeof v === 'number' && !Number.isNaN(v)) return v
        const mapVal = avgMap.get(book.id)
        if (typeof mapVal === 'number') return mapVal
        return undefined
    }

    function getAuthorNames(book: BookWithAuthors) {
        if (!book.authors) return 'Unknown'
        type AuthorLink = { author?: { name?: string }; name?: string }
        const names = (book.authors as AuthorLink[]).map(a => a?.author?.name ?? a?.name).filter(Boolean)
        return names.length ? names.join(', ') : 'Unknown'
    }

    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <caption className="sr-only">Books list</caption>
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">Author(s)</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rating</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {books.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.title}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getAuthorNames(b)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {(() => {
                                        const avg = avgRating(b)
                                        return typeof avg === 'number' ? (
                                            <div className="flex items-center gap-3">
                                                <Stars value={avg} />
                                                <span className="text-sm text-gray-600">{avg.toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">—</span>
                                        )
                                    })()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <StatusBadge status={b.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    )
}

