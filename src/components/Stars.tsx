import React, { useId } from 'react';

export default function Stars({ value }: { value: number }) {
    // Scale to 0..5 and round to nearest 0.5, then use integer arithmetic (0..10) to avoid FP comparison issues
    const scaled = Math.round(((value / 10) * 5) * 2); // 0..10 integer where 9 -> 9
    const uid = useId();

    return (
        <div className="flex items-center gap-2">
            <div className="flex" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => {
                    const fullThreshold = (i + 1) * 2; // e.g., i=0 -> 2, i=4 -> 10
                    const halfThreshold = i * 2 + 1; // e.g., i=0 -> 1, i=4 -> 9

                    if (scaled >= fullThreshold) {
                        return (
                            <svg key={i} className={`h-5 w-5 text-[var(--color-norwegian-400)]`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <title>Filled star</title>
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.955a1 1 0 00-.364-1.118L2.644 9.382c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                            </svg>
                        );
                    }

                    if (scaled >= halfThreshold) {
                        const gradId = `half-${uid}-${i}`;
                        return (
                            <svg key={i} className={`h-5 w-5`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <defs>
                                    <linearGradient id={gradId} x1="0" x2="1">
                                        <stop offset="50%" stopColor="var(--color-norwegian-400)" />
                                        <stop offset="50%" stopColor="var(--color-norwegian-200)" />
                                    </linearGradient>
                                </defs>
                                <title>Half star</title>
                                <path fill={`url(#${gradId})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.955a1 1 0 00-.364-1.118L2.644 9.382c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                            </svg>
                        );
                    }

                    return (
                        <svg key={i} className={`h-5 w-5 text-[var(--color-norwegian-200)]`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <title>Empty star</title>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.955a1 1 0 00-.364-1.118L2.644 9.382c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                        </svg>
                    );
                })}
            </div>
            <span className="sr-only">{Number.isInteger(scaled / 2) ? String(scaled / 2) : (scaled / 2).toFixed(1)} out of 5 stars</span>
        </div>
    );
} 
