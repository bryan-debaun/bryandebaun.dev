'use client';
import React from 'react';
import ExternalMetadataCard from './ExternalMetadataCard';
import type { OpenLibraryMetadata } from '@/lib/services/openLibrary';

type ServerAuthorRef = { author?: { id?: number; name?: string } };

export default function BookEnrich({ bookId, isbn, initialMetadata, serverAuthors }: { bookId: number; isbn?: string | null; initialMetadata?: OpenLibraryMetadata | null; serverAuthors?: ServerAuthorRef[] }) {
    const metadata = initialMetadata ?? null;
    if (!isbn) return null;

    // Render metadata passively (no action buttons)
    return (
        <div className="mt-6">
            {metadata ? <ExternalMetadataCard bookId={bookId} metadata={metadata} serverAuthors={serverAuthors} /> : null}
        </div>
    );
}