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
