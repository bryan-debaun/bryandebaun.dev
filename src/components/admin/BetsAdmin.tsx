'use client';

import { useMemo, useState } from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import {
    type Bet,
    type CreateBetRequest,
    type SettleBetRequest,
    BetMarket,
    BetSource,
    BetStatus,
} from '@bryandebaun/mcp-client';
import Table from '@/components/Table';
import BetForm from '@/components/admin/BetForm';
import BetAnalyticsPanel from '@/components/admin/BetAnalyticsPanel';
import { useAdminBets } from '@/lib/hooks/useAdminBets';
import {
    type BetFilters,
    clvPercent,
    formatAmericanOdds,
    formatBetDate,
    formatClvPercent,
    formatCurrency,
} from '@/lib/bets';

const SETTLE_OPTIONS: SettleBetRequest['status'][] = [
    'WON',
    'LOST',
    'PUSH',
    'VOID',
];

function StatusPill({ status }: { status: BetStatus }) {
    const tone: Record<BetStatus, string> = {
        [BetStatus.PENDING]:
            'bg-[var(--color-norwegian-100)] text-[var(--color-norwegian-700)] dark:bg-[var(--color-norwegian-100-dark)] dark:text-[var(--color-norwegian-300-dark)]',
        [BetStatus.WON]: 'bg-green-100 text-green-800',
        [BetStatus.LOST]: 'bg-red-100 text-red-800',
        [BetStatus.PUSH]: 'bg-amber-100 text-amber-800',
        [BetStatus.VOID]: 'bg-gray-100 text-gray-700',
    };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone[status]}`}
        >
            {status}
        </span>
    );
}

function SourcePill({ source }: { source: BetSource }) {
    const isAi = source === BetSource.AI_ASSISTED;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isAi
                    ? 'bg-[var(--color-fjord-500)]/15 text-[var(--color-fjord-600)] dark:text-[var(--color-fjord-500)]'
                    : 'bg-[var(--color-norwegian-500)]/15 text-[var(--color-norwegian-700)] dark:text-[var(--color-norwegian-300)]'
            }`}
        >
            {isAi ? 'AI' : 'Intuition'}
        </span>
    );
}

/** AI metadata cell: model + EV with an expandable rationale. */
function AiMetaCell({ bet }: { bet: Bet }) {
    if (bet.source !== BetSource.AI_ASSISTED) {
        return <span className="text-[var(--color-norwegian-400)]">—</span>;
    }
    const evText =
        bet.aiEV != null ? `EV ${bet.aiEV > 0 ? '+' : ''}${bet.aiEV}` : null;
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium">{bet.aiModel ?? 'model ?'}</span>
            {evText ? (
                <span className="text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                    {evText}
                </span>
            ) : null}
            {bet.aiRationale ? (
                <details className="max-w-[16rem]">
                    <summary className="cursor-pointer text-[var(--color-fjord-600)]">
                        Rationale
                    </summary>
                    <p className="mt-1 whitespace-normal text-[var(--color-norwegian-700)] dark:text-[var(--color-norwegian-200)]">
                        {bet.aiRationale}
                    </p>
                </details>
            ) : null}
        </div>
    );
}

type Props = {
    /** Server-fetched initial bets (optional; the hook also fetches). */
    initialBets?: Bet[];
};

export default function BetsAdmin(_props: Props) {
    const [filters, setFilters] = useState<BetFilters>({});
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Bet | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const {
        bets,
        betsLoading,
        betsError,
        analytics,
        analyticsLoading,
        analyticsError,
        createMutation,
        updateMutation,
        settleMutation,
        deleteMutation,
    } = useAdminBets(filters);

    const setFilter = (key: keyof BetFilters, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value === '' ? undefined : value,
        }));
    };

    const handleCreate = async (data: CreateBetRequest) => {
        setActionError(null);
        if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, body: data });
        } else {
            await createMutation.mutateAsync(data);
        }
        setFormOpen(false);
        setEditing(null);
    };

    const handleSettle = (bet: Bet, status: SettleBetRequest['status']) => {
        setActionError(null);
        const payoutInput =
            status === 'WON'
                ? window.prompt(
                      'Payout for this win (leave blank to auto-compute):',
                      '',
                  )
                : null;
        const body: SettleBetRequest = { status };
        if (payoutInput && payoutInput.trim() !== '') {
            const payout = Number(payoutInput);
            if (!Number.isNaN(payout)) body.payout = payout;
        }
        settleMutation.mutate(
            { id: bet.id, body },
            { onError: (e) => setActionError((e as Error).message) },
        );
    };

    const handleDelete = (bet: Bet) => {
        if (
            !window.confirm(
                `Delete the bet "${bet.selection}" on ${bet.event}? This cannot be undone.`,
            )
        ) {
            return;
        }
        setActionError(null);
        deleteMutation.mutate(bet.id, {
            onError: (e) => setActionError((e as Error).message),
        });
    };

    const columns = useMemo<ColumnDef<Bet, unknown>[]>(
        () => [
            {
                id: 'placedAt',
                header: 'Placed',
                cell: (info: CellContext<Bet, unknown>) =>
                    formatBetDate(info.row.original.placedAt),
            },
            {
                id: 'sport',
                header: 'Sport',
                cell: (info: CellContext<Bet, unknown>) =>
                    info.row.original.sport,
            },
            {
                id: 'event',
                header: 'Event',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left whitespace-normal max-w-[14rem]',
                },
                cell: (info: CellContext<Bet, unknown>) =>
                    info.row.original.event,
            },
            {
                id: 'market',
                header: 'Market',
                cell: (info: CellContext<Bet, unknown>) =>
                    info.row.original.market,
            },
            {
                id: 'selection',
                header: 'Selection',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left whitespace-normal max-w-[12rem]',
                },
                cell: (info: CellContext<Bet, unknown>) => {
                    const b = info.row.original;
                    return b.line != null
                        ? `${b.selection} (${b.line > 0 ? '+' : ''}${b.line})`
                        : b.selection;
                },
            },
            {
                id: 'oddsAmerican',
                header: 'Odds',
                cell: (info: CellContext<Bet, unknown>) =>
                    formatAmericanOdds(info.row.original.oddsAmerican),
            },
            {
                id: 'stake',
                header: 'Stake',
                cell: (info: CellContext<Bet, unknown>) =>
                    formatCurrency(info.row.original.stake),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (info: CellContext<Bet, unknown>) => (
                    <StatusPill status={info.row.original.status} />
                ),
            },
            {
                id: 'source',
                header: 'Source',
                cell: (info: CellContext<Bet, unknown>) => (
                    <SourcePill source={info.row.original.source} />
                ),
            },
            {
                id: 'payout',
                header: 'Payout',
                cell: (info: CellContext<Bet, unknown>) =>
                    formatCurrency(info.row.original.payout),
            },
            {
                id: 'clv',
                header: 'CLV',
                cell: (info: CellContext<Bet, unknown>) =>
                    formatClvPercent(clvPercent(info.row.original)),
            },
            {
                id: 'ai',
                header: 'AI',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<Bet, unknown>) => (
                    <AiMetaCell bet={info.row.original} />
                ),
            },
            {
                id: 'actions',
                header: 'Actions',
                meta: {
                    headerClassName: 'text-right',
                    cellClassName: 'text-right',
                },
                cell: (info: CellContext<Bet, unknown>) => {
                    const bet = info.row.original;
                    const pending = bet.status === BetStatus.PENDING;
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    className="rounded px-2 py-0.5 text-xs underline cursor-pointer"
                                    onClick={() => {
                                        setEditing(bet);
                                        setFormOpen(true);
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="rounded px-2 py-0.5 text-xs text-red-600 underline cursor-pointer"
                                    onClick={() => handleDelete(bet)}
                                    disabled={deleteMutation.isPending}
                                >
                                    Delete
                                </button>
                            </div>
                            {pending ? (
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                    {SETTLE_OPTIONS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className="rounded border border-[var(--color-norwegian-300)] px-1.5 py-0.5 text-[10px] cursor-pointer hover:bg-[var(--color-norwegian-100)]"
                                            onClick={() => handleSettle(bet, s)}
                                            disabled={settleMutation.isPending}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    );
                },
            },
        ],
        // Mutations are stable; pending flags drive disabled state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [deleteMutation.isPending, settleMutation.isPending],
    );

    return (
        <div>
            {/* Filters drive both analytics and the log. */}
            <div className="mb-6 flex flex-wrap items-end gap-3">
                <div className="flex flex-col">
                    <label htmlFor="filter-source" className="text-sm mb-1">
                        Source
                    </label>
                    <select
                        id="filter-source"
                        className="form-input"
                        value={filters.source ?? ''}
                        onChange={(e) => setFilter('source', e.target.value)}
                    >
                        <option value="">All</option>
                        <option value={BetSource.INTUITION}>Intuition</option>
                        <option value={BetSource.AI_ASSISTED}>
                            AI-assisted
                        </option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="filter-status" className="text-sm mb-1">
                        Status
                    </label>
                    <select
                        id="filter-status"
                        className="form-input"
                        value={filters.status ?? ''}
                        onChange={(e) => setFilter('status', e.target.value)}
                    >
                        <option value="">All</option>
                        {Object.values(BetStatus).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="filter-market" className="text-sm mb-1">
                        Market
                    </label>
                    <select
                        id="filter-market"
                        className="form-input"
                        value={filters.market ?? ''}
                        onChange={(e) => setFilter('market', e.target.value)}
                    >
                        <option value="">All</option>
                        {Object.values(BetMarket).map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="filter-sport" className="text-sm mb-1">
                        Sport
                    </label>
                    <input
                        id="filter-sport"
                        type="text"
                        className="form-input"
                        placeholder="All"
                        value={filters.sport ?? ''}
                        onChange={(e) => setFilter('sport', e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="filter-from" className="text-sm mb-1">
                        From
                    </label>
                    <input
                        id="filter-from"
                        type="date"
                        className="form-input"
                        value={filters.from ?? ''}
                        onChange={(e) => setFilter('from', e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="filter-to" className="text-sm mb-1">
                        To
                    </label>
                    <input
                        id="filter-to"
                        type="date"
                        className="form-input"
                        value={filters.to ?? ''}
                        onChange={(e) => setFilter('to', e.target.value)}
                    />
                </div>
                <div className="ml-auto flex items-end">
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        Log bet
                    </button>
                </div>
            </div>

            {actionError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {actionError}
                </p>
            ) : null}

            {/* Intuition-vs-AI analytics leads the page. */}
            <BetAnalyticsPanel
                analytics={analytics}
                isLoading={analyticsLoading}
                error={analyticsError}
            />

            <h3 className="text-lg font-semibold mb-3">Bet log</h3>
            {betsError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {betsError.message || 'Failed to load bets.'}
                </p>
            ) : null}
            {betsLoading ? (
                <p className="mb-4 text-sm text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                    Loading bets…
                </p>
            ) : null}

            <Table
                data={bets}
                columns={columns}
                className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                caption="Admin bet log"
            />

            {formOpen ? (
                <BetForm
                    mode={editing ? 'edit' : 'create'}
                    initialValues={editing ?? undefined}
                    onSubmit={handleCreate}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditing(null);
                    }}
                />
            ) : null}
        </div>
    );
}
