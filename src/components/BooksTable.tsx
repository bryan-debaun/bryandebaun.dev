"use client";

import { useMemo, useState } from "react";
import Link from 'next/link';
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import Table from "./Table";
import Stars from "./Stars";
import StatusBadge from "./StatusBadge";
import { bookColumnDescriptors, generateBookRows, type BookRow } from '../lib/books';
import { BookWithAuthors, RatingWithDetails } from "@bryandebaun/mcp-client";

type Props = {
    books: BookWithAuthors[];
    ratings: RatingWithDetails[];
    // When true, show admin-only actions (toggle status). Default false.
    isAdmin?: boolean;
};

export default function BooksTable({ books, ratings, isAdmin = false }: Props) {
    const booksData = useMemo(() => books ?? [], [books]);
    const ratingsData = useMemo(() => ratings ?? [], [ratings]);

    const derived = useMemo(() => generateBookRows(booksData, ratingsData) ?? [], [booksData, ratingsData]);
    const [optimistic, setOptimistic] = useState<Map<number, BookRow>>(() => new Map());

    // Derive displayed rows directly from server-derived data with an optimistic overlay.
    // This avoids imperative setState() calls inside effects while keeping UI responsive.
    const displayed = useMemo(() => derived.map(d => optimistic.get(d.id as number) ?? d), [derived, optimistic]);

    const columns = useMemo<ColumnDef<BookRow, unknown>[]>(() => {
        // Build columns but filter out admin-only columns when not isAdmin
        const cols = bookColumnDescriptors
            .map((cd) => {
                if (cd.type === "actions") {
                    if (!isAdmin) return null;
                    return {
                        id: cd.id ?? "actions",
                        header: cd.header,
                        meta: { headerClassName: 'w-24 text-right', cellClassName: 'w-24 text-right' },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const book: BookRow = info.row.original;
                            return (
                                <div className="flex justify-end">
                                    <button
                                        className={`inline-flex items-center justify-center rounded-md p-2 text-xs text-[var(--color-white)] bg-gradient-to-b from-[var(--btn-accent-strong)] to-[var(--btn-accent)] hover:from-[var(--btn-accent)] hover:to-[var(--btn-accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]`}
                                        aria-label={`Toggle status for ${book.title}`}
                                        title="Toggle status"
                                        onClick={async () => {
                                            const newStatus = book.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
                                            try {
                                                const res = await fetch(`/api/admin/books/${book.id}`, {
                                                    method: "PATCH",
                                                    headers: { "content-type": "application/json" },
                                                    body: JSON.stringify({ status: newStatus }),
                                                });
                                                if (res.ok) {
                                                    const updated = await res.json();
                                                    setOptimistic((m) => {
                                                        const copy = new Map(m);
                                                        copy.set(updated.id, updated as BookRow);
                                                        return copy;
                                                    });
                                                } else {
                                                    console.error("Failed to update book", await res.text());
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                            <path d="M10 5a1 1 0 00-1 1v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V6a1 1 0 00-1-1z" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.type === "rating") {
                    return {
                        id: cd.id ?? "rating",
                        header: cd.header,
                        meta: { headerClassName: 'w-28 text-right', cellClassName: 'w-28 text-right' },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const book: BookRow = info.row.original;
                            const v = book.averageRating as number | undefined;
                            return typeof v === "number" ? (
                                <div className="flex items-center justify-end gap-2">
                                    <Stars value={v} />
                                    <span className="text-xs text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300-dark)]">{v.toFixed(1)}</span>
                                </div>
                            ) : "—";
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.accessor === "title") {
                    return {
                        id: cd.accessor ? String(cd.accessor) : cd.id,
                        accessorKey: cd.accessor as string,
                        header: cd.header,
                        meta: { headerClassName: 'w-1/3', cellClassName: 'text-center' },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const row = info.row.original as BookRow;
                            return (
                                <div className="text-center">
                                    <Link href={`/books/${row.id}`} className="text-[var(--color-norwegian-600)] hover:underline">
                                        {String(info.getValue() as string)}
                                    </Link>
                                </div>
                            );
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.id === "authors") {
                    return {
                        id: "authors",
                        header: cd.header,
                        meta: { headerClassName: 'w-1/3', cellClassName: 'truncate max-w-[20rem] text-center' },
                        cell: (info: CellContext<BookRow, unknown>) => {
                            const row = info.row.original as BookRow;
                            if (!row.authors) return "Unknown";
                            type AuthorLink = { author?: { id?: number; name?: string }; id?: number; name?: string };
                            const parts = (row.authors as AuthorLink[])
                                .map((a, idx) => {
                                    const authorId = a?.author?.id ?? a?.id;
                                    const name = a?.author?.name ?? a?.name ?? 'Unknown';
                                    const key = `${authorId ?? name}-${idx}`;
                                    return authorId ? (
                                        <span key={key}>
                                            <Link href={`/authors/${authorId}`} className="text-[var(--color-norwegian-600)] hover:underline">
                                                {name}
                                            </Link>
                                        </span>
                                    ) : (
                                        <span key={key}>{name}</span>
                                    );
                                });
                            // join with commas
                            const interleaved: React.ReactNode[] = [];
                            parts.forEach((p, i) => {
                                if (i > 0) interleaved.push(<span key={`sep-${i}`}>, </span>);
                                interleaved.push(p);
                            });
                            return <div className="truncate max-w-[20rem] text-center">{interleaved}</div>;
                        },
                    } as ColumnDef<BookRow, unknown>;
                }

                if (cd.accessor === "status") {
                    return {
                        id: cd.accessor ? String(cd.accessor) : cd.id,
                        accessorKey: cd.accessor as string,
                        header: cd.header,
                        meta: { headerClassName: 'w-28 text-center', cellClassName: 'w-28 text-center' },
                        cell: (info: CellContext<BookRow, unknown>) => (
                            <div className="flex justify-center"><StatusBadge status={(info.row.original as BookRow).status} /></div>
                        ),
                    } as ColumnDef<BookRow, unknown>;
                }

                // default text accessor (must provide accessorKey)
                return {
                    id: cd.accessor ? String(cd.accessor) : cd.id,
                    accessorKey: cd.accessor as string,
                    header: cd.header,
                    cell: (info: CellContext<BookRow, unknown>) => info.getValue() as string,
                } as ColumnDef<BookRow, unknown>;
            })
            // filter out any nulls and ensure every column has an id (required when header is a node)
            .filter(Boolean)
            .map((c, i) => ({ ...(c as ColumnDef<BookRow, unknown>), id: (c as ColumnDef<BookRow, unknown>).id ?? String(i) })) as ColumnDef<BookRow, unknown>[];
        return cols;
    }, [isAdmin]);


    return <Table data={displayed} columns={columns} className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]" caption="Books list" />;
}
