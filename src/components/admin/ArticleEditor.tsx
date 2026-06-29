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

/** Allowed image MIME types for upload (mirrors the server allowlist). */
const ACCEPTED_IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
]);

/**
 * Derive a human-readable alt text from an uploaded filename: drop the
 * extension and any directory parts, then turn separators into spaces.
 */
function altFromFilename(filename: string): string {
    const base = filename.split(/[\\/]/).pop() ?? filename;
    const noExt = base.replace(/\.[^.]+$/, '');
    return noExt.replace(/[-_]+/g, ' ').trim();
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
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    /**
     * Insert a Markdown image at the body textarea's caret (or append at the
     * end with surrounding newlines when the caret position is unknown), then
     * refocus the textarea with the caret after the inserted snippet.
     */
    function insertImageMarkdown(url: string, alt: string) {
        const snippet = `![${alt}](${url})`;
        const textarea = bodyRef.current;

        setValues((prev) => {
            const body = prev.body;
            const hasSelection =
                textarea !== null &&
                typeof textarea.selectionStart === 'number' &&
                typeof textarea.selectionEnd === 'number';

            if (!hasSelection) {
                const prefix =
                    body.length > 0 && !body.endsWith('\n') ? '\n' : '';
                const nextBody = `${body}${prefix}${snippet}\n`;
                return { ...prev, body: nextBody };
            }

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const nextBody = body.slice(0, start) + snippet + body.slice(end);

            // Restore focus + caret after React commits the new value.
            const caret = start + snippet.length;
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(caret, caret);
            });

            return { ...prev, body: nextBody };
        });
    }

    async function uploadImage(file: File) {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            setUploadError(
                'Unsupported image type. Use PNG, JPEG, WebP, GIF, AVIF, or SVG.',
            );
            return;
        }

        setUploadError(null);
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const json = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !json.url) {
                setUploadError(json.error ?? 'Failed to upload image.');
                return;
            }
            insertImageMarkdown(json.url, altFromFilename(file.name));
        } catch {
            setUploadError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        // Reset so selecting the same file again re-triggers change.
        e.target.value = '';
        if (file) void uploadImage(file);
    }

    function handleBodyDrop(e: React.DragEvent<HTMLTextAreaElement>) {
        const file = Array.from(e.dataTransfer.files).find((f) =>
            f.type.startsWith('image/'),
        );
        if (file) {
            e.preventDefault();
            void uploadImage(file);
        }
    }

    function handleBodyPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
        const item = Array.from(e.clipboardData.items).find((i) =>
            i.type.startsWith('image/'),
        );
        const file = item?.getAsFile();
        if (file) {
            e.preventDefault();
            void uploadImage(file);
        }
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
                        <div className="flex items-center justify-between gap-2">
                            <label
                                htmlFor="article-body"
                                className="block text-sm font-medium"
                            >
                                Body (Markdown){' '}
                                <span
                                    className="text-red-500"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <button
                                type="button"
                                className="btn btn--outline min-h-0 px-3 py-1 text-xs"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? 'Uploading…' : 'Upload image'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        <textarea
                            id="article-body"
                            ref={bodyRef}
                            className="mt-1 w-full form-input font-mono text-sm"
                            rows={20}
                            value={values.body}
                            onChange={(e) => setField('body', e.target.value)}
                            onDrop={handleBodyDrop}
                            onPaste={handleBodyPaste}
                            aria-invalid={Boolean(fieldErrors.body)}
                            spellCheck
                        />
                        <p className="mt-1 text-xs text-[var(--color-norwegian-500)] dark:text-[var(--color-norwegian-400)]">
                            Upload, drag-and-drop, or paste an image to insert
                            it at the cursor.
                        </p>
                        {uploadError ? (
                            <p
                                className="mt-1 text-xs text-red-600"
                                role="alert"
                            >
                                {uploadError}
                            </p>
                        ) : null}
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
