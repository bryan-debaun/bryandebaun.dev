import {
    type Bet,
    type BetLeg,
    type BetMetrics,
    BetMarket,
    type BetSource,
    type BetStatus,
} from '@bryandebaun/mcp-client';

/**
 * Market options with display labels. The `BetMarket` enum values are lowercase
 * (`moneyline`, `parlay`, …); these labels are the capitalized display form,
 * shared by the form and the filters so they stay consistent.
 */
export const MARKET_OPTIONS: { value: BetMarket; label: string }[] = [
    { value: BetMarket.Moneyline, label: 'Moneyline' },
    { value: BetMarket.Spread, label: 'Spread' },
    { value: BetMarket.Total, label: 'Total' },
    { value: BetMarket.Prop, label: 'Prop' },
    { value: BetMarket.Parlay, label: 'Parlay' },
];

const MARKET_LABELS = Object.fromEntries(
    MARKET_OPTIONS.map((m) => [m.value, m.label]),
) as Record<BetMarket, string>;

/** Capitalized display label for a market value; falls back to the raw value. */
export function marketLabel(
    value: BetMarket | string | null | undefined,
): string {
    if (!value) return '—';
    return MARKET_LABELS[value as BetMarket] ?? String(value);
}

/**
 * Sports offered in the bet UI. `Bet.sport` is free-text in the DB, so this is a
 * curated frontend list — add an entry here to support a new sport (no
 * migration needed). Values are stored verbatim, so keep them stable.
 */
export const SPORT_OPTIONS: { value: string; label: string }[] = [
    { value: 'Soccer', label: 'Soccer (Intl. Football)' },
    { value: 'American Football', label: 'American Football' },
];

/**
 * Sportsbooks offered in the bet UI. `Bet.book` is free-text in the DB (the
 * server defaults it to "DraftKings"), so this is a curated frontend list — add
 * an entry to support another book. The first entry is the form default.
 */
export const BOOK_OPTIONS: { value: string; label: string }[] = [
    { value: 'DraftKings', label: 'DraftKings' },
    { value: 'FanDuel', label: 'FanDuel' },
    { value: 'BetMGM', label: 'BetMGM' },
    { value: 'Caesars', label: 'Caesars' },
    { value: 'ESPN BET', label: 'ESPN BET' },
    { value: 'Fanatics', label: 'Fanatics' },
];

/**
 * Pure, side-effect-free formatting and derivation helpers for the admin Bets
 * dashboard. Everything here is unit-testable and performs no I/O — UI
 * components and route handlers import these so display logic stays consistent
 * and verifiable.
 */

/**
 * Filters accepted by the admin bets list + analytics UI. A subset is forwarded
 * to each upstream endpoint depending on what it supports (analytics has no
 * `status`; listBets has no date range).
 */
export interface BetFilters {
    source?: BetSource;
    status?: BetStatus;
    sport?: string;
    market?: BetMarket;
    /** ISO date (YYYY-MM-DD) lower bound — analytics only. */
    from?: string;
    /** ISO date (YYYY-MM-DD) upper bound — analytics only. */
    to?: string;
}

/**
 * Format an American odds value with an explicit sign (e.g. `+150`, `-110`).
 * Returns an em dash when the value is missing/invalid.
 */
export function formatAmericanOdds(
    odds: number | null | undefined,
): string {
    if (odds === null || odds === undefined || Number.isNaN(odds)) return '—';
    const rounded = Math.round(odds);
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/**
 * Convert American odds to their decimal-odds equivalent. Used internally for
 * CLV math. Returns `null` for invalid input.
 */
export function americanToDecimal(
    odds: number | null | undefined,
): number | null {
    if (odds === null || odds === undefined || Number.isNaN(odds) || odds === 0) {
        return null;
    }
    return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
}

/**
 * Total payout (stake + profit) if the bet wins, derived from stake + American
 * odds — e.g. $10 at +180 → $28.00. Returns `null` for invalid input. This is
 * computed for display, never stored (the DB `payout` is the *actual* settled
 * amount).
 */
export function potentialReturn(
    stake: number | null | undefined,
    oddsAmerican: number | null | undefined,
): number | null {
    const dec = americanToDecimal(oddsAmerican);
    if (
        dec === null ||
        stake === null ||
        stake === undefined ||
        Number.isNaN(stake) ||
        stake <= 0
    ) {
        return null;
    }
    return stake * dec;
}

/**
 * Closing-line value (CLV) as a percentage: how much better/worse the odds you
 * took were versus the closing odds, expressed as the percentage change in
 * decimal payout. Positive means you beat the close (good).
 *
 * Returns `null` when either side is missing — a bet without a recorded closing
 * line simply has no CLV.
 */
export function clvPercent(bet: Pick<Bet, 'oddsAmerican' | 'closingOddsAmerican'>): number | null {
    const taken = americanToDecimal(bet.oddsAmerican);
    const close = americanToDecimal(bet.closingOddsAmerican);
    if (taken === null || close === null) return null;
    // Decimal odds map directly to gross payout per unit staked; the relative
    // edge vs. the close is (taken - close) / close.
    return ((taken - close) / close) * 100;
}

/** Format a CLV percentage for display with a sign, or an em dash when absent. */
export function formatClvPercent(
    value: number | null | undefined,
): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

/** Format a 0–1 rate (hit rate, est. probability) as a percentage. */
export function formatPercent(
    value: number | null | undefined,
    fractionDigits = 1,
): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** Format a ROI value (already a ratio, e.g. 0.12 → +12.0%). */
export function formatRoi(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const pct = value * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
}

/** Format a units value with a sign (e.g. `+3.2u`, `-1.0u`). */
export function formatUnits(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}u`;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Format a currency (USD) amount; em dash for missing values. */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return currencyFormatter.format(value);
}

/** Format a signed currency (profit) amount with an explicit `+` for gains. */
export function formatProfit(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const formatted = currencyFormatter.format(Math.abs(value));
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
}

/** Format an ISO timestamp as a short local date; em dash when absent/invalid. */
export function formatBetDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

/**
 * Build a `W-L-P` record string from a metrics block (wins-losses-pushes).
 * Voids are intentionally excluded from the headline record.
 */
export function formatRecord(metrics: Pick<BetMetrics, 'wins' | 'losses' | 'pushes'>): string {
    return `${metrics.wins}-${metrics.losses}-${metrics.pushes}`;
}

/**
 * Narrowed, typed view of a bet's parlay legs. The generated client types
 * `legs` as `any`; we narrow it at this boundary so `any` never propagates into
 * UI code. Anything that doesn't structurally match a leg is dropped.
 */
export function parseBetLegs(legs: unknown): BetLeg[] {
    if (!Array.isArray(legs)) return [];
    const result: BetLeg[] = [];
    for (const raw of legs) {
        if (raw === null || typeof raw !== 'object') continue;
        const leg = raw as Record<string, unknown>;
        if (
            typeof leg.event === 'string' &&
            typeof leg.selection === 'string' &&
            typeof leg.oddsAmerican === 'number'
        ) {
            result.push({
                event: leg.event,
                selection: leg.selection,
                oddsAmerican: leg.oddsAmerican,
                line:
                    typeof leg.line === 'number' ? leg.line : undefined,
            });
        }
    }
    return result;
}

/**
 * Compute a 0–100 bar width for a comparison metric, scaled against the larger
 * of the two values being compared (so the bigger bar fills the track). Handles
 * negatives by scaling on absolute magnitude. Returns 0 when there is nothing
 * meaningful to show.
 */
export function comparisonBarWidth(
    value: number | null | undefined,
    peer: number | null | undefined,
): number {
    const v = value === null || value === undefined || Number.isNaN(value) ? 0 : value;
    const p = peer === null || peer === undefined || Number.isNaN(peer) ? 0 : peer;
    const max = Math.max(Math.abs(v), Math.abs(p));
    if (max === 0) return 0;
    return Math.min(100, (Math.abs(v) / max) * 100);
}
