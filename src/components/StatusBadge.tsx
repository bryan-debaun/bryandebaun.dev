import React from 'react';
import { ItemStatus } from '@bryandebaun/mcp-client';

export default function StatusBadge({ status }: { status?: ItemStatus | string | undefined }) {
    const s = status as ItemStatus | undefined;
    const classes = s === ItemStatus.COMPLETED
        ? 'bg-[var(--color-norwegian-400)] text-[var(--color-white)]'
        : s === ItemStatus.IN_PROGRESS
            ? 'bg-[var(--color-norwegian-200)] text-[var(--color-norwegian-700)]'
            : 'bg-[var(--color-norwegian-50)] text-[var(--color-norwegian-700)] dark:bg-[var(--color-norwegian-100-dark)] dark:text-[var(--color-norwegian-300-dark)]';

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
            {String(status ?? 'UNKNOWN')}
        </span>
    );
}
