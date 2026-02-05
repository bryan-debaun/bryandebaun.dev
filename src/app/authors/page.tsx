import React from 'react';
import type { Author } from '@bryandebaun/mcp-client';

export default async function Page() {
    // Use service wrapper to fetch authors
    const { listAuthors } = await import('@/lib/services/authors');
    const authors = await listAuthors();

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
