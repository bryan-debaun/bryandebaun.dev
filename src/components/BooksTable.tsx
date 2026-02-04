"use client";

import { useMemo, useState, useEffect } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import Table from "./Table";
import Stars from "./Stars";
import StatusBadge from "./StatusBadge";
import { bookColumnDescriptors, generateBookRows, type BookRow } from '@/lib/books';
import { BookWithAuthors, RatingWithDetails } from "packages/mcp-client/src/api-client";

type Props = {
    books: BookWithAuthors[];
    ratings: RatingWithDetails[];
};

export default function BooksTable({ books, ratings }: Props) {
    const booksData = books ?? [];
    const ratingsData = ratings ?? [];
    const [data, setData] = useState<BookRow[]>(generateBookRows(booksData, ratingsData) ?? []);

    const columns = useMemo<ColumnDef<BookRow, unknown>[]>(() => {
        return bookColumnDescriptors.map((cd) => {
            if (cd.type === "actions") {
                return {
                    id: cd.id ?? "actions",
                    header: cd.header,
                    meta: { headerClassName: 'w-24 text-right', cellClassName: 'w-24 text-right' },
                    cell: (info: CellContext<BookRow, unknown>) => {
                        const book: BookRow = info.row.original;
                        return (
                            <div className="flex justify-end">
                                <button
                                    className="rounded-md bg-slate-700 px-2 py-1 text-white text-xs hover:bg-slate-600"
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
                                                setData((d) => d.map((bk) => (bk.id === updated.id ? updated : bk)));
                                            } else {
                                                console.error("Failed to update book", await res.text());
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                >
                                    Toggle
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
                                <span className="text-xs text-gray-500 dark:text-gray-400">{v.toFixed(1)}</span>
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
                    cell: (info: CellContext<BookRow, unknown>) => <div className="text-center">{info.getValue() as string}</div>,
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
                        type AuthorLink = { author?: { name?: string }; name?: string };
                        const names = (row.authors as AuthorLink[])
                            .map((a) => a?.author?.name ?? a?.name)
                            .filter(Boolean);
                        return names.length ? names.join(", ") : "Unknown";
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
        });
    }, []);

    // keep local table data in sync when server props change
    useEffect(() => {
        setData(generateBookRows(booksData, ratingsData) ?? []);
    }, [booksData, ratingsData]);

    return <Table data={data} columns={columns} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700" caption="Books list" />;
}
