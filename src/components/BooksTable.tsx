'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import type { ColumnDef, CellContext } from '@tanstack/react-table';
import Table from './Table';
import Stars from './Stars';
import StatusBadge from './StatusBadge';
import BookForm from './admin/BookForm';
import { bookColumnDescriptors, type BookRow } from '@/lib/books';
import { useBooks } from '@/lib/hooks/useBooks';
import type {
    BookWithAuthors,
    CreateBookRequest,
} from '@bryandebaun/mcp-client';

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; book: BookRow }
    | { mode: 'delete'; id: number; title: string };

type Props = {
    books?: BookWithAuthors[];
    // When true, show admin-only actions (toggle status, edit, delete). Default false.
    isAdmin?: boolean;
};

export default function BooksTable({ books, isAdmin = false }: Props) {
    const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
    // Use the hook and seed with server-provided data when available
    const {
        rows: hookRows,
        createBook,
        deleteBook,
        updateBook,
    } = useBooks(books);

    const rows: BookRow[] = hookRows ?? [];

    // Build columns (same structure previously in BooksTableView)
    const columns = useMemo<ColumnDef<BookRow, unknown>[]>(() => {
        const cols = bookColumnDescriptors
            .map((cd) => {
                if (cd.type === 'actions') {
                    if (!isAdmin) return null;

                    return {
                        id: cd.id ?? 'actions',
                        header: cd.header,
                        meta: {
                            headerClassName: 'w-32 text-right',
                            cellClassName: 'w-32 text-right',
                        },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const book = info.row.original as BookRow;
                            const ext = book as BookRow & {
                                _loading?: boolean;
                                _error?: string;
                            };
                            const error = ext._error;
                            const btnBase = `inline-flex items-center justify-center rounded-md p-2 text-xs text-[var(--color-white)] cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]`;
                            const btnDanger = `bg-gradient-to-b from-red-600 to-red-500 hover:from-red-500 hover:to-red-600`;
                            const btnNeutral = `bg-gradient-to-b from-[var(--color-norwegian-600)] to-[var(--color-norwegian-500)] hover:from-[var(--color-norwegian-500)] hover:to-[var(--color-norwegian-600)]`;
                            return (
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        {/* Edit */}
                                        <button
                                            className={`${btnBase} ${btnNeutral}`}
                                            aria-label={`Edit ${book.title}`}
                                            title="Edit book"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDialog({
                                                    mode: 'edit',
                                                    book,
                                                });
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9A2 2 0 0116 10H4a1 1 0 100 2h12a4 4 0 004-4V8a1 1 0 00-1-1h-1.586zM2 14a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1z" />
                                                <path d="M3 6a1 1 0 011-1h9.172l-3.536 3.536A2 2 0 009 10H4a1 1 0 01-1-1V6z" />
                                            </svg>
                                        </button>
                                        {/* Delete */}
                                        <button
                                            className={`${btnBase} ${btnDanger}`}
                                            aria-label={`Delete ${book.title}`}
                                            title="Delete book"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDialog({
                                                    mode: 'delete',
                                                    id: book.id as number,
                                                    title: book.title,
                                                });
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    {error ? (
                                        <div className="text-xs text-red-600 mt-1">
                                            {error}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.type === 'rating') {
                    return {
                        id: cd.id ?? 'rating',
                        header: cd.header,
                        meta: {
                            headerClassName: 'w-28 text-right',
                            cellClassName: 'w-28 text-right',
                        },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const book: BookRow = info.row.original;
                            const v = book.rating as number | undefined;
                            return typeof v === 'number' ? (
                                <div className="flex items-center justify-end gap-2">
                                    <Stars value={v} />
                                    <span className="text-xs text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                                        {Number.isInteger(v)
                                            ? String(v)
                                            : v.toFixed(1)}
                                    </span>
                                </div>
                            ) : (
                                '—'
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.accessor === 'title') {
                    return {
                        id: cd.accessor ? String(cd.accessor) : cd.id,
                        accessorKey: cd.accessor as string,
                        header: cd.header,
                        meta: {
                            headerClassName: 'w-1/3',
                            cellClassName: 'text-left md:text-center',
                        },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const row = info.row.original as BookRow;
                            return (
                                <div className="text-left md:text-center">
                                    <Link
                                        href={`/books/${row.id}`}
                                        className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {String(info.getValue() as string)}
                                    </Link>
                                </div>
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.id === 'authors') {
                    return {
                        id: 'authors',
                        header: cd.header,
                        meta: {
                            headerClassName: 'w-1/3',
                            cellClassName:
                                'truncate max-w-[20rem] text-left md:text-center',
                        },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const row = info.row.original as BookRow;
                            if (!row.authors) return 'Unknown';
                            type AuthorLink = {
                                author?: { id?: number; name?: string };
                                id?: number;
                                name?: string;
                            };
                            const parts = (row.authors as AuthorLink[]).map(
                                (a, idx) => {
                                    const authorId = a?.author?.id ?? a?.id;
                                    const name =
                                        a?.author?.name ?? a?.name ?? 'Unknown';
                                    const key = `${authorId ?? name}-${idx}`;
                                    return authorId ? (
                                        <span key={key}>
                                            <Link
                                                href={`/authors/${authorId}`}
                                                className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {name}
                                            </Link>
                                        </span>
                                    ) : (
                                        <span key={key}>{name}</span>
                                    );
                                },
                            );
                            const interleaved: React.ReactNode[] = [];
                            parts.forEach((p, i) => {
                                if (i > 0)
                                    interleaved.push(
                                        <span key={`sep-${i}`}>, </span>,
                                    );
                                interleaved.push(p);
                            });
                            return (
                                <div className="truncate max-w-[20rem] text-left md:text-center">
                                    {interleaved}
                                </div>
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.accessor === 'status') {
                    return {
                        id: cd.accessor ? String(cd.accessor) : cd.id,
                        accessorKey: cd.accessor as string,
                        header: cd.header,
                        meta: {
                            headerClassName: 'w-28 text-center',
                            cellClassName: 'w-28 text-center',
                        },
                        cell: (info: CellContext<BookRow, unknown>) => (
                            <div className="flex justify-center">
                                <StatusBadge
                                    status={
                                        (info.row.original as BookRow).status
                                    }
                                />
                            </div>
                        ),
                    } as ColumnDef<BookRow, unknown>;
                }

                return {
                    id: cd.accessor ? String(cd.accessor) : cd.id,
                    accessorKey: cd.accessor as string,
                    header: cd.header,
                    cell: (info: CellContext<BookRow, unknown>) =>
                        info.getValue() as string,
                } as ColumnDef<BookRow, unknown>;
            })
            .filter(Boolean)
            .map((c, i) => ({
                ...(c as ColumnDef<BookRow, unknown>),
                id: (c as ColumnDef<BookRow, unknown>).id ?? String(i),
            })) as ColumnDef<BookRow, unknown>[];
        return cols;
    }, [isAdmin, setDialog]);

    return (
        <div>
            {isAdmin && (
                <div className="flex justify-end mb-4">
                    <button
                        className="btn btn--primary"
                        onClick={() => setDialog({ mode: 'create' })}
                    >
                        + New Book
                    </button>
                </div>
            )}
            <Table
                data={rows}
                columns={columns}
                className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                caption="Books list"
                onRowClick={(row) => {
                    if (typeof window !== 'undefined') {
                        window.location.href = `/books/${row.id}`;
                    }
                }}
                getRowAriaLabel={(row) => `Open details for ${row.title}`}
            />

            {/* Create / Edit dialog */}
            {(dialog.mode === 'create' || dialog.mode === 'edit') && (
                <BookForm
                    mode={dialog.mode}
                    initialValues={
                        dialog.mode === 'edit' ? dialog.book : undefined
                    }
                    onSubmit={async (
                        data: CreateBookRequest & { rating?: number | null },
                    ) => {
                        const { rating, ...bookData } = data;
                        if (dialog.mode === 'create') {
                            createBook(bookData);
                        } else {
                            updateBook(
                                (dialog as { mode: 'edit'; book: BookRow }).book
                                    .id as number,
                                { ...bookData, rating },
                            );
                        }
                        setDialog({ mode: 'closed' });
                    }}
                    onCancel={() => setDialog({ mode: 'closed' })}
                />
            )}

            {/* Delete confirmation dialog */}
            {dialog.mode === 'delete' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm deletion"
                >
                    <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
                        <h2 className="text-lg font-semibold mb-2">
                            Delete Book
                        </h2>
                        <p className="text-sm mb-6">
                            Are you sure you want to delete{' '}
                            <strong>{dialog.title}</strong>? This cannot be
                            undone.
                        </p>
                        <div className="form-actions">
                            <button
                                className="btn bg-red-600 text-white hover:bg-red-700"
                                onClick={() => {
                                    deleteBook(
                                        (
                                            dialog as {
                                                mode: 'delete';
                                                id: number;
                                                title: string;
                                            }
                                        ).id,
                                    );
                                    setDialog({ mode: 'closed' });
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className="btn"
                                onClick={() => setDialog({ mode: 'closed' })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
