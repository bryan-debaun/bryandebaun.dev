"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import Table from "./Table";
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
                    cell: (info: CellContext<BookRow, unknown>) => {
                        const book: BookRow = info.row.original;
                        return (
                            <div className="flex gap-2">
                                <button
                                    className="rounded bg-blue-600 px-3 py-1 text-white text-sm hover:bg-blue-700"
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
                                    Toggle Status
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
                    cell: (info: CellContext<BookRow, unknown>) => {
                        const book: BookRow = info.row.original;
                        const v = book.averageRating as number | undefined;
                        return typeof v === "number" ? v.toFixed(1) : "—";
                    },
                } as ColumnDef<BookRow, unknown>;
            }

            if (cd.id === "authors") {
                return {
                    id: "authors",
                    header: cd.header,
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

            // default text accessor (must provide accessorKey)
            return {
                id: cd.accessor ? String(cd.accessor) : cd.id,
                accessorKey: cd.accessor as string,
                header: cd.header,
                cell: (info: CellContext<BookRow, unknown>) => info.getValue() as string,
            } as ColumnDef<BookRow, unknown>;
        });
    }, []);

    return <Table data={data} columns={columns} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700" caption="Books list" />;
}
