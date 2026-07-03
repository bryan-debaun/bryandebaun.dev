import type {
    ListResumeDownloadRequestsResponse,
    ResumeDownloadReadStatus,
    ResumeDownloadRequest,
} from '@bryandebaun/mcp-client';

/**
 * Client-side repository for the gated-résumé request flow (ADR 0007 Phase 2).
 * Talks to the app's own API routes (which enforce auth + forward the Supabase
 * JWT and MCP gateway key). Never calls the MCP server directly — that would
 * leak secrets to the browser.
 */

/** Error carrying the server-provided message so the UI can surface it inline. */
export class ResumeRequestError extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ResumeRequestError';
        this.status = status;
    }
}

async function messageFrom(res: Response): Promise<string> {
    const data = (await res.json().catch(() => null)) as {
        error?: string;
    } | null;
    return data?.error ?? `Request failed: ${res.status}`;
}

/**
 * Submit a résumé-download request for the signed-in user. Throws
 * {@link ResumeRequestError} on failure — notably a 429 for the quota limit and
 * a 403 for an unverified email, both carrying a friendly server message.
 */
export async function createResumeRequest(input: {
    reason?: string;
}): Promise<ResumeDownloadRequest> {
    const res = await fetch('/api/resume-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: input.reason }),
    });
    if (!res.ok) {
        throw new ResumeRequestError(await messageFrom(res), res.status);
    }
    return (await res.json()) as ResumeDownloadRequest;
}

/** Fetch résumé-download requests for the admin UI (optionally by status). */
export async function listResumeRequests(
    status?: ResumeDownloadReadStatus,
): Promise<ListResumeDownloadRequestsResponse> {
    const url = status
        ? `/api/admin/resume-requests?status=${encodeURIComponent(status)}`
        : '/api/admin/resume-requests';
    const res = await fetch(url);
    if (!res.ok) {
        throw new ResumeRequestError(await messageFrom(res), res.status);
    }
    return (await res.json()) as ListResumeDownloadRequestsResponse;
}

/** Approve a pending request (admin). Returns the updated request. */
export async function approveResumeRequest(
    id: string,
    note?: string,
): Promise<ResumeDownloadRequest> {
    const res = await fetch(
        `/api/admin/resume-requests/${encodeURIComponent(id)}/approve`,
        {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ note }),
        },
    );
    if (!res.ok) {
        throw new ResumeRequestError(await messageFrom(res), res.status);
    }
    const data = (await res.json()) as {
        request: ResumeDownloadRequest;
        emailSent?: boolean;
    };
    return data.request;
}

/** Deny a pending request (admin). Returns the updated request. */
export async function denyResumeRequest(
    id: string,
    note?: string,
): Promise<ResumeDownloadRequest> {
    const res = await fetch(
        `/api/admin/resume-requests/${encodeURIComponent(id)}/deny`,
        {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ note }),
        },
    );
    if (!res.ok) {
        throw new ResumeRequestError(await messageFrom(res), res.status);
    }
    const data = (await res.json()) as { request: ResumeDownloadRequest };
    return data.request;
}
