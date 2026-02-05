"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

export type DataTableProps<T> = {
    data: T[];
    columns: ColumnDef<T, unknown>[];
    className?: string;
    caption?: string;
};

export default function DataTable<T>({ data, columns, className, caption }: DataTableProps<T>) {
    // Ensure stable references are passed into TanStack Table to avoid memoization pitfalls
    const stableData = React.useMemo(() => data, [data]);
    const stableColumns = React.useMemo(() => columns, [columns]);

    // Create the table instance using stable inputs. Do not memoize the table itself —
    // it returns live functions that must not be memoized.
    // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable returns live functions; this is an expected TanStack pattern
    const table = useReactTable({ data: stableData, columns: stableColumns, getCoreRowModel: getCoreRowModel() });

    return (
        <div className={className}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                <thead className="bg-gray-50 dark:bg-gray-800">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((h) => (
                                <th
                                    key={h.id}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                                >
                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
