import React from 'react';
import { ItemStatus } from '@bryandebaun/mcp-client';

export default function StatusBadge({ status }: { status?: ItemStatus | string | undefined }) {
    const s = status as ItemStatus | undefined;
    const classes = s === ItemStatus.COMPLETED
        ? 'bg-green-100 text-green-800'
        : s === ItemStatus.IN_PROGRESS
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800';

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
            {String(status ?? 'UNKNOWN')}
        </span>
    );
}
