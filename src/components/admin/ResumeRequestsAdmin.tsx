'use client';

import { useMemo, useState } from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import {
    type ResumeDownloadRequest,
    ResumeDownloadStatus,
} from '@bryandebaun/mcp-client';
import Table from '@/components/Table';
import { useAdminResumeRequests } from '@/lib/hooks/useAdminResumeRequests';

/** Status filter options shown in the toolbar. */
const STATUS_FILTERS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
    { value: ResumeDownloadStatus.Pending, label: 'Pending' },
    { value: ResumeDownloadStatus.Approved, label: 'Approved' },
    { value: ResumeDownloadStatus.Denied, label: 'Denied' },
    { value: ResumeDownloadStatus.Fulfilled, label: 'Fulfilled' },
    { value: ResumeDownloadStatus.Expired, label: 'Expired' },
];

function StatusPill({ status }: { status: ResumeDownloadStatus }) {
    const classes =
        status === ResumeDownloadStatus.Approved ||
        status === ResumeDownloadStatus.Fulfilled
            ? 'bg-gradient-to-b from-[var(--color-norwegian-500)] to-[var(--color-norwegian-400)] text-[var(--color-white)] border border-[rgba(0,0,0,0.06)] shadow-sm'
            : status === ResumeDownloadStatus.Pending
              ? 'bg-gradient-to-b from-[var(--color-norwegian-200)] to-[var(--color-norwegian-300)] text-[var(--color-norwegian-800)] border border-[rgba(0,0,0,0.03)]'
              : 'bg-[var(--color-norwegian-50)] text-[var(--color-norwegian-700)] dark:bg-[var(--color-norwegian-100-dark)] dark:text-[var(--color-norwegian-300-dark)]';
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}
        >
            {status}
        </span>
    );
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function ResumeRequestsAdmin() {
    const [status, setStatus] = useState<string>('all');
    const { requests, isError, error, approveMutation, denyMutation } =
        useAdminResumeRequests(
            status === 'all' ? undefined : (status as ResumeDownloadStatus),
        );
    const [actionError, setActionError] = useState<string | null>(null);

    const pending = approveMutation.isPending || denyMutation.isPending;

    const handleApprove = (request: ResumeDownloadRequest) => {
        setActionError(null);
        const note =
            window.prompt(
                `Approve the résumé request from ${request.userEmail}? Optional internal note:`,
                '',
            ) ?? undefined;
        // A null return (Cancel) aborts; an empty string proceeds with no note.
        if (note === undefined) return;
        approveMutation.mutate(
            { id: request.id, note: note.trim() || undefined },
            {
                onError: (err) => setActionError((err as Error).message),
            },
        );
    };

    const handleDeny = (request: ResumeDownloadRequest) => {
        setActionError(null);
        const note = window.prompt(
            `Deny the résumé request from ${request.userEmail}? Optional internal note:`,
            '',
        );
        if (note === null) return;
        denyMutation.mutate(
            { id: request.id, note: note.trim() || undefined },
            {
                onError: (err) => setActionError((err as Error).message),
            },
        );
    };

    const columns = useMemo<ColumnDef<ResumeDownloadRequest, unknown>[]>(
        () => [
            {
                id: 'email',
                header: 'Email',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) =>
                    info.row.original.userEmail,
            },
            {
                id: 'status',
                header: 'Status',
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) => (
                    <StatusPill status={info.row.original.status} />
                ),
            },
            {
                id: 'reason',
                header: 'Reason',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) =>
                    info.row.original.reason ?? '—',
            },
            {
                id: 'createdAt',
                header: 'Requested',
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) =>
                    formatDate(info.row.original.createdAt),
            },
            {
                id: 'expiresAt',
                header: 'Expires',
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) =>
                    formatDate(info.row.original.expiresAt),
            },
            {
                id: 'actions',
                header: 'Actions',
                meta: {
                    headerClassName: 'w-40 text-right',
                    cellClassName: 'w-40 text-right',
                },
                cell: (info: CellContext<ResumeDownloadRequest, unknown>) => {
                    const request = info.row.original;
                    if (request.status !== ResumeDownloadStatus.Pending) {
                        return (
                            <span className="text-xs text-[var(--color-norwegian-500)]">
                                —
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-[var(--color-white)] cursor-pointer bg-[var(--color-fjord-600)] hover:bg-[var(--color-fjord-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] disabled:opacity-50"
                                onClick={() => handleApprove(request)}
                                disabled={pending}
                            >
                                Approve
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-[var(--color-white)] cursor-pointer bg-gradient-to-b from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] disabled:opacity-50"
                                onClick={() => handleDeny(request)}
                                disabled={pending}
                            >
                                Deny
                            </button>
                        </span>
                    );
                },
            },
        ],
        // handleApprove/handleDeny are stable enough; pending drives disabled.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [pending],
    );

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-end gap-3">
                <div className="flex flex-col">
                    <label
                        htmlFor="resume-status-filter"
                        className="text-sm mb-1"
                    >
                        Filter by status
                    </label>
                    <select
                        id="resume-status-filter"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-md border border-[var(--tw-prose-td-borders)] bg-[var(--background)] px-3 py-2 text-sm"
                    >
                        {STATUS_FILTERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {actionError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {actionError}
                </p>
            ) : null}
            {isError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error?.message ?? 'Failed to load résumé requests.'}
                </p>
            ) : null}

            <Table
                data={requests}
                columns={columns}
                className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                caption="Résumé download requests"
            />
        </div>
    );
}
