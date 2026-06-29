import { describe, it, expect } from 'vitest';
import type { Bet, BetMetrics } from '@bryandebaun/mcp-client';
import {
    americanToDecimal,
    clvPercent,
    comparisonBarWidth,
    formatAmericanOdds,
    formatBetDate,
    formatClvPercent,
    formatCurrency,
    formatPercent,
    formatProfit,
    formatRecord,
    formatRoi,
    formatUnits,
    parseBetLegs,
} from '@/lib/bets';

describe('formatAmericanOdds', () => {
    it('adds an explicit + for positive odds', () => {
        expect(formatAmericanOdds(150)).toBe('+150');
    });
    it('keeps the minus sign for negative odds', () => {
        expect(formatAmericanOdds(-110)).toBe('-110');
    });
    it('returns em dash for null/undefined/NaN', () => {
        expect(formatAmericanOdds(null)).toBe('—');
        expect(formatAmericanOdds(undefined)).toBe('—');
        expect(formatAmericanOdds(Number.NaN)).toBe('—');
    });
});

describe('americanToDecimal', () => {
    it('converts positive American odds', () => {
        expect(americanToDecimal(100)).toBeCloseTo(2.0, 5);
        expect(americanToDecimal(150)).toBeCloseTo(2.5, 5);
    });
    it('converts negative American odds', () => {
        expect(americanToDecimal(-110)).toBeCloseTo(1.9090909, 5);
        expect(americanToDecimal(-200)).toBeCloseTo(1.5, 5);
    });
    it('returns null for invalid/zero input', () => {
        expect(americanToDecimal(0)).toBeNull();
        expect(americanToDecimal(null)).toBeNull();
        expect(americanToDecimal(Number.NaN)).toBeNull();
    });
});

describe('clvPercent', () => {
    it('is positive when you beat the close (took better odds)', () => {
        // Took +150 (decimal 2.5), closed at +120 (decimal 2.2) → beat the close.
        const clv = clvPercent({
            oddsAmerican: 150,
            closingOddsAmerican: 120,
        });
        expect(clv).not.toBeNull();
        expect(clv as number).toBeGreaterThan(0);
    });
    it('is negative when the close was better than your price', () => {
        const clv = clvPercent({
            oddsAmerican: 120,
            closingOddsAmerican: 150,
        });
        expect(clv as number).toBeLessThan(0);
    });
    it('returns null when the closing line is absent', () => {
        expect(
            clvPercent({ oddsAmerican: -110, closingOddsAmerican: null }),
        ).toBeNull();
    });
});

describe('formatClvPercent', () => {
    it('signs and rounds to one decimal', () => {
        expect(formatClvPercent(13.64)).toBe('+13.6%');
        expect(formatClvPercent(-5.18)).toBe('-5.2%');
    });
    it('returns em dash for null', () => {
        expect(formatClvPercent(null)).toBe('—');
    });
});

describe('formatPercent / formatRoi / formatUnits', () => {
    it('formats a 0-1 rate as a percentage', () => {
        expect(formatPercent(0.5326)).toBe('53.3%');
        expect(formatPercent(null)).toBe('—');
    });
    it('signs ROI', () => {
        expect(formatRoi(0.12)).toBe('+12.0%');
        expect(formatRoi(-0.04)).toBe('-4.0%');
        expect(formatRoi(null)).toBe('—');
    });
    it('signs units with a u suffix', () => {
        expect(formatUnits(3.2)).toBe('+3.20u');
        expect(formatUnits(-1)).toBe('-1.00u');
        expect(formatUnits(null)).toBe('—');
    });
});

describe('formatCurrency / formatProfit', () => {
    it('formats currency', () => {
        expect(formatCurrency(100)).toBe('$100.00');
        expect(formatCurrency(null)).toBe('—');
    });
    it('signs profit', () => {
        expect(formatProfit(50)).toBe('+$50.00');
        expect(formatProfit(-25)).toBe('-$25.00');
        expect(formatProfit(0)).toBe('$0.00');
    });
});

describe('formatBetDate', () => {
    it('returns em dash for empty/invalid', () => {
        expect(formatBetDate(null)).toBe('—');
        expect(formatBetDate('not-a-date')).toBe('—');
    });
    it('formats a valid ISO date', () => {
        expect(formatBetDate('2026-06-28T12:00:00.000Z')).not.toBe('—');
    });
});

describe('formatRecord', () => {
    it('builds a W-L-P string', () => {
        const m = { wins: 5, losses: 3, pushes: 1 } as BetMetrics;
        expect(formatRecord(m)).toBe('5-3-1');
    });
});

describe('parseBetLegs', () => {
    it('narrows legs (odds optional) and drops entries missing event/selection', () => {
        const legs = parseBetLegs([
            { event: 'A', selection: 'X', oddsAmerican: -110, line: 2.5 },
            { event: 'B', selection: 'Y', oddsAmerican: 100 },
            // same-game parlay leg with no per-leg odds — kept (#137)
            { event: 'C', selection: 'no-odds' },
            { selection: 'missing-event' },
            null,
            'nonsense',
        ]);
        expect(legs).toHaveLength(3);
        expect(legs[0]).toEqual({
            event: 'A',
            selection: 'X',
            oddsAmerican: -110,
            line: 2.5,
        });
        expect(legs[1].line).toBeUndefined();
        // odds-less leg is retained with undefined odds rather than dropped
        expect(legs[2].event).toBe('C');
        expect(legs[2].selection).toBe('no-odds');
        expect(legs[2].oddsAmerican).toBeUndefined();
    });
    it('returns an empty array for non-array input', () => {
        expect(parseBetLegs(undefined)).toEqual([]);
        expect(parseBetLegs('x')).toEqual([]);
    });
});

describe('comparisonBarWidth', () => {
    it('fills the larger value to 100% and scales the peer', () => {
        expect(comparisonBarWidth(10, 5)).toBe(100);
        expect(comparisonBarWidth(5, 10)).toBe(50);
    });
    it('handles negatives by magnitude', () => {
        expect(comparisonBarWidth(-10, 5)).toBe(100);
    });
    it('returns 0 when both are zero/absent', () => {
        expect(comparisonBarWidth(0, 0)).toBe(0);
        expect(comparisonBarWidth(null, undefined)).toBe(0);
    });
});

// Type-only sanity: Bet is importable and clvPercent accepts a full Bet.
it('clvPercent accepts a full Bet shape', () => {
    const bet = {
        oddsAmerican: -110,
        closingOddsAmerican: -120,
    } as Pick<Bet, 'oddsAmerican' | 'closingOddsAmerican'>;
    expect(typeof clvPercent(bet) === 'number' || clvPercent(bet) === null).toBe(
        true,
    );
});
