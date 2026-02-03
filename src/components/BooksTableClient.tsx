"use client";

import React, { useCallback, useMemo, useState } from "react";
import type { BookWithAuthors } from "@bryandebaun/mcp-client";
import { ItemStatus } from "@bryandebaun/mcp-client";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./DataTable";

type Props = {
    initialData: (BookWithAuthors & { averageRating?: number })[];
};

export default function BooksTableClient({ initialData }: Props) {
    const [data, setData] = useState<(BookWithAuthors & { averageRating?: number })[]>(initialData ?? []);

    const onToggleStatus = useCallback(async (book: BookWithAuthors) => {
        const newStatus = (book.status === ItemStatus.COMPLETED ? ItemStatus.NOT_STARTED : ItemStatus.COMPLETED);
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
    }, []);

    const columns = useMemo<ColumnDef<(BookWithAuthors & { averageRating?: number })>[]>(
        () => [
            {
                accessorKey: "title",
                header: () => "Title",
                cell: (info) => info.getValue(),
            },
            {
                id: "authors",
                header: () => "Author(s)",
                cell: (info) => {
                    const row = info.row.original;
                    if (!row.authors) return "Unknown";
                    type AuthorLink = { author?: { name?: string }; name?: string };
                    const names = (row.authors as AuthorLink[])
                        .map((a) => a?.author?.name ?? a?.name)
                        .filter(Boolean);
                    return names.length ? names.join(", ") : "Unknown";
                },
            },
            {
                id: "rating",
                header: () => "Rating",
                cell: (info) => {
                    const book = info.row.original;
                    const v = book.averageRating as number | undefined;
                    return typeof v === "number" ? v.toFixed(1) : "—";
                },
            },
            {
                accessorKey: "status",
                header: () => "Status",
                cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-200">{String(info.getValue())}</span>,
            },
            {
                id: "actions",
                header: () => "",
                cell: (info) => {
                    const book = info.row.original;
                    return (
                        <div className="flex gap-2">
                            <button
                                className="rounded bg-blue-600 px-3 py-1 text-white text-sm hover:bg-blue-700"
                                onClick={() => onToggleStatus(book)}
                            >
                                Toggle Status
                            </button>
                        </div>
                    );
                },
            },
        ],
        [onToggleStatus]
    );

    return <DataTable data={data} columns={columns} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700" caption="Books list" />;
}
