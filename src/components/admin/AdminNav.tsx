'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Admin section navigation rendered as a pill/tab bar at the top of each admin
 * page, so an admin can move between Books, Articles, Bets, and Users. The pill
 * matching the current route is highlighted (`aria-current="page"`).
 */
const TABS: ReadonlyArray<{
    href: string;
    label: string;
    isActive: (pathname: string) => boolean;
}> = [
    { href: '/admin', label: 'Books', isActive: (p) => p === '/admin' },
    {
        href: '/admin/articles',
        label: 'Articles',
        isActive: (p) => p.startsWith('/admin/articles'),
    },
    {
        href: '/admin/bets',
        label: 'Bets',
        isActive: (p) => p.startsWith('/admin/bets'),
    },
    {
        href: '/admin/users',
        label: 'Users',
        isActive: (p) => p.startsWith('/admin/users'),
    },
];

export default function AdminNav() {
    const pathname = usePathname() ?? '';
    return (
        <nav aria-label="Admin sections" className="mb-6">
            <ul className="flex w-full items-center gap-1 rounded-full border border-[var(--color-norwegian-300)] bg-[var(--color-norwegian-50)] p-1 dark:border-[var(--color-norwegian-600)] dark:bg-[rgba(255,255,255,0.02)]">
                {TABS.map((tab) => {
                    const active = tab.isActive(pathname);
                    return (
                        <li key={tab.href} className="flex-1">
                            <Link
                                href={tab.href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex w-full items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)] focus-visible:ring-offset-1 ${
                                    active
                                        ? 'bg-[var(--color-fjord-600)] text-white shadow-sm'
                                        : 'text-[var(--color-norwegian-700)] hover:bg-[var(--color-norwegian-100)] dark:text-[var(--color-norwegian-200)] dark:hover:bg-[rgba(255,255,255,0.06)]'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
