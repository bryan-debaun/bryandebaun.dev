"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BackButton({ fallbackHref = '/', children = 'Back', className = '' }: { fallbackHref?: string; children?: React.ReactNode; className?: string; }) {
    const router = useRouter();

    function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-[var(--color-norwegian-50)] hover:bg-[var(--color-norwegian-100)] dark:bg-[var(--background)] ${className}`}
            aria-label="Go back"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L4.414 9H18a1 1 0 110 2H4.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>{children}</span>
        </button>
    );
}
