'use client';

import React, { useRef, useState } from 'react';
import {
    type Bet,
    type BetLeg,
    type CreateBetRequest,
    BetMarket,
    BetSource,
} from '@bryandebaun/mcp-client';
import Select from '@/components/Select';
import { MARKET_OPTIONS, SPORT_OPTIONS } from '@/lib/bets';

/** A parlay leg as edited in the form (string-valued inputs + stable key). */
interface LegInput {
    id: number;
    event: string;
    selection: string;
    oddsAmerican: string;
    line: string;
}

type Props = {
    mode: 'create' | 'edit';
    initialValues?: Bet;
    onSubmit: (data: CreateBetRequest) => Promise<void>;
    onCancel: () => void;
};

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

    const legIdRef = useRef(0);
    const [legs, setLegs] = useState<LegInput[]>(() =>
        Array.isArray(initialValues?.legs)
            ? (initialValues?.legs as BetLeg[]).map((l) => ({
                  id: legIdRef.current++,
                  event: l.event ?? '',
                  selection: l.selection ?? '',
                  oddsAmerican:
                      l.oddsAmerican != null ? String(l.oddsAmerican) : '',
                  line: l.line != null ? String(l.line) : '',
              }))
            : [],
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAi = source === BetSource.AI_ASSISTED;
    const isParlay = market === BetMarket.Parlay;

    // Keep an off-list sport (e.g. from an older bet) selectable when editing.
    const sportOptions =
        sport && !SPORT_OPTIONS.some((o) => o.value === sport)
            ? [{ value: sport, label: sport }, ...SPORT_OPTIONS]
            : SPORT_OPTIONS;

    const addLeg = () =>
        setLegs((prev) => [
            ...prev,
            {
                id: legIdRef.current++,
                event: '',
                selection: '',
                oddsAmerican: '',
                line: '',
            },
        ]);
    const removeLeg = (id: number) =>
        setLegs((prev) => prev.filter((l) => l.id !== id));
    const updateLeg = (id: number, key: keyof LegInput, value: string) =>
        setLegs((prev) =>
            prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)),
        );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const odds = numOrUndefined(oddsAmerican);
        const stakeNum = numOrUndefined(stake);

        // Parse complete parlay legs (event + selection + valid odds).
        const parsedLegs: BetLeg[] = legs
            .map((l) => ({
                event: l.event.trim(),
                selection: l.selection.trim(),
                oddsAmerican: numOrUndefined(l.oddsAmerican),
                line: numOrUndefined(l.line),
            }))
            .filter(
                (l) => l.event && l.selection && l.oddsAmerican !== undefined,
            )
            .map((l) => ({
                event: l.event,
                selection: l.selection,
                oddsAmerican: l.oddsAmerican as number,
                ...(l.line !== undefined ? { line: l.line } : {}),
            }));

        // For a parlay, derive event/selection from the legs when left blank so
        // the user only has to fill the legs + combined odds + total stake.
        const finalEvent =
            isParlay && !event.trim() && parsedLegs.length
                ? `${parsedLegs.length}-leg parlay`
                : event.trim();
        const finalSelection =
            isParlay && !selection.trim() && parsedLegs.length
                ? parsedLegs.map((l) => l.selection).join(' + ')
                : selection.trim();

        if (!sport.trim()) {
            setError('Sport is required.');
            return;
        }
        if (isParlay && parsedLegs.length < 2) {
            setError(
                'A parlay needs at least 2 complete legs (event, selection, odds).',
            );
            return;
        }
        if (!finalEvent || !finalSelection) {
            setError('Event and selection are required.');
            return;
        }
        if (odds === undefined) {
            setError(
                isParlay
                    ? 'Combined American odds are required.'
                    : 'Valid American odds are required.',
            );
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
                event: finalEvent,
                market,
                selection: finalSelection,
                oddsAmerican: odds,
                stake: stakeNum,
                source,
                league: league.trim() || undefined,
                line: isParlay ? undefined : numOrUndefined(line),
                book: book.trim() || undefined,
                legs: isParlay && parsedLegs.length ? parsedLegs : undefined,
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
                            <Select
                                id="bet-sport"
                                ariaLabel="Sport"
                                className="mt-1"
                                placeholder="Select sport"
                                value={sport}
                                onValueChange={setSport}
                                options={sportOptions}
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
                            <Select
                                id="bet-market"
                                ariaLabel="Market"
                                className="mt-1 w-full"
                                value={market}
                                onValueChange={(v) =>
                                    setMarket(v as BetMarket)
                                }
                                options={MARKET_OPTIONS.map((m) => ({
                                    value: m.value,
                                    label: m.label,
                                }))}
                            />
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {!isParlay ? (
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
                        ) : null}
                        <div>
                            <label
                                htmlFor="bet-odds"
                                className="block text-sm font-medium"
                            >
                                {isParlay ? 'Combined odds (US)' : 'Odds (US)'}{' '}
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
                                placeholder={isParlay ? '+650' : '-110'}
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="bet-stake"
                                className="block text-sm font-medium"
                            >
                                Stake ($){' '}
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
                                placeholder="25.00"
                                required
                            />
                        </div>
                    </div>

                    {isParlay ? (
                        <fieldset className="rounded-md border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)] p-3 space-y-3">
                            <legend className="px-1 text-sm font-medium">
                                Parlay legs
                            </legend>
                            <p className="text-xs text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                                Add each leg below. Put the combined odds and
                                total stake in the fields above; event/selection
                                auto-fill from the legs if left blank.
                            </p>
                            {legs.length === 0 ? (
                                <p className="text-sm text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)]">
                                    No legs yet.
                                </p>
                            ) : null}
                            {legs.map((leg, idx) => (
                                <div
                                    key={leg.id}
                                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end"
                                >
                                    <div className="sm:col-span-4">
                                        <label
                                            htmlFor={`leg-event-${leg.id}`}
                                            className="block text-xs font-medium"
                                        >
                                            Event
                                        </label>
                                        <input
                                            id={`leg-event-${leg.id}`}
                                            type="text"
                                            className="mt-1 w-full form-input"
                                            placeholder="Portugal vs Croatia"
                                            value={leg.event}
                                            onChange={(e) =>
                                                updateLeg(
                                                    leg.id,
                                                    'event',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label
                                            htmlFor={`leg-sel-${leg.id}`}
                                            className="block text-xs font-medium"
                                        >
                                            Selection
                                        </label>
                                        <input
                                            id={`leg-sel-${leg.id}`}
                                            type="text"
                                            className="mt-1 w-full form-input"
                                            placeholder="Croatia ML"
                                            value={leg.selection}
                                            onChange={(e) =>
                                                updateLeg(
                                                    leg.id,
                                                    'selection',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor={`leg-odds-${leg.id}`}
                                            className="block text-xs font-medium"
                                        >
                                            Odds
                                        </label>
                                        <input
                                            id={`leg-odds-${leg.id}`}
                                            type="number"
                                            step="1"
                                            className="mt-1 w-full form-input"
                                            placeholder="+370"
                                            value={leg.oddsAmerican}
                                            onChange={(e) =>
                                                updateLeg(
                                                    leg.id,
                                                    'oddsAmerican',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label
                                            htmlFor={`leg-line-${leg.id}`}
                                            className="block text-xs font-medium"
                                        >
                                            Line
                                        </label>
                                        <input
                                            id={`leg-line-${leg.id}`}
                                            type="number"
                                            step="any"
                                            className="mt-1 w-full form-input"
                                            placeholder="—"
                                            value={leg.line}
                                            onChange={(e) =>
                                                updateLeg(
                                                    leg.id,
                                                    'line',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => removeLeg(leg.id)}
                                            aria-label={`Remove leg ${idx + 1}`}
                                            className="btn w-full"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addLeg}
                                className="btn"
                            >
                                + Add leg
                            </button>
                        </fieldset>
                    ) : null}

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
