import React from 'react'
import type { RatingWithDetails } from '@bryandebaun/mcp-client'

export default async function Page() {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
    const res = await fetch(`${origin}/api/mcp/ratings`, { cache: 'no-store' })
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
