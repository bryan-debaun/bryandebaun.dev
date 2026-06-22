'use client';

import { useMemo, useState } from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import Table from '@/components/Table';
import { useAdminUsers } from '@/lib/hooks/useAdminUsers';
import { EMAIL_REGEX } from '@/lib/contact';
import type { AdminUserStatus, AdminUserView } from '@/lib/admin-users';

type Props = {
    /** Server-fetched initial users (optional; the hook can also fetch). */
    initialUsers?: AdminUserView[];
};

function StatusPill({ status }: { status: AdminUserStatus }) {
    const classes =
        status === 'active'
            ? 'bg-gradient-to-b from-[var(--color-norwegian-500)] to-[var(--color-norwegian-400)] text-[var(--color-white)] border border-[rgba(0,0,0,0.06)] shadow-sm'
            : status === 'invited'
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

function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export default function UsersAdmin({ initialUsers }: Props) {
    const { users, isError, error, inviteMutation, revokeMutation } =
        useAdminUsers(initialUsers);

    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setInviteLink(null);
        setNotice(null);

        const value = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(value)) {
            setFormError('A valid email address is required.');
            return;
        }

        inviteMutation.mutate(value, {
            onSuccess: (result) => {
                setEmail('');
                if (result.emailSent) {
                    setNotice(`Invitation emailed to ${result.email}.`);
                } else {
                    setNotice(
                        `User ${result.email} invited, but the email could not be sent. Share the invite link below.`,
                    );
                    setInviteLink(result.inviteUrl);
                }
            },
            onError: (err) => {
                setFormError((err as Error).message);
            },
        });
    };

    const handleRevoke = (user: AdminUserView) => {
        if (
            !window.confirm(
                `Revoke the pending invite for ${user.email ?? user.id}? This cannot be undone.`,
            )
        ) {
            return;
        }
        setNotice(null);
        setFormError(null);
        revokeMutation.mutate(user.id, {
            onError: (err) => {
                setFormError((err as Error).message);
            },
        });
    };

    const columns = useMemo<ColumnDef<AdminUserView, unknown>[]>(
        () => [
            {
                id: 'email',
                header: 'Email',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<AdminUserView, unknown>) =>
                    info.row.original.email ?? '—',
            },
            {
                id: 'role',
                header: 'Role',
                cell: (info: CellContext<AdminUserView, unknown>) =>
                    info.row.original.role ?? '—',
            },
            {
                id: 'status',
                header: 'Status',
                cell: (info: CellContext<AdminUserView, unknown>) => (
                    <StatusPill status={info.row.original.status} />
                ),
            },
            {
                id: 'createdAt',
                header: 'Created',
                cell: (info: CellContext<AdminUserView, unknown>) =>
                    formatDate(info.row.original.createdAt),
            },
            {
                id: 'lastSignInAt',
                header: 'Last sign-in',
                cell: (info: CellContext<AdminUserView, unknown>) =>
                    formatDate(info.row.original.lastSignInAt),
            },
            {
                id: 'actions',
                header: 'Actions',
                meta: {
                    headerClassName: 'w-28 text-right',
                    cellClassName: 'w-28 text-right',
                },
                cell: (info: CellContext<AdminUserView, unknown>) => {
                    const user = info.row.original;
                    if (user.status === 'active') {
                        return (
                            <span className="text-xs text-[var(--color-norwegian-500)]">
                                —
                            </span>
                        );
                    }
                    return (
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-[var(--color-white)] cursor-pointer bg-gradient-to-b from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]"
                            onClick={() => handleRevoke(user)}
                            disabled={revokeMutation.isPending}
                        >
                            Revoke
                        </button>
                    );
                },
            },
        ],
        // handleRevoke is stable enough for this UI; revoke pending state drives disabled
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [revokeMutation.isPending],
    );

    return (
        <div>
            <form
                onSubmit={handleInvite}
                className="mb-6 flex flex-wrap items-end gap-3"
                aria-label="Invite user"
            >
                <div className="flex flex-col">
                    <label htmlFor="invite-email" className="text-sm mb-1">
                        Invite user by email
                    </label>
                    <input
                        id="invite-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="person@example.com"
                        className="rounded-md border border-[var(--tw-prose-td-borders)] bg-[var(--background)] px-3 py-2 text-sm"
                        autoComplete="off"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={inviteMutation.isPending}
                >
                    {inviteMutation.isPending ? 'Inviting…' : 'Invite'}
                </button>
            </form>

            {formError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {formError}
                </p>
            ) : null}
            {notice ? (
                <p className="mb-4 text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    {notice}
                </p>
            ) : null}
            {inviteLink ? (
                <p className="mb-4 text-sm break-all">
                    Invite link:{' '}
                    <a href={inviteLink} className="underline">
                        {inviteLink}
                    </a>
                </p>
            ) : null}
            {isError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error?.message ?? 'Failed to load users.'}
                </p>
            ) : null}

            <Table
                data={users}
                columns={columns}
                className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                caption="Admin users list"
            />
        </div>
    );
}
