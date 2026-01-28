"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    // Defer real theme detection to the client to avoid SSR/client hydration mismatch.
    // `isDark === null` indicates we haven't mounted yet.
    const [isDark, setIsDark] = useState<boolean | null>(null)

    function applyTheme(isDarkVal: boolean) {
        if (isDarkVal) {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
        } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
        }
    }

    // Initialize on mount only (client-side) to avoid differing server/client markup
    useEffect(() => {
        try {
            const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem("theme") : null
            const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            const initial = stored ? stored === "dark" : !!prefersDark
            requestAnimationFrame(() => setIsDark(initial))
            requestAnimationFrame(() => applyTheme(initial))
        } catch {
            requestAnimationFrame(() => setIsDark(false))
        }
    }, [])

    function toggleTheme() {
        setIsDark((prev) => {
            const current = prev ?? false
            const next = !current
            try {
                if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem("theme", next ? "dark" : "light")
                applyTheme(next)
            } catch { }
            return next
        })
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
            aria-checked={Boolean(isDark)}
            aria-label="Toggle dark mode"
            title={isDark === null ? "Toggle theme" : isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-3 rounded-full p-2 w-11 h-11 flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: Boolean(isDark) ? 'var(--color-norwegian-400-dark)' : 'var(--color-norwegian-200)' }}
        >
            <span className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
