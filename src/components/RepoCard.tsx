import React from 'react'
import type { Repo } from '../lib/github'

export default function RepoCard({ repo }: { repo: Repo }) {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${repo.name} — ${repo.description ?? 'Repository'}`}
            className="inline-flex items-center justify-center h-12 px-3 rounded-sm w-full transition-transform duration-200 ease-out transform bg-[var(--color-norwegian-300)] border border-[rgba(16,143,139,0.12)] shadow-[0_4px_10px_rgba(16,143,139,0.06)] hover:bg-[var(--color-norwegian-400)] hover:shadow-[0_12px_32px_rgba(16,143,139,0.12)] hover:-translate-y-1.5 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:transition-transform motion-reduce:transition-none dark:bg-[var(--color-norwegian-200-dark)] dark:border-[rgba(255,255,255,0.04)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.28)] dark:hover:bg-[var(--color-norwegian-300-dark)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
        >
            <h3 className="m-0 flex-1 min-w-0 h-full flex items-center justify-center text-center text-xs font-medium truncate leading-none uppercase">{repo.name}</h3>
        </a>
    )
}
