import type {
    AdminNoteBody,
    CreateResumeDownloadRequestBody,
    ListResumeDownloadRequestsResponse,
    ResumeDownloadReadStatus,
    ResumeDownloadRequest,
} from '@bryandebaun/mcp-client';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';

export type {
    ListResumeDownloadRequestsResponse,
    ResumeDownloadReadStatus,
    ResumeDownloadRequest,
} from '@bryandebaun/mcp-client';

/**
 * Thin server-side wrappers over the MCP `ResumeDownloadRequests` resource used
 * by the `/api/(admin)/resume-requests` routes (ADR 0007 Phase 2).
 *
 * Auth model (see `src/lib/mcp.ts`):
 *  - `createResumeRequest` is a USER-scoped write — pass the requester's Supabase
 *    JWT so the backend records the request against their identity and enforces
 *    the per-user 3-per-30-day quota.
 *  - the list/approve/deny calls are ADMIN-scoped — pass the admin's Supabase JWT
 *    (the routes gate on `requireAdmin` first).
 *
 * These wrappers intentionally do NOT swallow errors: the routes need to map a
 * backend quota rejection (429) to a friendly message and other failures to a
 * 502, so they let the underlying rejection propagate.
 */

/** Create a résumé-download request for the authenticated caller. */
export async function createResumeRequest(
    token: string | undefined,
    body: CreateResumeDownloadRequestBody,
): Promise<ResumeDownloadRequest> {
    const api = createApi(token);
    const res = await api.api.createRequest(body);
    return unwrapApiResponse<ResumeDownloadRequest>(res);
}

/** List résumé-download requests (admin), optionally filtered by status. */
export async function listResumeRequests(
    token: string | undefined,
    status?: ResumeDownloadReadStatus,
): Promise<ListResumeDownloadRequestsResponse> {
    const api = createApi(token);
    const res = await api.api.listRequests(status ? { status } : undefined);
    return unwrapApiResponse<ListResumeDownloadRequestsResponse>(res);
}

/** Approve a pending request (admin). */
export async function approveResumeRequest(
    token: string | undefined,
    id: string,
    body: AdminNoteBody,
): Promise<ResumeDownloadRequest> {
    const api = createApi(token);
    const res = await api.api.approveRequest(id, body);
    return unwrapApiResponse<ResumeDownloadRequest>(res);
}

/** Deny a pending request (admin). */
export async function denyResumeRequest(
    token: string | undefined,
    id: string,
    body: AdminNoteBody,
): Promise<ResumeDownloadRequest> {
    const api = createApi(token);
    const res = await api.api.denyRequest(id, body);
    return unwrapApiResponse<ResumeDownloadRequest>(res);
}

export type RecordDownloadResult =
    | { ok: true; request: ResumeDownloadRequest }
    | { ok: false; reason: 'denied' | 'error' };

/**
 * Record a download against an approved request and enforce the per-approval
 * cap (#145). Server-to-server (API-key, no user token) — the public download
 * route calls this before serving the PDF; the backend atomically increments
 * `downloadCount` and flips `status` to `fulfilled` once the cap is hit.
 *
 * Returns a discriminated result rather than throwing:
 *  - `denied` — the request is no longer serviceable (at cap, expired, denied,
 *    or not found): any 4xx. The caller should refuse the download.
 *  - `error` — a transient/server failure (5xx/network): the caller should
 *    surface a retryable error and NOT serve, so downloads are only ever served
 *    when they were successfully recorded.
 */
export async function recordResumeDownload(
    id: string,
): Promise<RecordDownloadResult> {
    try {
        const api = createApi();
        const res = await api.api.recordDownload(id);
        return {
            ok: true,
            request: unwrapApiResponse<ResumeDownloadRequest>(res),
        };
    } catch (e) {
        const status = (e as { response?: { status?: number } })?.response
            ?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
            return { ok: false, reason: 'denied' };
        }
        return { ok: false, reason: 'error' };
    }
}
