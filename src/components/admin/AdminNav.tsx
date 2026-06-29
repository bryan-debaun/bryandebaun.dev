import Link from 'next/link';

/**
 * Small admin section navigation linking the admin sub-pages. Rendered at the
 * top of each admin page so an admin can move between Books, Bets, and Users.
 */
export default function AdminNav() {
    const linkClass =
        'text-sm font-medium text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]';
    return (
        <nav aria-label="Admin sections" className="mb-6">
            <ul className="flex items-center gap-4">
                <li>
                    <Link href="/admin" className={linkClass}>
                        Books
                    </Link>
                </li>
                <li>
                    <Link href="/admin/bets" className={linkClass}>
                        Bets
                    </Link>
                </li>
                <li>
                    <Link href="/admin/users" className={linkClass}>
                        Users
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
