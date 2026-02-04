"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

type ColumnMeta = {
    headerClassName?: string;
    cellClassName?: string;
};

function headerClassNameFrom(columnDef: unknown) {
    return (columnDef as { meta?: ColumnMeta })?.meta?.headerClassName ?? '';
}
function cellClassNameFrom(columnDef: unknown) {
    return (columnDef as { meta?: ColumnMeta })?.meta?.cellClassName ?? '';
}

export type TableProps<T> = {
    data: T[];
    columns: ColumnDef<T, unknown>[];
    className?: string;
    caption?: string;
    // Optional: called when a row is activated via click or keyboard
    onRowClick?: (row: T) => void;
    // Optional: provide an accessible label for each row
    getRowAriaLabel?: (row: T) => string;
};

export default function Table<T>({ data, columns, className, caption, onRowClick, getRowAriaLabel }: TableProps<T>) {
    // Ensure stable references are passed into TanStack Table to avoid memoization pitfalls
    const stableData = React.useMemo(() => data, [data]);
    const stableColumns = React.useMemo(() => columns, [columns]);

    // Create the table instance using stable inputs. Do not memoize the table itself —
    // it returns live functions that must not be memoized.
    // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable returns live functions; this is an expected TanStack pattern
    const table = useReactTable({ data: stableData, columns: stableColumns, getCoreRowModel: getCoreRowModel() });

    return (
        <div className={className}>
            <table className="min-w-full table-fixed">
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                <thead className="bg-[var(--color-norwegian-400)] dark:bg-[var(--color-norwegian-800)]">
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((h) => (
                                <th
                                    key={h.id}
                                    className={`${'px-4 py-3 text-center text-xs font-medium text-white dark:text-[var(--color-norwegian-100)]'} ${headerClassNameFrom(h.column.columnDef) ?? ''}`}
                                >
                                    {flexRender(h.column.columnDef.header, h.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="bg-[var(--background)] dark:bg-[var(--color-bg-dark)] divide-y" style={{ borderColor: 'var(--tw-prose-td-borders)' }}>
                    {table.getRowModel().rows.map((row) => {
                        const rowData = row.original as T;
                        const clickable = typeof onRowClick === 'function';
                        const baseClasses = 'bg-[var(--color-norwegian-50)] dark:bg-[var(--background)]';
                        const hoverClasses = clickable
                            ? 'hover:bg-[var(--color-norwegian-100)] dark:hover:bg-[var(--color-norwegian-700)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]'
                            : 'hover:bg-[var(--color-norwegian-100)] dark:hover:bg-[var(--color-norwegian-700)]';
                        return (
                            <tr
                                key={row.id}
                                className={`${baseClasses} ${hoverClasses}`}
                                {...(clickable
                                    ? {
                                        role: 'link',
                                        tabIndex: 0,
                                        onClick: () => onRowClick && onRowClick(rowData),
                                        onKeyDown: (e: React.KeyboardEvent) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onRowClick && onRowClick(rowData);
                                            }
                                        },
                                        'aria-label': getRowAriaLabel ? getRowAriaLabel(rowData) : undefined,
                                    }
                                    : {})}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className={`${'px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)]'} ${cellClassNameFrom(cell.column.columnDef) ?? ''}`}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
