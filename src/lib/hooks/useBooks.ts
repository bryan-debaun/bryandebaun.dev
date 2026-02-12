import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { BookWithAuthors, RatingWithDetails } from '@bryandebaun/mcp-client';
import { ItemStatus } from '@bryandebaun/mcp-client';
import * as repo from '@/lib/repositories/booksRepository';
import { generateBookRows, type BookRow } from '@/lib/books';
import { mergeBook, toggledStatus } from '@/lib/managers/booksManager';

type BookWithAuthorsExt = BookWithAuthors & { averageRating?: number | null; _loading?: boolean; _error?: string; status?: import('@bryandebaun/mcp-client').ItemStatus | string };

const BOOKS_KEY = ['books'];

export function useBooks(initialBooks?: BookWithAuthors[], initialRatings?: RatingWithDetails[]) {
    const qc = useQueryClient();
    // Local override map to track optimistic overlays and server-merged updates
    const [overrides, setOverrides] = useState<Map<number, Partial<BookRow & { _loading?: boolean; _error?: string }>>>(() => new Map());

    const booksQuery = useQuery({
        queryKey: BOOKS_KEY,
        queryFn: async () => {
            const data = await repo.listBooks();
            return data as BookWithAuthors[];
        },
        initialData: initialBooks,
    });

    // Derive rows from server books and any ratings embedded in books
    const sourceBooks = initialBooks ?? booksQuery.data;
    const baseRows: BookRow[] = (sourceBooks && generateBookRows(sourceBooks, initialRatings ?? [])) ?? [];

    // Attach any per-row loading/error flags from cache entries so view gets them even when mocked generateBookRows drops them
    const rows: (BookRow & { _loading?: boolean; _error?: string })[] = (() => {
        const cache = booksQuery.data as BookWithAuthorsExt[] | undefined;
        if (!cache) return baseRows as (BookRow & { _loading?: boolean; _error?: string })[];
        const cacheMap = new Map<number, BookWithAuthorsExt>(cache.map((b) => [b.id as number, b]));
        const usingInitial = sourceBooks === initialBooks;
        // debug removed — keep deriving but without noisy logs
        return baseRows.map((r) => {
            const ext = cacheMap.get(r.id as number);
            // When using initialBooks as the source, prefer the initialBooks-derived row values
            // and only attach loading/error flags from cache. This prevents stale cache fields
            // (e.g., old averageRating) from overwriting updated server props that arrived via initialBooks.
            let merged: BookRow & { _loading?: boolean; _error?: string };
            if (usingInitial) {
                merged = { ...r, _loading: ext?._loading, _error: ext?._error };
            } else {
                merged = { ...(r as BookRow), ...(ext ?? {}) } as BookRow & { _loading?: boolean; _error?: string };
            }
            // Apply any local overrides (optimistic/server merges) which may be tracked separately
            const ov = overrides.get(r.id as number);
            if (ov) merged = { ...merged, ...(ov as Partial<typeof merged>) };
            return merged;
        });
    })();

    // If initialBooks changes, merge it into the cache while preserving any local optimistic state
    useEffect(() => {
        if (!initialBooks) return;
        // Merge incoming books into cache, preferring existing entries when they've been locally modified
        qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (old = []) => {
            const oldMap = new Map(old.map((b) => [b.id, b]));
            const next = initialBooks.map((ib) => {
                const existing = oldMap.get(ib.id as number);
                if (!existing) return ib as BookWithAuthorsExt;
                // If entry has loading/error flag, keep existing to preserve optimistic state
                if (existing._loading || existing._error) return existing;
                // Otherwise merge server changes into existing
                return { ...existing, ...ib } as BookWithAuthorsExt;
            });
            return next;
        });
    }, [initialBooks, qc]);

    const mutation = useMutation({
        mutationFn: async (book?: BookRow) => {
            if (!book) throw new Error('No book provided to mutation');
            const newStatus = toggledStatus(book.status as ItemStatus);
            return await repo.updateBookStatus(book.id as number, newStatus);
        },
        onMutate: async (book?: BookRow) => {
            await qc.cancelQueries({ queryKey: BOOKS_KEY });
            const previous = qc.getQueryData<BookWithAuthors[]>(BOOKS_KEY);
            if (!book) return { previous };
            qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (old = previous ?? initialBooks ?? []) => {
                const base = ((old as BookWithAuthorsExt[])?.length ? (old as BookWithAuthorsExt[]) : (initialBooks ?? []).map((b) => ({ ...(b as BookWithAuthorsExt) })));
                // also track override state locally so UI renders even when derive step prefers initialBooks
                setOverrides((prev) => {
                    const n = new Map(prev);
                    n.set(book.id as number, { ...(n.get(book.id as number) ?? {}), status: toggledStatus(book.status as ItemStatus), _loading: true, _error: undefined });
                    return n;
                });
                return base.map((b) =>
                    b.id === book.id
                        ? ({ ...mergeBook(b, { ...b, status: toggledStatus(b.status as ItemStatus) }), _loading: true } as BookWithAuthorsExt)
                        : b,
                );
            });
            return { previous };
        },
        onError: (err, variables: BookRow | undefined, context: { previous?: BookWithAuthors[] } | undefined) => {
            // Restore previous snapshot if available, otherwise fallback to initialBooks
            if (context?.previous) qc.setQueryData<BookWithAuthors[]>(BOOKS_KEY, context.previous);
            else if (initialBooks) qc.setQueryData<BookWithAuthors[]>(BOOKS_KEY, initialBooks);

            // Also set a per-row error message so the UI can show inline errors
            if (variables?.id) {
                qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (old = initialBooks ?? []) => {
                    const base = ((old as BookWithAuthorsExt[])?.length ? (old as BookWithAuthorsExt[]) : (initialBooks ?? []).map((b) => ({ ...(b as BookWithAuthorsExt) })));
                    const next = base.map((b) => (b.id === variables.id ? ({ ...b, _loading: false, _error: 'Failed to update' } as BookWithAuthorsExt) : b));
                    // set local override so UI shows error immediately
                    setOverrides((prev) => {
                        const n = new Map(prev);
                        n.set(variables.id as number, { ...(n.get(variables.id as number) ?? {}), _loading: false, _error: 'Failed to update' });
                        return n;
                    });
                    // touch cache to notify
                    qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (o = []) => o);
                    return next;
                });
            }
        },

        onSuccess: (data: Partial<BookWithAuthorsExt> | undefined) => {
            // Merge server response into cache immediately (handles tests that stub the updated book payload)
            if (data?.id) {
                // update cache and apply local override so derived rows reflect server response immediately
                qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (old = initialBooks ?? []) => {
                    const base = ((old as BookWithAuthorsExt[])?.length ? (old as BookWithAuthorsExt[]) : (initialBooks ?? []).map((b) => ({ ...(b as BookWithAuthorsExt) })));
                    const next = base.map((b) => (b.id === data.id ? ({ ...b, ...data, _loading: false, _error: undefined } as BookWithAuthorsExt) : b));
                    // set a local override to ensure that derive step (which may prefer initialBooks) picks up the server avg
                    setOverrides((prev) => {
                        const n = new Map(prev);
                        n.set(data.id as number, { ...(n.get(data.id as number) ?? {}), ...(data as Partial<BookWithAuthorsExt>), _loading: false, _error: undefined });
                        return n;
                    });
                    return next;
                });
                // touch query to notify subscribers
                qc.setQueryData<BookWithAuthorsExt[]>(BOOKS_KEY, (old = []) => old);
            }
        },


        onSettled: () => {
            qc.invalidateQueries({ queryKey: BOOKS_KEY });
        },
    });

    return {
        books: booksQuery.data ?? [],
        rows,
        isLoading: booksQuery.isLoading,
        isError: booksQuery.isError,
        toggleStatus: (book: BookRow) => mutation.mutate(book),
        toggleStatusAsync: (book: BookRow) => mutation.mutateAsync(book),
        mutation,
    };
}
