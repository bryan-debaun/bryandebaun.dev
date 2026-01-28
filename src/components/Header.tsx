"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
    const [open, setOpen] = useState(false);
    const menuId = "mobile-nav";
    const toggleId = "mobile-nav-toggle";

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    useEffect(() => {
        // When opening the mobile menu, move focus to the first menu item.
        // When closing, return focus to the toggle button.
        if (open) {
            requestAnimationFrame(() => {
                const first = document.getElementById('mobile-nav-about') as HTMLElement | null;
                first?.focus();
            });
        } else {
            requestAnimationFrame(() => {
                const toggle = document.getElementById(toggleId) as HTMLElement | null;
                toggle?.focus();
            });
        }
    }, [open]);

    return (
        <header className="site-header border-b sticky top-0 z-10">
            <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-2" aria-label="Home — Bryan DeBaun">
                    <Image src="/icons/wolf.svg" alt="" className="site-logo w-12 h-12 md:w-16 md:h-16 object-contain" width={64} height={64} priority />
                    <span className="site-brand text-lg font-semibold tracking-wide">BAD</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex site-nav items-center gap-6 prose prose-norwegian dark:prose-invert">
                    <Link href="/about" className="text-sm">About</Link>
                    <Link href="/projects" className="text-sm">Projects</Link>
                    <Link href="/blog" className="text-sm">Blog</Link>
                    <DarkModeToggle />
                </nav>

                {/* Mobile controls */}
                <div className="md:hidden flex items-center gap-2">
                    <DarkModeToggle />
                    <button
                        id={toggleId}
                        aria-controls={menuId}
                        aria-expanded={open}
                        onClick={() => setOpen((s) => !s)}
                        className="p-3 h-11 w-11 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-fjord-600)]"
                        aria-label={open ? "Close navigation" : "Open navigation"}
                    >
                        <span className="sr-only">{open ? 'Close navigation' : 'Open navigation'}</span>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            {open ? (
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu (collapsible) */}
            <div id={menuId} className={`md:hidden border-t ${open ? "block" : "hidden"}`} role="menu" aria-labelledby={toggleId} aria-hidden={!open}>
                <div className="px-6 py-3 space-y-2 flex flex-col items-center site-nav prose prose-norwegian dark:prose-invert">
                    <Link href="/about" id="mobile-nav-about" className="inline-block px-3 py-3 rounded text-sm text-center uppercase font-semibold tracking-wide" role="menuitem">About</Link>
                    <Link href="/projects" id="mobile-nav-projects" className="inline-block px-3 py-3 rounded text-sm text-center uppercase font-semibold tracking-wide" role="menuitem">Projects</Link>
                    <Link href="/blog" id="mobile-nav-blog" className="inline-block px-3 py-3 rounded text-sm text-center uppercase font-semibold tracking-wide" role="menuitem">Blog</Link>
                </div>
            </div>
        </header>
    );
}
