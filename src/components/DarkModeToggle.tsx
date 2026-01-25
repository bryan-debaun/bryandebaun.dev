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
            aria-pressed={isDark}
            aria-label="Toggle dark mode"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
            {isDark ? "☀️" : "🌙"}
        </button>
    );
}
