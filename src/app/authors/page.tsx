import React from 'react';
import type { Author } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';

export default async function Page() {
    // Use fetchWithFallback so page is resilient in dev runtimes
    const res = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' });
    const data = await res.json();

    const authors = data?.authors ?? [];

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
    );
}
