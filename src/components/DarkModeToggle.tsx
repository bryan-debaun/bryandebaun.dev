"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    // Lazily initialize from localStorage and prefers-color-scheme to avoid calling setState in an effect
    const [isDark, setIsDark] = useState<boolean>(() => {
        try {
            const stored = typeof localStorage !== 'undefined' ? localStorage.getItem("theme") : null;
            const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            return stored ? stored === "dark" : !!prefersDark;
        } catch {
            return false;
        }
    });

    function applyTheme(isDark: boolean) {
        if (isDark) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
    }

    // Keep DOM in sync with state without calling setState inside the effect
    useEffect(() => {
        try {
            applyTheme(isDark);
        } catch {
            // ignore
        }
    }, [isDark]);

    function toggleTheme() {
        setIsDark((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("theme", next ? "dark" : "light");
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
                    e.preventDefault()
                    toggleTheme()
                }
            }}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-3 rounded-full p-1 w-12 h-6 flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: isDark ? 'var(--color-norwegian-400-dark)' : 'var(--color-norwegian-200)' }}
        >
            <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
