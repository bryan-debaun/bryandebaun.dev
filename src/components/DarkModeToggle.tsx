"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("theme");
            const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initial = stored ? stored === "dark" : prefersDark;
            setIsDark(initial);
            document.documentElement.classList.toggle("dark", initial);
        } catch (e) {
            // ignore
        }
    }, []);

    function toggleTheme() {
        setIsDark((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("theme", next ? "dark" : "light");
                if (next) document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
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
