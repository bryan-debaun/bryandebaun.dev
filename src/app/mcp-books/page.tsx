import React from 'react'
import type { Book } from '@bryandebaun/mcp-client'

export default async function Page() {
    // Server-side fetch to our API route — use an absolute URL on the server
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
    const res = await fetch(`${origin}/api/mcp/books`, { cache: 'no-store' })
    const data = await res.json()

    const books = data?.books ?? []

    return (
        <main style={{ padding: 24 }}>
            <h1>Books (MCP demo)</h1>
            {books.length === 0 ? (
                <p>No books found.</p>
            ) : (
                <ul>
                    {books.map((b: Book) => (
                        <li key={b.id}>{b.title}</li>
                    ))}
                </ul>
            )}
        </main>
    )
} 
