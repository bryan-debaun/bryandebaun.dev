import React from 'react'
import type { RatingWithDetails } from '@bryandebaun/mcp-client'
import { fetchWithFallback } from '@/lib/server-fetch'

export default async function Page() {
    // Use fetchWithFallback so page is resilient in dev runtimes
    const res = await fetchWithFallback('/api/mcp/ratings', { cache: 'no-store' })
    const data = await res.json()

    const ratings = data?.ratings ?? []

    return (
        <main style={{ padding: 24 }}>
            <h1>Ratings</h1>
            {ratings.length === 0 ? (
                <p>No ratings found.</p>
            ) : (
                <ul>
                    {ratings.map((r: RatingWithDetails) => (
                        <li key={r.id}>{r.book?.title ?? 'Unknown book'} — {r.rating}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}
