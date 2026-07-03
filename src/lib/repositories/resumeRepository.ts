import type { Resume } from '@/lib/resume';

/**
 * Client-side repository for the admin résumé editor. Talks to the admin API
 * route (`/api/admin/resume`), which enforces auth + forwards the Supabase JWT
 * and MCP gateway key to the MCP server. Never calls the MCP server directly —
 * that would leak secrets to the browser. Mirrors `articlesRepository`.
 */

/**
 * Error carrying per-field validation messages from the admin résumé API (e.g.
 * a missing `basics.name` 400). The editor surfaces these inline.
 */
export class ResumeContentError extends Error {
    readonly fieldErrors: Record<string, string>;
    constructor(message: string, fieldErrors: Record<string, string> = {}) {
        super(message);
        this.name = 'ResumeContentError';
        this.fieldErrors = fieldErrors;
    }
}

async function parseError(res: Response): Promise<never> {
    const data = (await res.json().catch(() => null)) as {
        fieldErrors?: Record<string, string>;
        error?: string;
    } | null;
    if (data?.fieldErrors) {
        throw new ResumeContentError('Validation failed', data.fieldErrors);
    }
    throw new ResumeContentError(
        data?.error ?? `Request failed: ${res.status}`,
    );
}

/** Fetch the FULL résumé (incl. private contact) for the editor. Admin-only. */
export async function getAdminResume(): Promise<Resume> {
    const res = await fetch('/api/admin/resume');
    if (!res.ok) {
        return parseError(res);
    }
    const data = (await res.json()) as { resume: Resume };
    return data.resume;
}

/** Replace the résumé. Throws {@link ResumeContentError} on validation failure. */
export async function updateResume(doc: Resume): Promise<Resume> {
    const res = await fetch('/api/admin/resume', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc),
    });
    if (!res.ok) {
        return parseError(res);
    }
    const data = (await res.json()) as { resume: Resume };
    return data.resume;
}
