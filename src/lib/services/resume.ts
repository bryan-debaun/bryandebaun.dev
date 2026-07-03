import type { ResumeDocument, ResumeResponse } from '@bryandebaun/mcp-client';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import type { Resume } from '@/lib/resume';

/**
 * Server-side résumé service (ADR 0007 Phase 3).
 *
 * The résumé CONTENT now lives in the MCP `Resume` singleton (not the retired
 * `src/data/resume.json`). This module is the single server-side boundary
 * between the loosely-typed generated `ResumeDocument` and the frontend's
 * authoritative {@link Resume} type — every cast lives here.
 *
 * Privacy (ADR 0007): the public `getResume()` endpoint STRIPS
 * `basics.privateContact`, so {@link getPublicResume} can never surface email or
 * phone even in principle. Only {@link getFullResume} (admin / server-to-server
 * API key) carries the private contact fields, and only the gated `/resume/full`
 * render consumes it.
 */

/** Unwrap the `{ document }` envelope the MCP résumé endpoints return. */
function toResume(res: unknown): Resume {
    const payload = unwrapApiResponse<ResumeResponse>(res);
    // `ResumeDocument` is loosely typed (index signatures); the frontend
    // `Resume` type is authoritative, so we cast at this single boundary.
    return payload.document as Resume;
}

/**
 * Fetch the PUBLIC résumé (private contact fields already stripped server-side).
 *
 * Mirrors the articles service's graceful reads: returns `null` if the MCP API
 * is unreachable so `/resume` can degrade to a friendly message instead of
 * hard-crashing the ISR render.
 */
export async function getPublicResume(): Promise<Resume | null> {
    try {
        const api = createApi();
        const res = await api.api.getResume();
        return toResume(res);
    } catch (e) {
        console.error('getPublicResume failed; returning null', e);
        return null;
    }
}

/**
 * Fetch the FULL résumé including `basics.privateContact` (email + phone). Uses
 * the server-to-server API key. This feeds the gated `/resume/full` render and
 * the admin editor's initial load — NEVER a public surface.
 *
 * Graceful `null` on failure, mirroring {@link getPublicResume}.
 */
export async function getFullResume(): Promise<Resume | null> {
    try {
        const api = createApi();
        const res = await api.api.getResumeFull();
        return toResume(res);
    } catch (e) {
        console.error('getFullResume failed; returning null', e);
        return null;
    }
}

/**
 * Replace the singleton résumé document (admin only). Forwards the caller's
 * Supabase JWT so the MCP server authorises the write. Errors propagate — the
 * admin route maps them to HTTP responses.
 */
export async function updateResume(
    token: string | undefined,
    doc: Resume,
): Promise<Resume> {
    const api = createApi(token);
    // `Resume` is structurally compatible with the open-ended `ResumeDocument`.
    const res = await api.api.putResume(doc as ResumeDocument);
    return toResume(res);
}
