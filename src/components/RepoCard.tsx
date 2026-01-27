import React from 'react'
import type { Repo } from '../lib/github'

export default function RepoCard({ repo }: { repo: Repo }) {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${repo.name} — ${repo.description ?? 'Repository'}`}
            className="repo-card"
        >
            <h3 className="repo-card__title">{repo.name}</h3>
        </a>
    )
}
