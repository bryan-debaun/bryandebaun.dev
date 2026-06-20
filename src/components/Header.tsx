'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DarkModeToggle from './DarkModeToggle';
import { AuthContext } from '@/lib/auth';

function AuthStatus() {
    const { user, logout, isAuthenticated } = useContext(AuthContext);
    const [busy, setBusy] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.account-dropdown')) {
                setDropdownOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [dropdownOpen]);

    const onLogout = async () => {
        setBusy(true);
        setDropdownOpen(false);
        try {
            await logout();
            router.push('/login');
        } finally {
            setBusy(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="auth-status flex items-center gap-3">
                <Link href="/login" className="text-sm">
                    Sign in
                </Link>
                <span
                    aria-hidden="true"
                    className="inline-flex h-6 items-center text-sm text-[var(--color-norwegian-400)] px-1 select-none md:hidden"
                >
                    |
                </span>
                <Link href="/register" className="text-sm">
                    Register
                </Link>
            </div>
        );
    }

    return (
        <div className="auth-status relative account-dropdown">
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-sm uppercase cursor-pointer font-semibold tracking-wider !text-[var(--color-norwegian-700)] hover:!text-[var(--color-fjord-600)] hover:opacity-80 transition-opacity"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
            >
                {user?.email || 'Account'}
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50 flex flex-col text-gray-900 dark:text-gray-100">
                    <Link
                        href="/account"
                        className="block px-4 py-2 text-sm !normal-case cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 !no-underline !text-current"
                        onClick={() => setDropdownOpen(false)}
                    >
                        Account
                    </Link>
                    {user?.isAdmin && (
                        <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm !normal-case cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 !no-underline !text-current"
                            onClick={() => setDropdownOpen(false)}
                        >
                            Admin
                        </Link>
                    )}
                    <Link
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!busy) {
                                setDropdownOpen(false);
                                onLogout();
                            }
                        }}
                        className="block px-4 py-2 text-sm !normal-case cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 !no-underline !text-current"
                        style={{
                            opacity: busy ? 0.5 : 1,
                            pointerEvents: busy ? 'none' : 'auto',
                        }}
                    >
                        {busy ? 'Signing out…' : 'Sign out'}
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function Header() {
    const [open, setOpen] = useState(false);
    const menuId = 'mobile-nav';
    const toggleId = 'mobile-nav-toggle';

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        // When opening the mobile menu, move focus to the first menu item.
        // When closing, return focus to the toggle button.
        if (open) {
            requestAnimationFrame(() => {
                const first = document.getElementById(
                    'mobile-nav-about',
                ) as HTMLElement | null;
                first?.focus();
            });
        } else {
            requestAnimationFrame(() => {
                const toggle = document.getElementById(
                    toggleId,
                ) as HTMLElement | null;
                toggle?.focus();
            });
        }
    }, [open]);

    return (
        <header className="site-header border-b sticky top-0 z-10">
            <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2"
                    aria-label="Home — Bryan DeBaun"
                >
                    <Image
                        src="/icons/wolf.svg"
                        alt=""
                        className="site-logo w-12 h-12 md:w-16 md:h-16 object-contain"
                        width={64}
                        height={64}
                        priority
                    />
                    <span className="site-brand text-lg font-semibold tracking-wide">
                        BAD
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex site-nav items-center gap-6 prose prose-norwegian dark:prose-invert">
                    <Link href="/about" className="text-sm">
                        About
                    </Link>
                    <Link href="/projects" className="text-sm">
                        Projects
                    </Link>
                    <DarkModeToggle />
                    <AuthStatus />
                </nav>

                {/* Mobile controls */}
                <div className="md:hidden flex items-center gap-2">
                    <DarkModeToggle />
                    <button
                        id={toggleId}
                        aria-controls={menuId}
                        aria-expanded={open}
                        onClick={() => setOpen((s) => !s)}
                        className="p-3 h-11 w-11 rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-fjord-600)]"
                        aria-label={
                            open ? 'Close navigation' : 'Open navigation'
                        }
                    >
                        <span className="sr-only">
                            {open ? 'Close navigation' : 'Open navigation'}
                        </span>
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            {open ? (
                                <path
                                    d="M6 18L18 6M6 6l12 12"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ) : (
                                <path
                                    d="M4 6h16M4 12h16M4 18h16"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu (collapsible) */}
            <div
                id={menuId}
                className={`md:hidden border-t ${open ? 'block' : 'hidden'}`}
                role="menu"
                aria-labelledby={toggleId}
                aria-hidden={!open}
            >
                <div className="px-6 py-3 space-y-2 flex flex-col items-center site-nav prose prose-norwegian dark:prose-invert">
                    <Link
                        href="/about"
                        id="mobile-nav-about"
                        className="inline-block px-3 py-3 rounded text-sm text-center uppercase font-semibold tracking-wide"
                        role="menuitem"
                    >
                        About
                    </Link>
                    <Link
                        href="/projects"
                        id="mobile-nav-projects"
                        className="inline-block px-3 py-3 rounded text-sm text-center uppercase font-semibold tracking-wide"
                        role="menuitem"
                    >
                        Projects
                    </Link>
                    <div className="px-3 py-2">
                        <AuthStatus />
                    </div>
                </div>
            </div>
        </header>
    );
}
