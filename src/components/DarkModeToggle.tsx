"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    // Defer real theme detection to the client to avoid SSR/client hydration mismatch.
    // `isDark === null` indicates we haven't mounted yet.
    const [isDark, setIsDark] = useState<boolean | null>(null);

    function applyTheme(isDarkVal: boolean) {
        if (isDarkVal) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
        // Broadcast theme change so other mounted toggle instances stay in sync
        try {
            const ev = new CustomEvent('themechange', { detail: { isDark: !!isDarkVal } });
            window.dispatchEvent(ev);
        } catch {
            // ignore (environments without window)
        }
    }

    // Initialize on mount only (client-side) to avoid differing server/client markup
    useEffect(() => {
        try {
            const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem("theme") : null;
            const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

            // Determine the authoritative initial theme in this order:
            // 1. localStorage (explicit user choice)
            // 2. document class if already set by another instance
            // 3. prefers-color-scheme media query
            let initial: boolean;
            if (stored === 'dark') initial = true;
            else if (stored === 'light') initial = false;
            else if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) initial = true;
            else if (typeof document !== 'undefined' && document.documentElement.classList.contains('light')) initial = false;
            else initial = !!prefersDark;

            // Apply and set state together to avoid races between instances
            requestAnimationFrame(() => {
                setIsDark(initial);
                applyTheme(initial);
            });

            // Keep multiple mounted instances in sync via a custom event
            function onThemeChange(e: Event) {
                const detail = (e as CustomEvent)?.detail;
                if (detail && typeof detail.isDark === 'boolean') {
                    requestAnimationFrame(() => setIsDark(detail.isDark));
                }
            }
            window.addEventListener('themechange', onThemeChange as EventListener);
            return () => window.removeEventListener('themechange', onThemeChange as EventListener);
        } catch {
            requestAnimationFrame(() => setIsDark(false));
        }
    }, []);

    function toggleTheme() {
        setIsDark((prev) => {
            const current = prev ?? false;
            const next = !current;
            try {
                if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem("theme", next ? "dark" : "light");
                applyTheme(next);
            } catch { }
            return next;
        });
    }

    return (
        <button
            onClick={toggleTheme}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTheme();
                }
            }}
            role="switch"
            aria-checked={Boolean(isDark)}
            aria-label="Toggle dark mode"
            title={isDark === null ? "Toggle theme" : isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-3 relative w-11 h-11 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
            {/* Track */}
            <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full transition-colors duration-200 ease-in-out"
                style={{ backgroundColor: Boolean(isDark) ? 'var(--color-norwegian-400-dark)' : 'var(--color-norwegian-200)' }}
            />

            {/* Knob: absolutely positioned and constrained within track; use transform translateX for smooth animation */}
            <span
                aria-hidden="true"
                className={`absolute top-1/2 left-1 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${isDark ? 'translate-x-[20px]' : 'translate-x-0'}`}
            />
        </button>
    );
}
