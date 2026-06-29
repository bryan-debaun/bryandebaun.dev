'use client';

import { useMemo } from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { BetSource, BetStatus } from '@bryandebaun/mcp-client';
import Table from '@/components/Table';
import {
    clvPercent,
    formatAmericanOdds,
    formatBetDate,
    formatClvPercent,
    formatPercent,
    formatRecord,
    formatRoi,
    formatUnits,
    marketLabel,
} from '@/lib/bets';
import type {
    PublicBet,
    PublicBetAnalytics,
    PublicBetMetrics,
} from '@/lib/services/public-bets';

type Props = {
    bets: PublicBet[];
    analytics: PublicBetAnalytics | null;
};

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

/** AI metadata cell: model + an expandable rationale for AI-assisted picks. */
function AiMetaCell({ bet }: { bet: PublicBet }) {
    if (bet.source !== BetSource.AI_ASSISTED) {
        return <span className="text-[var(--color-norwegian-400)]">—</span>;
    }
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium">{bet.aiModel ?? 'model ?'}</span>
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

/**
 * One source column in the scoreboard. Leads with CLV (the core experiment
 * readout) and shows only rate-style metrics — NEVER profit, staked or any $.
 */
function ScoreboardColumn({
    label,
    accent,
    metrics,
}: {
    label: string;
    accent: string;
    metrics: PublicBetMetrics;
}) {
    const rows: { label: string; value: string; emphasize?: boolean }[] = [
        {
            label: 'CLV (avg)',
            value: formatClvPercent(metrics.avgClvPct),
            emphasize: true,
        },
        { label: 'ROI', value: formatRoi(metrics.roi) },
        { label: 'Hit rate', value: formatPercent(metrics.hitRate) },
        { label: 'Units', value: formatUnits(metrics.units) },
        { label: 'Record (W-L-P)', value: formatRecord(metrics) },
        { label: 'Count', value: String(metrics.count) },
    ];

    return (
        <div className="rounded-lg border border-[var(--tw-prose-td-borders)] bg-[var(--background)] p-4 shadow-sm">
            <p className={`mb-3 text-sm font-semibold ${accent}`}>{label}</p>
            <dl className="divide-y divide-[var(--tw-prose-td-borders)]">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className={`flex items-center justify-between py-1.5 ${
                            row.emphasize
                                ? 'rounded-md bg-[var(--color-norwegian-50)] dark:bg-[var(--color-norwegian-800)] px-2'
                                : ''
                        }`}
                    >
                        <dt className="text-xs uppercase tracking-wide text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                            {row.label}
                        </dt>
                        <dd
                            className={`tabular-nums ${
                                row.emphasize
                                    ? 'text-base font-semibold'
                                    : 'text-sm'
                            }`}
                        >
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function Scoreboard({ analytics }: { analytics: PublicBetAnalytics }) {
    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ScoreboardColumn
                    label="Intuition"
                    accent="text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-400)]"
                    metrics={analytics.bySource.INTUITION}
                />
                <ScoreboardColumn
                    label="AI-assisted"
                    accent="text-[var(--color-fjord-600)] dark:text-[var(--color-fjord-500)]"
                    metrics={analytics.bySource.AI_ASSISTED}
                />
            </div>
            <p className="mt-3 text-xs text-[var(--color-norwegian-500)]">
                {analytics.overall.count} picks · {analytics.overall.pending}{' '}
                pending · {analytics.overall.settled} settled
            </p>
        </div>
    );
}

export default function PublicBets({ bets, analytics }: Props) {
    const columns = useMemo<ColumnDef<PublicBet, unknown>[]>(
        () => [
            {
                id: 'placedAt',
                header: 'Placed',
                cell: (info: CellContext<PublicBet, unknown>) =>
                    formatBetDate(info.row.original.placedAt),
            },
            {
                id: 'sport',
                header: 'Sport',
                cell: (info: CellContext<PublicBet, unknown>) =>
                    info.row.original.sport,
            },
            {
                id: 'event',
                header: 'Event',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<PublicBet, unknown>) => {
                    const v = info.row.original.event;
                    return (
                        <span
                            className="block max-w-[12rem] truncate"
                            title={v}
                        >
                            {v}
                        </span>
                    );
                },
            },
            {
                id: 'market',
                header: 'Market',
                cell: (info: CellContext<PublicBet, unknown>) =>
                    marketLabel(info.row.original.market),
            },
            {
                id: 'selection',
                header: 'Selection',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<PublicBet, unknown>) => {
                    const b = info.row.original;
                    const v =
                        b.line != null
                            ? `${b.selection} (${b.line > 0 ? '+' : ''}${b.line})`
                            : b.selection;
                    return (
                        <span
                            className="block max-w-[18rem] truncate"
                            title={v}
                        >
                            {v}
                        </span>
                    );
                },
            },
            {
                id: 'oddsAmerican',
                header: 'Odds',
                cell: (info: CellContext<PublicBet, unknown>) =>
                    formatAmericanOdds(info.row.original.oddsAmerican),
            },
            {
                id: 'clv',
                header: 'CLV',
                cell: (info: CellContext<PublicBet, unknown>) =>
                    formatClvPercent(clvPercent(info.row.original)),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (info: CellContext<PublicBet, unknown>) => (
                    <StatusPill status={info.row.original.status} />
                ),
            },
            {
                id: 'source',
                header: 'Source',
                cell: (info: CellContext<PublicBet, unknown>) => (
                    <SourcePill source={info.row.original.source} />
                ),
            },
            {
                id: 'ai',
                header: 'AI',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<PublicBet, unknown>) => (
                    <AiMetaCell bet={info.row.original} />
                ),
            },
        ],
        [],
    );

    return (
        <section>
            <p className="mb-6 text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                An experiment pitting my gut picks against AI-assisted ones —
                stakes hidden; here&rsquo;s the public scoreboard.
            </p>

            {analytics ? <Scoreboard analytics={analytics} /> : null}

            {bets.length > 0 ? (
                <Table
                    data={bets}
                    columns={columns}
                    className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                    caption="Public bet picks"
                />
            ) : (
                <p className="text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    No picks to show just yet — check back soon.
                </p>
            )}
        </section>
    );
}
