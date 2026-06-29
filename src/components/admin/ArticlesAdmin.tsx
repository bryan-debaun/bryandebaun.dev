'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { Article } from '@bryandebaun/mcp-client';
import { ArticleStatus } from '@bryandebaun/mcp-client';
import Table from '@/components/Table';
import { useAdminArticles } from '@/lib/hooks/useAdminArticles';
import { toUpdateRequest } from '@/lib/article-editor';
import { formatDate } from '@/lib/dates';

function StatusPill({ status }: { status: ArticleStatus }) {
    const classes =
        status === ArticleStatus.Published
            ? 'bg-gradient-to-b from-[var(--color-norwegian-500)] to-[var(--color-norwegian-400)] text-[var(--color-white)] border border-[rgba(0,0,0,0.06)] shadow-sm'
            : 'bg-[var(--color-norwegian-50)] text-[var(--color-norwegian-700)] dark:bg-[var(--color-norwegian-100-dark)] dark:text-[var(--color-norwegian-300-dark)]';
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}
        >
            {status}
        </span>
    );
}

export default function ArticlesAdmin() {
    const { articles, isError, error, updateMutation, deleteMutation } =
        useAdminArticles();

    const handleTogglePublish = (article: Article) => {
        const target =
            article.status === ArticleStatus.Published
                ? ArticleStatus.Draft
                : ArticleStatus.Published;
        updateMutation.mutate({
            slug: article.slug,
            data: toUpdateRequest(
                {
                    title: article.title,
                    slug: article.slug,
                    summary: article.summary ?? '',
                    tags: article.tags ?? [],
                    body: article.body,
                },
                article,
                target,
            ),
        });
    };

    const handleDelete = (article: Article) => {
        if (
            !window.confirm(
                `Delete the article “${article.title}”? This cannot be undone.`,
            )
        ) {
            return;
        }
        deleteMutation.mutate(article.slug);
    };

    const columns = useMemo<ColumnDef<Article, unknown>[]>(
        () => [
            {
                id: 'title',
                header: 'Title',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<Article, unknown>) => (
                    <Link
                        href={`/admin/articles/${encodeURIComponent(
                            info.row.original.slug,
                        )}/edit`}
                        className="font-medium underline"
                    >
                        {info.row.original.title}
                    </Link>
                ),
            },
            {
                id: 'slug',
                header: 'Slug',
                meta: {
                    headerClassName: 'text-left',
                    cellClassName: 'text-left',
                },
                cell: (info: CellContext<Article, unknown>) => (
                    <code className="text-xs">{info.row.original.slug}</code>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                cell: (info: CellContext<Article, unknown>) => (
                    <StatusPill status={info.row.original.status} />
                ),
            },
            {
                id: 'publishedAt',
                header: 'Published',
                cell: (info: CellContext<Article, unknown>) =>
                    formatDate(info.row.original.publishedAt),
            },
            {
                id: 'updatedAt',
                header: 'Updated',
                cell: (info: CellContext<Article, unknown>) =>
                    formatDate(info.row.original.updatedAt),
            },
            {
                id: 'actions',
                header: 'Actions',
                meta: {
                    headerClassName: 'text-right',
                    cellClassName: 'text-right',
                },
                cell: (info: CellContext<Article, unknown>) => {
                    const article = info.row.original;
                    const isPublished =
                        article.status === ArticleStatus.Published;
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs cursor-pointer bg-[var(--color-norwegian-100)] dark:bg-white/10 hover:bg-[var(--color-norwegian-200)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]"
                                onClick={() => handleTogglePublish(article)}
                                disabled={updateMutation.isPending}
                            >
                                {isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-[var(--color-white)] cursor-pointer bg-gradient-to-b from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-fjord-600)]"
                                onClick={() => handleDelete(article)}
                                disabled={deleteMutation.isPending}
                            >
                                Delete
                            </button>
                        </div>
                    );
                },
            },
        ],
        // Mutation pending flags drive disabled state; handlers are stable enough.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [updateMutation.isPending, deleteMutation.isPending],
    );

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <Link href="/admin/articles/new" className="btn btn--primary">
                    New article
                </Link>
            </div>

            {isError ? (
                <p role="alert" className="mb-4 text-sm text-red-600">
                    {error?.message ?? 'Failed to load articles.'}
                </p>
            ) : null}

            <Table
                data={articles}
                columns={columns}
                className="overflow-x-auto rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] shadow-sm ring-1 ring-[var(--tw-prose-td-borders)]"
                caption="Admin articles list"
            />
        </div>
    );
}
