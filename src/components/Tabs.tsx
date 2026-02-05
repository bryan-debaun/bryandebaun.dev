"use client";

import React from 'react';

type Tab = { id: string; label: string; panel: React.ReactNode };

export default function Tabs({ tabs, defaultIndex = 0 }: { tabs: Tab[]; defaultIndex?: number }) {
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

    return (
        <div>
            <div role="tablist" aria-orientation="horizontal" className="flex mb-0 overflow-visible">
                {tabs.map((t, i) => (
                    <button
                        key={t.id}
                        id={`tab-${t.id}`}
                        ref={(el) => { btnRefs.current[i] = el; }}
                        role="tab"
                        aria-selected={selected === i}
                        aria-controls={`panel-${t.id}`}
                        tabIndex={selected === i ? 0 : -1}
                        className={`flex-1 text-center min-w-0 px-3 py-2 rounded-t-md rounded-b-lg first:rounded-l-lg last:rounded-r-lg first:rounded-bl-none last:rounded-br-none text-sm font-medium cursor-pointer transition-colors duration-150 border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] -ml-px first:ml-0 shadow-sm mb-[-6px] ${selected === i ? 'rounded-b-none border-b-0 z-30 -mt-1 shadow-md bg-white dark:bg-[var(--background)] text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]' : 'rounded-b-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[var(--color-bg-dark)]'}` }
                        onClick={() => setSelected(i)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="mt-0 p-4">
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
