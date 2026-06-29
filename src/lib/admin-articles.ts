/**
 * Shared helpers for the admin Articles API routes.
 *
 * Kept separate from the route handlers so they can be unit-tested without the
 * Next.js request store and reused across the create/update paths.
 */

/**
 * Detect the MCP server's "slug already exists" response. The generated Axios
 * client throws an error whose `response.status` is 400 on a duplicate slug.
 * We treat any 400 from create/update as a slug conflict because slug
 * uniqueness is the only client-correctable validation the API enforces on
 * these payloads (required fields are validated in the UI before submit).
 */
export function isSlugConflictError(e: unknown): boolean {
    const status = (e as { response?: { status?: unknown } })?.response?.status;
    return status === 400;
}

/**
 * Revalidate the public philosophy paths affected by an article mutation.
 *
 * Takes `revalidatePath` as a parameter so this stays free of the
 * `next/cache` import (which can only run inside the server runtime), making it
 * trivially unit-testable. Always revalidates the index plus the article's
 * slug page(s); when a slug changes on update, both the old and new slugs are
 * revalidated.
 */
export function revalidateArticlePaths(
    revalidatePath: (path: string) => void,
    slug: string,
    previousSlug?: string,
): void {
    revalidatePath('/philosophy');
    revalidatePath(`/philosophy/${slug}`);
    if (previousSlug && previousSlug !== slug) {
        revalidatePath(`/philosophy/${previousSlug}`);
    }
}
