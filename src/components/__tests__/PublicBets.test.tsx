import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BetMarket, BetSource, BetStatus } from '@bryandebaun/mcp-client';
import PublicBets from '@/components/PublicBets';
import type {
    PublicBet,
    PublicBetAnalytics,
    PublicBetMetrics,
} from '@/lib/services/public-bets';

const metrics: PublicBetMetrics = {
    count: 4,
    pending: 1,
    settled: 3,
    wins: 2,
    losses: 1,
    pushes: 0,
    voids: 0,
    hitRate: 0.667,
    roi: 0.12,
    units: 1.5,
    clvCount: 3,
    avgClvPct: 2.1,
};

const analytics: PublicBetAnalytics = {
    overall: metrics,
    bySource: { INTUITION: metrics, AI_ASSISTED: metrics },
};

const aiBet: PublicBet = {
    id: 1,
    placedAt: '2026-06-01T12:00:00.000Z',
    sport: 'Soccer',
    league: 'EPL',
    event: 'Arsenal vs. Chelsea',
    market: BetMarket.Moneyline,
    selection: 'Arsenal',
    line: null,
    oddsAmerican: -120,
    status: BetStatus.WON,
    source: BetSource.AI_ASSISTED,
    settledAt: '2026-06-02T12:00:00.000Z',
    closingOddsAmerican: -135,
    aiModel: 'gpt-x',
    aiRationale: 'Edge on home form.',
    aiEstProb: 0.6,
    aiEV: 0.08,
    legs: [],
};

describe('PublicBets', () => {
    it('renders the scoreboard and a pick with no dollar signs', () => {
        const { container } = render(
            <PublicBets bets={[aiBet]} analytics={analytics} />,
        );

        // Pick is rendered.
        expect(screen.getByText('Arsenal vs. Chelsea')).toBeInTheDocument();
        expect(screen.getByText('gpt-x')).toBeInTheDocument();
        // Scoreboard sources are present.
        expect(screen.getByText('Intuition')).toBeInTheDocument();
        expect(screen.getByText('AI-assisted')).toBeInTheDocument();

        // Money must never render: no `$` anywhere in the output.
        expect(container.textContent ?? '').not.toContain('$');
    });

    it('shows the empty state when there are no picks', () => {
        render(<PublicBets bets={[]} analytics={null} />);
        expect(
            screen.getByText(/no picks to show just yet/i),
        ).toBeInTheDocument();
    });
});
