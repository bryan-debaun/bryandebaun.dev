import type { ReactNode } from 'react';
import Link from 'next/link';

export interface CardProps {
    href: string;
    title: string;
    description?: string | null;
    chips?: string[];
    external?: boolean;
    icon?: ReactNode;
    meta?: ReactNode;
    ariaLabel?: string;
}

const CARD_CLASS =
    'group flex h-full min-w-0 flex-col gap-3 rounded-xl border border-[var(--color-norwegian-300)] bg-[var(--background)] p-5 no-underline shadow-sm transition-shadow transition-transform duration-150 ease-out transform-gpu hover:border-[var(--color-fjord-600)] hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-fjord-600)] dark:border-[var(--color-norwegian-300-dark)] dark:hover:border-[var(--color-fjord-neon)]';

/**
 * Generic, presentational card whose entire surface is the link. Used for
 * project repositories (external) and article/writing entries (internal).
 *
 * Layout: a title row (optional icon + title), then an optional clamped
 * description, then optional meta line, then up to five rounded-full chips.
 */
export default function Card({
    href,
    title,
    description,
    chips,
    external = false,
    icon,
    meta,
    ariaLabel,
}: CardProps) {
    const inner = (
        <>
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="m-0 min-w-0 break-words text-base font-semibold leading-snug text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    {title}
                </h3>
            </div>

            {description ? (
                <p className="m-0 line-clamp-3 text-sm leading-relaxed text-[var(--color-norwegian-700)] opacity-90 dark:text-[var(--color-norwegian-200)]">
                    {description}
                </p>
            ) : null}

            {meta ? (
                <div className="text-sm text-muted">{meta}</div>
            ) : null}

            {chips && chips.length > 0 ? (
                <ul className="mt-auto flex list-none flex-wrap gap-2 p-0">
                    {chips.slice(0, 5).map((chip) => (
                        <li
                            key={chip}
                            className="max-w-[10rem] truncate rounded-full border border-[var(--color-norwegian-300)] bg-[var(--color-norwegian-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-norwegian-700)] dark:border-[var(--color-norwegian-300-dark)] dark:bg-[color-mix(in_srgb,var(--color-fjord-600)_18%,transparent)] dark:text-[var(--color-norwegian-200)]"
                        >
                            {chip}
                        </li>
                    ))}
                </ul>
            ) : null}
        </>
    );

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                className={CARD_CLASS}
            >
                {inner}
            </a>
        );
    }

    return (
        <Link href={href} aria-label={ariaLabel} className={CARD_CLASS}>
            {inner}
        </Link>
    );
}
