import { normalizeIsbn } from '@/lib/isbn';

export type OpenLibraryMetadata = {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishDate?: string;
    pages?: number | null;
    publishers?: string[];
    description?: string;
    coverUrl?: string | null;
    source?: 'openlibrary';
};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache = new Map<string, { ts: number; data: OpenLibraryMetadata | null }>();

async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenLibrary fetch failed: ${res.status}`);
    return res.json();
}

export async function fetchByIsbn(isbnRaw?: string | null): Promise<OpenLibraryMetadata | null> {
    const isbn = normalizeIsbn(isbnRaw);
    if (!isbn) return null;

    const now = Date.now();
    const cached = cache.get(isbn);
    if (cached && now - cached.ts < CACHE_TTL) return cached.data;

    try {
        // OpenLibrary book endpoint: https://openlibrary.org/isbn/{ISBN}.json
        const url = `https://openlibrary.org/isbn/${isbn}.json`;
        const book = await fetchJson(url);

        // Authors are referenced by keys, fetch names in parallel when present.
        // Some ISBN editions don't include an "authors" array; in those cases we
        // can fall back to the work record which usually lists author references.
        const authors: string[] = [];

        // Primary: edition-level authors
        if (Array.isArray(book.authors) && book.authors.length) {
            await Promise.all(
                book.authors.map(async (a: any) => {
                    try {
                        const authorKey = a.key; // e.g., "/authors/OL12345A"
                        if (authorKey) {
                            const ad = await fetchJson(`https://openlibrary.org${authorKey}.json`);
                            if (ad && ad.name) authors.push(String(ad.name));
                        }
                    } catch (e) {
                        // ignore individual author failures
                    }
                })
            );
        }

        // Fallback: use the work record to resolve authors when edition lacks them
        if (!authors.length && Array.isArray(book.works) && book.works.length) {
            try {
                // Use the first work entry — usually sufficient for author lookups
                const workKey = book.works[0]?.key;
                if (workKey) {
                    const work = await fetchJson(`https://openlibrary.org${workKey}.json`);
                    if (work && Array.isArray(work.authors)) {
                        await Promise.all(
                            work.authors.map(async (wa: any) => {
                                try {
                                    const aKey = wa?.author?.key ?? wa?.key;
                                    if (aKey) {
                                        const ad = await fetchJson(`https://openlibrary.org${aKey}.json`);
                                        if (ad && ad.name) authors.push(String(ad.name));
                                    }
                                } catch (e) {
                                    // ignore per-author failures
                                }
                            })
                        );
                    }
                }
            } catch (e) {
                // ignore work-level failures
            }
        }

        // description can be string or object { value }
        const description = typeof book.description === 'string' ? book.description : (book.description?.value ?? undefined);

        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

        const data: OpenLibraryMetadata = {
            title: book.title,
            subtitle: book.subtitle,
            authors: authors.length ? authors : undefined,
            publishDate: book.publish_date,
            pages: book.number_of_pages ?? null,
            publishers: book.publishers,
            description,
            coverUrl,
            source: 'openlibrary',
        };

        cache.set(isbn, { ts: now, data });
        return data;
    } catch (e) {
        // mark negative cache to avoid repeated failures
        cache.set(isbn, { ts: now, data: null });
        return null;
    }
}

export function clearCache() {
    cache.clear();
}
