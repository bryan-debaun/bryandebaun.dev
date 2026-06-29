'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Article } from '@bryandebaun/mcp-client';
import { ArticleStatus } from '@bryandebaun/mcp-client';
import ArticleBody from '@/components/ArticleBody';
import { useAdminArticles } from '@/lib/hooks/useAdminArticles';
import { ArticleFieldError } from '@/lib/repositories/articlesRepository';
import { slugify } from '@/lib/slug';
import {
    emptyArticleForm,
    formFromArticle,
    toCreateRequest,
    toUpdateRequest,
    validateArticleForm,
    type ArticleFormValues,
} from '@/lib/article-editor';

type Props = {
    mode: 'create' | 'edit';
    /** The existing article when editing. Undefined for the create flow. */
    article?: Article;
};

type FieldErrors = Partial<Record<'title' | 'slug' | 'body', string>>;

function normalise(s: string) {
    return s.trim().toLowerCase();
}

/**
 * Shared admin article editor: form fields + a Markdown body editor with a live
 * preview rendered via the SAME {@link ArticleBody} component the public page
 * uses, guaranteeing the preview matches the published render exactly.
 */
export default function ArticleEditor({ mode, article }: Props) {
    const router = useRouter();
    const { createMutation, updateMutation } = useAdminArticles();

    const [values, setValues] = useState<ArticleFormValues>(() =>
        article ? formFromArticle(article) : emptyArticleForm(),
    );
    // For create: keep the slug synced to the title until the user edits it.
    const [slugDirty, setSlugDirty] = useState(mode === 'edit');
    const [tagInput, setTagInput] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const currentStatus = article?.status ?? ArticleStatus.Draft;
    const isPublished = currentStatus === ArticleStatus.Published;

    const setField = <K extends keyof ArticleFormValues>(
        key: K,
        value: ArticleFormValues[K],
    ) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleTitleChange = (title: string) => {
        setValues((prev) => ({
            ...prev,
            title,
            slug: slugDirty ? prev.slug : slugify(title),
        }));
    };

    const handleSlugChange = (slug: string) => {
        setSlugDirty(true);
        setField('slug', slug);
    };

    function commitTag(raw: string) {
        const tag = raw.trim();
        if (!tag) return;
        if (values.tags.some((t) => normalise(t) === normalise(tag))) {
            setTagInput('');
            return;
        }
        setValues((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
        setTagInput('');
        tagInputRef.current?.focus();
    }

    function removeTag(index: number) {
        setValues((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitTag(tagInput);
        }
        if (e.key === 'Backspace' && tagInput === '' && values.tags.length > 0) {
            removeTag(values.tags.length - 1);
        }
    }

    async function save(targetStatus: ArticleStatus) {
        setFormError(null);
        setFieldErrors({});

        // Commit any in-progress tag input before validating/submitting.
        const pendingTag = tagInput.trim();
        const submitValues: ArticleFormValues = pendingTag
            ? {
                  ...values,
                  tags: values.tags.some(
                      (t) => normalise(t) === normalise(pendingTag),
                  )
                      ? values.tags
                      : [...values.tags, pendingTag],
              }
            : values;

        const validation = validateArticleForm(submitValues);
        if (!validation.ok) {
            setFieldErrors(validation.errors);
            return;
        }

        try {
            if (mode === 'create') {
                await createMutation.mutateAsync(
                    toCreateRequest(submitValues, targetStatus),
                );
            } else if (article) {
                await updateMutation.mutateAsync({
                    slug: article.slug,
                    data: toUpdateRequest(
                        submitValues,
                        article,
                        targetStatus,
                    ),
                });
            }
            router.push('/admin/articles');
            router.refresh();
        } catch (err) {
            if (err instanceof ArticleFieldError) {
                setFieldErrors(err.fieldErrors as FieldErrors);
                return;
            }
            setFormError(
                (err as Error).message ?? 'Failed to save the article.',
            );
        }
    }

    const previewBody = useMemo(() => values.body, [values.body]);

    return (
        <div className="space-y-6">
            <form
                onSubmit={(e) => e.preventDefault()}
                className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                aria-label={mode === 'create' ? 'New article' : 'Edit article'}
            >
                {/* Left column: form fields + Markdown body */}
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="article-title"
                            className="block text-sm font-medium"
                        >
                            Title{' '}
                            <span className="text-red-500" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <input
                            id="article-title"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={values.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            aria-invalid={Boolean(fieldErrors.title)}
                        />
                        {fieldErrors.title ? (
                            <p className="mt-1 text-xs text-red-600" role="alert">
                                {fieldErrors.title}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="article-slug"
                            className="block text-sm font-medium"
                        >
                            Slug{' '}
                            <span className="text-red-500" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <input
                            id="article-slug"
                            type="text"
                            className="mt-1 w-full form-input"
                            value={values.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            aria-invalid={Boolean(fieldErrors.slug)}
                            autoComplete="off"
                        />
                        <p className="mt-1 text-xs text-[var(--color-norwegian-500)] dark:text-[var(--color-norwegian-400)]">
                            Lives at <code>/philosophy/{values.slug || '…'}</code>
                        </p>
                        {fieldErrors.slug ? (
                            <p className="mt-1 text-xs text-red-600" role="alert">
                                {fieldErrors.slug}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="article-summary"
                            className="block text-sm font-medium"
                        >
                            Summary
                        </label>
                        <textarea
                            id="article-summary"
                            className="mt-1 w-full form-input"
                            rows={2}
                            value={values.summary}
                            onChange={(e) => setField('summary', e.target.value)}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="article-tag-input"
                            className="block text-sm font-medium mb-1"
                        >
                            Tags
                        </label>
                        {values.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {values.tags.map((tag, i) => (
                                    <span
                                        key={`${tag}-${i}`}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--btn-accent)]/15 text-[var(--color-norwegian-700)] dark:text-[var(--tw-prose-invert-body)] border border-[var(--btn-accent)]/30"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            aria-label={`Remove ${tag}`}
                                            className="leading-none hover:text-red-500 cursor-pointer"
                                            onClick={() => removeTag(i)}
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        <input
                            id="article-tag-input"
                            ref={tagInputRef}
                            type="text"
                            className="w-full form-input"
                            placeholder="Type a tag and press Enter or comma"
                            value={tagInput}
                            autoComplete="off"
                            onChange={(e) => setTagInput(e.target.value)}
                            onBlur={() => commitTag(tagInput)}
                            onKeyDown={handleTagKeyDown}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="article-body"
                            className="block text-sm font-medium"
                        >
                            Body (Markdown){' '}
                            <span className="text-red-500" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <textarea
                            id="article-body"
                            className="mt-1 w-full form-input font-mono text-sm"
                            rows={20}
                            value={values.body}
                            onChange={(e) => setField('body', e.target.value)}
                            aria-invalid={Boolean(fieldErrors.body)}
                            spellCheck
                        />
                        {fieldErrors.body ? (
                            <p className="mt-1 text-xs text-red-600" role="alert">
                                {fieldErrors.body}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Right column: live preview via the public ArticleBody */}
                <div>
                    <p className="block text-sm font-medium mb-1">Preview</p>
                    <div className="rounded-lg border border-[var(--tw-prose-td-borders)] dark:border-[var(--tw-prose-invert-td-borders)] bg-[var(--background)] p-4 max-h-[40rem] overflow-y-auto">
                        {values.title ? (
                            <h1 className="text-center text-2xl font-semibold mb-4">
                                {values.title}
                            </h1>
                        ) : null}
                        <ArticleBody body={previewBody} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-norwegian-500)] dark:text-[var(--color-norwegian-400)]">
                        Rendered with the same component as the public article
                        page.
                    </p>
                </div>
            </form>

            {formError ? (
                <p role="alert" className="text-sm text-red-600">
                    {formError}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--tw-prose-td-borders)] pt-4">
                <button
                    type="button"
                    className="btn btn--primary"
                    disabled={isSaving}
                    onClick={() => save(ArticleStatus.Draft)}
                >
                    {isSaving ? 'Saving…' : 'Save as draft'}
                </button>

                {isPublished ? (
                    <>
                        <button
                            type="button"
                            className="btn btn--primary"
                            disabled={isSaving}
                            onClick={() => save(ArticleStatus.Published)}
                        >
                            Save (published)
                        </button>
                        <button
                            type="button"
                            className="btn"
                            disabled={isSaving}
                            onClick={() => save(ArticleStatus.Draft)}
                        >
                            Unpublish
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="btn btn--primary"
                        disabled={isSaving}
                        onClick={() => save(ArticleStatus.Published)}
                    >
                        Publish
                    </button>
                )}

                <button
                    type="button"
                    className="btn"
                    disabled={isSaving}
                    onClick={() => router.push('/admin/articles')}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
