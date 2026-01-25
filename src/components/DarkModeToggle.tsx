"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState<boolean>(false);

    function applyTheme(isDark: boolean) {
        if (isDark) {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
    }

    useEffect(() => {
        try {
            const stored = localStorage.getItem("theme");
            const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initial = stored ? stored === "dark" : prefersDark;
            setIsDark(initial);
            applyTheme(initial);
        } catch (e) {
            // ignore
        }
    }, []);

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
