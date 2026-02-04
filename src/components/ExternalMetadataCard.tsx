'use client';
import React from 'react';

import Link from 'next/link';

export default function ExternalMetadataCard({ bookId, metadata, serverAuthors }: { bookId: number; metadata: any; serverAuthors?: any[] }) {
    // Try to find a server-side author that matches any of the metadata author names.
    let matchedAuthor: { id?: number; name?: string } | null = null;
    if (serverAuthors && metadata?.authors?.length) {
        const server = serverAuthors as any[];

        const normalizeName = (s: string) =>
            String(s)
                .toLowerCase()
                .replace(/[\p{P}\p{S}]/gu, '') // strip punctuation/symbols
                .replace(/\s+/g, ' ')
                .trim();

        for (const name of metadata.authors) {
            const norm = normalizeName(String(name));
            const found = server.find((s) => {
                const sname = (s?.author?.name ?? s?.name ?? '') as string;
                return sname && normalizeName(sname) === norm;
            });
            if (found) {
                const sname = found?.author?.name ?? found?.name;
                matchedAuthor = { id: found?.author?.id ?? found?.id, name: sname };
                break;
            }
        }
    }

    return (
        <div className="mt-4 p-4 rounded bg-transparent dark:bg-transparent">
            <div className="flex gap-4">
                {metadata.coverUrl ? (
                    <img src={metadata.coverUrl} alt={`${metadata.title ?? 'Cover'} cover`} className="w-32 h-auto object-cover rounded" />
                ) : (
                    <div className="w-32 h-40 bg-gray-100 rounded" />
                )}

                <div className="flex-1">
                    <h3 className="text-lg font-medium">{metadata.title}</h3>
                    {metadata.subtitle ? <div className="text-sm text-gray-600">{metadata.subtitle}</div> : null}
                    {metadata.authors?.length ? (
                        <div className="text-sm mt-1">By {metadata.authors.join(', ')}</div>
                    ) : null}
                    {metadata.publishDate ? <div className="text-sm text-gray-500 mt-2">Published {metadata.publishDate}</div> : null}
                    {metadata.pages ? <div className="text-sm text-gray-500">{metadata.pages} pages</div> : null}
                    {metadata.description ? <p className="mt-2 text-sm">{metadata.description}</p> : null}

                    {matchedAuthor ? (
                        <div className="mt-3">
                            <Link href={`/authors/${matchedAuthor.id}`} className="text-[var(--color-norwegian-600)] hover:underline">View author: {matchedAuthor.name}</Link>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}