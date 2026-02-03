import React from 'react'
import type { Author } from '@bryandebaun/mcp-client'

export default async function Page() {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
    const res = await fetch(`${origin}/api/mcp/authors`, { cache: 'no-store' })
    const data = await res.json()

    const authors = data?.authors ?? []

    return (
        <main style={{ padding: 24 }}>
            <h1>Authors</h1>
            {authors.length === 0 ? (
                <p>No authors found.</p>
            ) : (
                <ul>
                    {authors.map((a: Author) => (
                        <li key={a.id}>{a.name}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}
