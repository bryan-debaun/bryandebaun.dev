'use client';

import type { BetAnalyticsResponse, BetMetrics } from '@bryandebaun/mcp-client';
import {
    comparisonBarWidth,
    formatClvPercent,
    formatCurrency,
    formatPercent,
    formatProfit,
    formatRecord,
    formatRoi,
    formatUnits,
} from '@/lib/bets';

type Props = {
    analytics: BetAnalyticsResponse | null;
    isLoading: boolean;
    error: Error | null;
};

type Format = (value: number | null | undefined) => string;

/**
 * A single comparison row: a labelled metric with INTUITION on the left and
 * AI_ASSISTED on the right, plus simple CSS bars scaled against each other so
 * the larger value visibly dominates. No charting dependency — bars are plain
 * divs (see follow-up note in the dashboard for when a chart lib is warranted).
 */
function ComparisonRow({
    label,
    intuition,
    ai,
    format,
    emphasize = false,
}: {
    label: string;
    intuition: number | null | undefined;
    ai: number | null | undefined;
    format: Format;
    emphasize?: boolean;
}) {
    const intuitionWidth = comparisonBarWidth(intuition, ai);
    const aiWidth = comparisonBarWidth(ai, intuition);

    return (
        <div
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 ${
                emphasize
                    ? 'rounded-md bg-[var(--color-norwegian-50)] dark:bg-[var(--color-norwegian-800)] px-3'
                    : ''
            }`}
        >
            {/* INTUITION side (right-aligned, bar grows leftward) */}
            <div className="flex items-center justify-end gap-2">
                <span
                    className={`tabular-nums ${emphasize ? 'text-base font-semibold' : 'text-sm'}`}
                >
                    {format(intuition)}
                </span>
                <div className="hidden sm:block h-2 w-24 overflow-hidden rounded-full bg-[var(--color-norwegian-100)] dark:bg-[var(--color-norwegian-700)]">
                    <div
                        className="ml-auto h-full rounded-full bg-[var(--color-norwegian-500)]"
                        style={{ width: `${intuitionWidth}%` }}
                    />
                </div>
            </div>

            {/* Metric label */}
            <div
                className={`text-center text-xs uppercase tracking-wide text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)] ${
                    emphasize ? 'font-semibold' : ''
                }`}
            >
                {label}
            </div>

            {/* AI_ASSISTED side (left-aligned, bar grows rightward) */}
            <div className="flex items-center gap-2">
                <div className="hidden sm:block h-2 w-24 overflow-hidden rounded-full bg-[var(--color-norwegian-100)] dark:bg-[var(--color-norwegian-700)]">
                    <div
                        className="h-full rounded-full bg-[var(--color-fjord-500)]"
                        style={{ width: `${aiWidth}%` }}
                    />
                </div>
                <span
                    className={`tabular-nums ${emphasize ? 'text-base font-semibold' : 'text-sm'}`}
                >
                    {format(ai)}
                </span>
            </div>
        </div>
    );
}

function OverallStat({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex flex-col items-center rounded-md border border-[var(--tw-prose-td-borders)] bg-[var(--background)] px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                {label}
            </span>
            <span className="text-sm font-semibold tabular-nums">{value}</span>
        </div>
    );
}

export default function BetAnalyticsPanel({
    analytics,
    isLoading,
    error,
}: Props) {
    if (error) {
        return (
            <p role="alert" className="mb-4 text-sm text-red-600">
                {error.message || 'Failed to load analytics.'}
            </p>
        );
    }

    if (isLoading || !analytics) {
        return (
            <p className="mb-4 text-sm text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                {isLoading ? 'Loading analytics…' : 'No analytics yet.'}
            </p>
        );
    }

    const intuition: BetMetrics = analytics.bySource.INTUITION;
    const ai: BetMetrics = analytics.bySource.AI_ASSISTED;
    const overall: BetMetrics = analytics.overall;

    return (
        <div className="mb-8 rounded-lg border border-[var(--tw-prose-td-borders)] bg-[var(--background)] p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-[1fr_auto_1fr] gap-3 text-center text-sm font-semibold">
                <span className="text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-400)]">
                    Intuition
                </span>
                <span className="text-[var(--color-norwegian-500)]">vs</span>
                <span className="text-[var(--color-fjord-600)] dark:text-[var(--color-fjord-500)]">
                    AI-assisted
                </span>
            </div>

            <div className="divide-y divide-[var(--tw-prose-td-borders)]">
                {/* CLV leads — the core experiment readout. */}
                <ComparisonRow
                    label="CLV (avg)"
                    intuition={intuition.avgClvPct}
                    ai={ai.avgClvPct}
                    format={formatClvPercent}
                    emphasize
                />
                <ComparisonRow
                    label="ROI"
                    intuition={intuition.roi}
                    ai={ai.roi}
                    format={formatRoi}
                />
                <ComparisonRow
                    label="Hit rate"
                    intuition={intuition.hitRate}
                    ai={ai.hitRate}
                    format={(v) => formatPercent(v)}
                />
                <ComparisonRow
                    label="Units"
                    intuition={intuition.units}
                    ai={ai.units}
                    format={formatUnits}
                />
                <ComparisonRow
                    label="Profit"
                    intuition={intuition.profit}
                    ai={ai.profit}
                    format={formatProfit}
                />
                <ComparisonRow
                    label="Record (W-L-P)"
                    intuition={intuition.wins}
                    ai={ai.wins}
                    format={(v) =>
                        v === intuition.wins
                            ? formatRecord(intuition)
                            : formatRecord(ai)
                    }
                />
                <ComparisonRow
                    label="Count"
                    intuition={intuition.count}
                    ai={ai.count}
                    format={(v) => String(v ?? 0)}
                />
            </div>

            {/* Overall row */}
            <div className="mt-4 border-t border-[var(--tw-prose-td-borders)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                    Overall
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    <OverallStat
                        label="CLV"
                        value={formatClvPercent(overall.avgClvPct)}
                    />
                    <OverallStat label="ROI" value={formatRoi(overall.roi)} />
                    <OverallStat
                        label="Hit rate"
                        value={formatPercent(overall.hitRate)}
                    />
                    <OverallStat
                        label="Units"
                        value={formatUnits(overall.units)}
                    />
                    <OverallStat
                        label="Profit"
                        value={formatProfit(overall.profit)}
                    />
                    <OverallStat
                        label="Record"
                        value={formatRecord(overall)}
                    />
                    <OverallStat
                        label="Count"
                        value={String(overall.count)}
                    />
                </div>
                <p className="mt-2 text-xs text-[var(--color-norwegian-500)]">
                    Staked {formatCurrency(overall.staked)} · {overall.pending}{' '}
                    pending · {overall.settled} settled
                </p>
            </div>
        </div>
    );
}
