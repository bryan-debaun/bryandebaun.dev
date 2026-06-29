'use client';

import React, { useState } from 'react';
import {
    type Bet,
    type CreateBetRequest,
    BetMarket,
    BetSource,
} from '@bryandebaun/mcp-client';

type Props = {
    mode: 'create' | 'edit';
    initialValues?: Bet;
    onSubmit: (data: CreateBetRequest) => Promise<void>;
    onCancel: () => void;
};

const MARKET_OPTIONS: { value: BetMarket; label: string }[] = [
    { value: BetMarket.Moneyline, label: 'Moneyline' },
    { value: BetMarket.Spread, label: 'Spread' },
    { value: BetMarket.Total, label: 'Total' },
    { value: BetMarket.Prop, label: 'Prop' },
    { value: BetMarket.Parlay, label: 'Parlay' },
];

/** Parse a numeric input into a number, or undefined when blank/invalid. */
function numOrUndefined(value: string): number | undefined {
    if (value.trim() === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

export default function BetForm({
    mode,
    initialValues,
    onSubmit,
    onCancel,
}: Props) {
    const [sport, setSport] = useState(initialValues?.sport ?? '');
    const [league, setLeague] = useState(initialValues?.league ?? '');
    const [event, setEvent] = useState(initialValues?.event ?? '');
    const [market, setMarket] = useState<BetMarket>(
        (initialValues?.market as BetMarket) ?? BetMarket.Moneyline,
    );
    const [selection, setSelection] = useState(initialValues?.selection ?? '');
    const [line, setLine] = useState(
        initialValues?.line != null ? String(initialValues.line) : '',
    );
    const [oddsAmerican, setOddsAmerican] = useState(
        initialValues?.oddsAmerican != null
            ? String(initialValues.oddsAmerican)
            : '',
    );
    const [stake, setStake] = useState(
        initialValues?.stake != null ? String(initialValues.stake) : '',
    );
    const [book, setBook] = useState(initialValues?.book ?? '');
    const [source, setSource] = useState<BetSource>(
        (initialValues?.source as BetSource) ?? BetSource.INTUITION,
    );
    const [aiModel, setAiModel] = useState(initialValues?.aiModel ?? '');
    const [aiRationale, setAiRationale] = useState(
        initialValues?.aiRationale ?? '',
    );
    const [aiEstProb, setAiEstProb] = useState(
        initialValues?.aiEstProb != null
            ? String(initialValues.aiEstProb)
            : '',
    );
    const [aiEV, setAiEV] = useState(
        initialValues?.aiEV != null ? String(initialValues.aiEV) : '',
    );
    const [notes, setNotes] = useState(initialValues?.notes ?? '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAi = source === BetSource.AI_ASSISTED;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const odds = numOrUndefined(oddsAmerican);
        const stakeNum = numOrUndefined(stake);
        if (!sport.trim() || !event.trim() || !selection.trim()) {
            setError('Sport, event, and selection are required.');
            return;
        }
        if (odds === undefined) {
            setError('Valid American odds are required.');
            return;
        }
        if (stakeNum === undefined || stakeNum <= 0) {
            setError('A positive stake is required.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const payload: CreateBetRequest = {
                sport: sport.trim(),
                event: event.trim(),
                market,
                selection: selection.trim(),
                oddsAmerican: odds,
                stake: stakeNum,
                source,
                league: league.trim() || undefined,
                line: numOrUndefined(line),
                book: book.trim() || undefined,
                aiModel: isAi ? aiModel.trim() || undefined : undefined,
                aiRationale: isAi ? aiRationale.trim() || undefined : undefined,
                aiEstProb: isAi ? numOrUndefined(aiEstProb) : undefined,
                aiEV: isAi ? numOrUndefined(aiEV) : undefined,
                notes: notes.trim() || undefined,
            };
            await onSubmit(payload);
        } catch (err) {
            setError((err as Error).message || 'Failed to save bet.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'create' ? 'Log Bet' : 'Edit Bet'}
        >
            <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                    {mode === 'create' ? 'Log Bet' : 'Edit Bet'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Source */}
                    <div>
                        <p className="block text-sm font-medium mb-1">Source</p>
                        <div
                            className="flex rounded-md overflow-hidden border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]"
                            role="group"
                            aria-label="Bet source"
                        >
                            {Object.values(BetSource).map((s, i) => (
                                <button
                                    key={s}
                                    type="button"
                                    role="radio"
                                    aria-checked={source === s}
                                    onClick={() => setSource(s)}
                                    className={[
                                        'flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] focus-visible:z-10',
                                        i > 0
                                            ? 'border-l border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)]'
                                            : '',
                                        source === s
                                            ? 'bg-[var(--btn-accent)] text-white'
                                            : 'bg-transparent text-[var(--color-norwegian-700)] dark:text-[var(--tw-prose-invert-body)] hover:bg-[var(--color-norwegian-100)] dark:hover:bg-white/10',
                                    ].join(' ')}
                                >
                                    {s === BetSource.AI_ASSISTED
                                        ? 'AI-assisted'
                                        : 'Intuition'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="bet-sport"
                                className="block text-sm font-medium"
                            >
                                Sport{' '}
                                <span
                                    className="text-red-500"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <input
                                id="bet-sport"
                                type="text"
                                className="mt-1 w-full form-input"
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="bet-league"
                                className="block text-sm font-medium"
                            >
                                League
                            </label>
                            <input
                                id="bet-league"
                                type="text"
                                className="mt-1 w-full form-input"
                                value={league ?? ''}
                                onChange={(e) => setLeague(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="bet-event"
                            className="block text-sm font-medium"
                        >
                            Event{' '}
                            <span className="text-red-500" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <input
                            id="bet-event"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={event}
                            onChange={(e) => setEvent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="bet-market"
                                className="block text-sm font-medium"
                            >
                                Market
                            </label>
                            <select
                                id="bet-market"
                                className="mt-1 w-full form-input"
                                value={market}
                                onChange={(e) =>
                                    setMarket(e.target.value as BetMarket)
                                }
                            >
                                {MARKET_OPTIONS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="bet-selection"
                                className="block text-sm font-medium"
                            >
                                Selection{' '}
                                <span
                                    className="text-red-500"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <input
                                id="bet-selection"
                                type="text"
                                className="mt-1 w-full form-input"
                                value={selection}
                                onChange={(e) => setSelection(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label
                                htmlFor="bet-line"
                                className="block text-sm font-medium"
                            >
                                Line
                            </label>
                            <input
                                id="bet-line"
                                type="number"
                                step="any"
                                className="mt-1 w-full form-input"
                                value={line}
                                onChange={(e) => setLine(e.target.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="bet-odds"
                                className="block text-sm font-medium"
                            >
                                Odds (US){' '}
                                <span
                                    className="text-red-500"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <input
                                id="bet-odds"
                                type="number"
                                step="1"
                                className="mt-1 w-full form-input"
                                value={oddsAmerican}
                                onChange={(e) =>
                                    setOddsAmerican(e.target.value)
                                }
                                placeholder="-110"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="bet-stake"
                                className="block text-sm font-medium"
                            >
                                Stake{' '}
                                <span
                                    className="text-red-500"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <input
                                id="bet-stake"
                                type="number"
                                step="any"
                                min="0"
                                className="mt-1 w-full form-input"
                                value={stake}
                                onChange={(e) => setStake(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="bet-book"
                            className="block text-sm font-medium"
                        >
                            Book
                        </label>
                        <input
                            id="bet-book"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={book ?? ''}
                            onChange={(e) => setBook(e.target.value)}
                        />
                    </div>

                    {isAi ? (
                        <fieldset className="rounded-md border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)] p-3 space-y-3">
                            <legend className="px-1 text-sm font-medium">
                                AI metadata
                            </legend>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label
                                        htmlFor="bet-ai-model"
                                        className="block text-sm font-medium"
                                    >
                                        Model
                                    </label>
                                    <input
                                        id="bet-ai-model"
                                        type="text"
                                        className="mt-1 w-full form-input"
                                        value={aiModel ?? ''}
                                        onChange={(e) =>
                                            setAiModel(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="bet-ai-prob"
                                        className="block text-sm font-medium"
                                    >
                                        Est. prob
                                    </label>
                                    <input
                                        id="bet-ai-prob"
                                        type="number"
                                        step="any"
                                        className="mt-1 w-full form-input"
                                        value={aiEstProb}
                                        onChange={(e) =>
                                            setAiEstProb(e.target.value)
                                        }
                                        placeholder="0.55"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="bet-ai-ev"
                                        className="block text-sm font-medium"
                                    >
                                        EV
                                    </label>
                                    <input
                                        id="bet-ai-ev"
                                        type="number"
                                        step="any"
                                        className="mt-1 w-full form-input"
                                        value={aiEV}
                                        onChange={(e) => setAiEV(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="bet-ai-rationale"
                                    className="block text-sm font-medium"
                                >
                                    Rationale
                                </label>
                                <textarea
                                    id="bet-ai-rationale"
                                    className="mt-1 w-full form-input"
                                    rows={2}
                                    value={aiRationale ?? ''}
                                    onChange={(e) =>
                                        setAiRationale(e.target.value)
                                    }
                                />
                            </div>
                        </fieldset>
                    ) : null}

                    <div>
                        <label
                            htmlFor="bet-notes"
                            className="block text-sm font-medium"
                        >
                            Notes
                        </label>
                        <textarea
                            id="bet-notes"
                            className="mt-1 w-full form-input"
                            rows={2}
                            value={notes ?? ''}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {error ? (
                        <div className="text-sm text-red-600" role="alert">
                            {error}
                        </div>
                    ) : null}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Saving...'
                                : mode === 'create'
                                  ? 'Log Bet'
                                  : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
