'use client';

import React from 'react';

type Tab = { id: string; label: string; panel: React.ReactNode };

export default function Tabs({
    tabs,
    defaultIndex = 0,
}: {
    tabs: Tab[];
    defaultIndex?: number;
}) {
    const [selected, setSelected] = React.useState(defaultIndex);
    const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

    React.useEffect(() => {
        // ensure refs array length equals tabs length
        btnRefs.current = btnRefs.current.slice(0, tabs.length);
    }, [tabs.length]);

    function focusIndex(idx: number) {
        const el = btnRefs.current[idx];
        el?.focus();
    }

    function onKeyDown(e: React.KeyboardEvent, index: number) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = (index + 1) % tabs.length;
            focusIndex(next);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = (index - 1 + tabs.length) % tabs.length;
            focusIndex(prev);
        } else if (e.key === 'Home') {
            e.preventDefault();
            focusIndex(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            focusIndex(tabs.length - 1);
        }
    }

    // Match the content panel's own border (e.g. BooksTable's box) so the active
    // tab merges into it for an open-folder look, without adding a second box.
    const borderColor =
        'border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)]';

    return (
        <div>
            <div
                role="tablist"
                aria-orientation="horizontal"
                className="flex items-end gap-1"
            >
                {tabs.map((t, i) => {
                    const active = selected === i;
                    return (
                        <button
                            key={t.id}
                            id={`tab-${t.id}`}
                            ref={(el) => {
                                btnRefs.current[i] = el;
                            }}
                            role="tab"
                            aria-selected={active}
                            aria-controls={`panel-${t.id}`}
                            tabIndex={active ? 0 : -1}
                            className={`relative -mb-px rounded-t-md border px-4 py-2 text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] focus-visible:ring-inset ${
                                active
                                    ? `z-10 ${borderColor} border-b-0 bg-[var(--background)] text-[var(--color-norwegian-800)] dark:text-[var(--color-white)]`
                                    : 'border-transparent text-[var(--color-norwegian-600)] dark:text-[var(--color-norwegian-300)] hover:bg-[var(--color-norwegian-100)] dark:hover:bg-white/5'
                            }`}
                            onClick={() => setSelected(i)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div>
                {tabs.map((t, i) => (
                    <div
                        key={t.id}
                        id={`panel-${t.id}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${t.id}`}
                        hidden={selected !== i}
                    >
                        {t.panel}
                    </div>
                ))}
            </div>
        </div>
    );
}
