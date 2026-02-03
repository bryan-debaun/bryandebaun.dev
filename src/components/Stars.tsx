import React from 'react'

export default function Stars({ value }: { value: number }) {
    const stars = Math.round((value / 10) * 5)
    return (
        <div className="flex items-center gap-2">
            <div className="flex" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`h-4 w-4 ${i < stars ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.955a1 1 0 00-.364-1.118L2.644 9.382c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                    </svg>
                ))}
            </div>
        </div>
    )
}
