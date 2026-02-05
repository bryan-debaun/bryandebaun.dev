import React from 'react';

export default function Skeleton({ className = '', children }: { className?: string; children?: React.ReactNode }) {
    return (
        <div className={`animate-pulse bg-[var(--tw-prose-td-borders)] rounded ${className}`} aria-hidden>
            {children}
        </div>
    );
}
