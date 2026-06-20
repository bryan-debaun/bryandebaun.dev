'use client';
import React, { useState, useEffect, useRef } from 'react';
import type {
    AuthorWithBooks,
    CreateBookRequest,
} from '@bryandebaun/mcp-client';
import { ItemStatus } from '@/lib/types';
import type { BookRow } from '@/lib/books';
import * as authorsRepo from '@/lib/repositories/authorsRepository';
import Stars from '@/components/Stars';

type BookFormData = CreateBookRequest & { rating?: number | null };

type Props = {
    mode: 'create' | 'edit';
    initialValues?: Partial<BookRow>;
    onSubmit: (data: BookFormData) => Promise<void>;
    onCancel: () => void;
};

const STATUS_LABELS: Record<ItemStatus, string> = {
    [ItemStatus.NOT_STARTED]: 'Not Started',
    [ItemStatus.IN_PROGRESS]: 'In Progress',
    [ItemStatus.COMPLETED]: 'Completed',
};

function normalise(s: string) {
    return s.trim().toLowerCase();
}

export default function BookForm({
    mode,
    initialValues,
    onSubmit,
    onCancel,
}: Props) {
    const [title, setTitle] = useState(initialValues?.title ?? '');
    const [status, setStatus] = useState<ItemStatus>(
        (initialValues?.status as ItemStatus) ?? ItemStatus.NOT_STARTED,
    );
    const [description, setDescription] = useState(
        initialValues?.description ?? '',
    );
    const [isbn, setIsbn] = useState(initialValues?.isbn ?? '');
    const [publishedAt, setPublishedAt] = useState(
        initialValues?.publishedAt
            ? initialValues.publishedAt.slice(0, 10)
            : '',
    );
    const [rating, setRating] = useState<number | null>(
        initialValues?.rating ?? null,
    );

    // Author names as plain strings; resolved to IDs on submit
    const [authorNames, setAuthorNames] = useState<string[]>(() => {
        if (!initialValues?.authors) return [];
        const result: string[] = [];
        for (const a of initialValues.authors as {
            author?: { name?: string };
            name?: string;
        }[]) {
            const name = a?.author?.name ?? a?.name ?? '';
            if (name) result.push(name);
        }
        return result;
    });
    const [authorInput, setAuthorInput] = useState('');
    const [existingAuthors, setExistingAuthors] = useState<AuthorWithBooks[]>(
        [],
    );
    const authorInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/mcp/authors')
            .then((res) => (res.ok ? res.json() : { authors: [] }))
            .then((data: { authors?: AuthorWithBooks[] }) =>
                setExistingAuthors(data?.authors ?? []),
            )
            .catch(() => setExistingAuthors([]));
    }, []);

    function commitAuthorInput(raw: string) {
        const name = raw.trim();
        if (!name) return;
        if (authorNames.some((n) => normalise(n) === normalise(name))) {
            setAuthorInput('');
            return;
        }
        setAuthorNames((prev) => [...prev, name]);
        setAuthorInput('');
        authorInputRef.current?.focus();
    }

    function removeAuthor(index: number) {
        setAuthorNames((prev) => prev.filter((_, i) => i !== index));
    }

    function handleAuthorKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitAuthorInput(authorInput);
        }
        if (
            e.key === 'Backspace' &&
            authorInput === '' &&
            authorNames.length > 0
        ) {
            setAuthorNames((prev) => prev.slice(0, -1));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        // Commit any in-progress author input before submitting
        const allNames = authorInput.trim()
            ? [...new Set([...authorNames, authorInput.trim()])]
            : authorNames;

        setError(null);
        setLoading(true);
        try {
            const resolvedIds: number[] = [];
            for (const name of allNames) {
                const existing = existingAuthors.find(
                    (a) => normalise(a.name) === normalise(name),
                );
                if (existing) {
                    resolvedIds.push(existing.id);
                } else {
                    const created = await authorsRepo.createAuthor({
                        name: name.trim(),
                    });
                    resolvedIds.push(created.id);
                }
            }

            await onSubmit({
                title: title.trim(),
                status,
                description: description.trim() || undefined,
                isbn: isbn.trim() || undefined,
                publishedAt: publishedAt || undefined,
                authorIds: resolvedIds.length > 0 ? resolvedIds : undefined,
                rating: rating ?? null,
            });
        } catch {
            setError('Failed to save book.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'create' ? 'New Book' : 'Edit Book'}
        >
            <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                    {mode === 'create' ? 'New Book' : 'Edit Book'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="book-title"
                            className="block text-sm font-medium"
                        >
                            Title{' '}
                            <span className="text-red-500" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <input
                            id="book-title"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Status - segmented button group avoids native select dark-mode issues */}
                    <div>
                        <p className="block text-sm font-medium mb-1">Status</p>
                        <div
                            className="flex rounded-md overflow-hidden border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]"
                            role="group"
                            aria-label="Book status"
                        >
                            {Object.values(ItemStatus).map((s, i) => (
                                <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={status === s}
                                    onClick={() => setStatus(s)}
                                    className={[
                                        'flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] focus-visible:z-10',
                                        i > 0
                                            ? 'border-l border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]'
                                            : '',
                                        status === s
                                            ? 'bg-[var(--btn-accent)] text-white'
                                            : 'bg-transparent text-[var(--color-norwegian-700)] dark:text-[var(--tw-prose-invert-body)] hover:bg-[var(--color-norwegian-100)] dark:hover:bg-white/10',
                                    ].join(' ')}
                                >
                                    {STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="book-description"
                            className="block text-sm font-medium"
                        >
                            Description
                        </label>
                        <textarea
                            id="book-description"
                            className="mt-1 w-full form-input"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* ISBN */}
                    <div>
                        <label
                            htmlFor="book-isbn"
                            className="block text-sm font-medium"
                        >
                            ISBN
                        </label>
                        <input
                            id="book-isbn"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                        />
                    </div>

                    {/* Published Date */}
                    <div>
                        <label
                            htmlFor="book-published"
                            className="block text-sm font-medium"
                        >
                            Published Date
                        </label>
                        <input
                            id="book-published"
                            type="date"
                            className="mt-1 w-full form-input"
                            value={publishedAt}
                            onChange={(e) => setPublishedAt(e.target.value)}
                        />
                    </div>

                    {/* Rating */}
                    <div>
                        <p className="block text-sm font-medium mb-1">
                            My Rating
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                className="flex rounded-md overflow-hidden border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]"
                                role="group"
                                aria-label="Book rating"
                            >
                                {Array.from(
                                    { length: 10 },
                                    (_, i) => i + 1,
                                ).map((n, i) => (
                                    <button
                                        key={n}
                                        type="button"
                                        aria-label={`Rate ${n} out of 10`}
                                        aria-pressed={rating === n}
                                        onClick={() =>
                                            setRating(rating === n ? null : n)
                                        }
                                        className={[
                                            'w-8 py-2 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] focus-visible:z-10',
                                            i > 0
                                                ? 'border-l border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]'
                                                : '',
                                            rating === n
                                                ? 'bg-[var(--btn-accent)] text-white'
                                                : 'bg-transparent text-[var(--color-norwegian-700)] dark:text-[var(--tw-prose-invert-body)] hover:bg-[var(--color-norwegian-100)] dark:hover:bg-white/10',
                                        ].join(' ')}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            {rating !== null && (
                                <>
                                    <Stars value={rating} />
                                    <button
                                        type="button"
                                        className="text-xs text-[var(--color-norwegian-500)] dark:text-[var(--color-norwegian-400)] hover:text-red-500 cursor-pointer"
                                        onClick={() => setRating(null)}
                                        aria-label="Clear rating"
                                    >
                                        Clear
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Authors - free-text tag input */}
                    <div>
                        <label
                            htmlFor="book-author-input"
                            className="block text-sm font-medium mb-1"
                        >
                            Authors
                        </label>

                        {authorNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {authorNames.map((name, i) => (
                                    <span
                                        key={`${name}-${i}`}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--btn-accent)]/15 text-[var(--color-norwegian-700)] dark:text-[var(--tw-prose-invert-body)] border border-[var(--btn-accent)]/30"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            aria-label={`Remove ${name}`}
                                            className="leading-none hover:text-red-500 cursor-pointer"
                                            onClick={() => removeAuthor(i)}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <input
                            id="book-author-input"
                            ref={authorInputRef}
                            type="text"
                            className="w-full form-input"
                            placeholder="Type a name and press Enter"
                            value={authorInput}
                            autoComplete="off"
                            onChange={(e) => setAuthorInput(e.target.value)}
                            onBlur={() => commitAuthorInput(authorInput)}
                            onKeyDown={handleAuthorKeyDown}
                        />
                        <p className="mt-1 text-xs text-[var(--color-norwegian-500)] dark:text-[var(--color-norwegian-400)]">
                            Press Enter to add. Existing authors are matched by
                            name; new names create a new author entry.
                        </p>
                    </div>

                    {error ? (
                        <div className="text-sm text-red-600" role="alert">
                            {error}
                        </div>
                    ) : null}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Saving...'
                                : mode === 'create'
                                  ? 'Create'
                                  : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
