import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResumeRequest } from '@/lib/services/resume-requests';

/** Maximum accepted request-body size (bytes) — coarse abuse guard. */
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

/** Maximum length of the optional free-text reason. */
const MAX_REASON_LENGTH = 500;

/** Friendly copy for the per-user quota (ADR 0007: 3 requests / 30 days). */
const QUOTA_MESSAGE =
    "You've reached the limit of 3 requests per 30 days. Please try again later.";

interface CreatePayload {
    reason?: unknown;
}

/** Read an HTTP status off an Axios-style rejection from the MCP client. */
function statusOf(e: unknown): number | undefined {
    const status = (e as { response?: { status?: unknown } })?.response?.status;
    return typeof status === 'number' ? status : undefined;
}

/**
 * POST /api/resume-requests
 *
 * Creates a gated-résumé download request for the CURRENTLY authenticated,
 * email-verified user (ADR 0007 Phase 2). This route is for authenticated
 * NON-admin users, so it does not use `requireAdmin` — it authenticates with
 * `supabase.auth.getUser()` and forwards the caller's JWT to the MCP server,
 * which records the request against their identity and enforces the quota.
 *
 * Gates:
 *  - no session ⇒ 401.
 *  - unverified email ⇒ 403 ("confirm your email").
 *  - backend quota rejection (429 / 4xx) ⇒ friendly 429.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'You must be signed in to request the full résumé.' },
            { status: 401 },
        );
    }

    // Supabase records email verification in `email_confirmed_at` (and, for some
    // flows, `confirmed_at`). Require at least one to be set.
    const confirmedAt =
        (user as { email_confirmed_at?: string | null }).email_confirmed_at ??
        (user as { confirmed_at?: string | null }).confirmed_at;
    if (!confirmedAt) {
        return NextResponse.json(
            {
                error: 'Please confirm your email address before requesting the full résumé.',
            },
            { status: 403 },
        );
    }

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Request body too large.' },
            { status: 413 },
        );
    }

    // Body is optional; tolerate an empty body.
    let body: CreatePayload = {};
    try {
        const raw = await req.text();
        if (raw.trim()) body = JSON.parse(raw) as CreatePayload;
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    let reason: string | undefined;
    if (typeof body.reason === 'string') {
        const trimmed = body.reason.trim();
        if (trimmed.length > MAX_REASON_LENGTH) {
            return NextResponse.json(
                {
                    error: 'Validation failed.',
                    fieldErrors: {
                        reason: `Please keep your note under ${MAX_REASON_LENGTH} characters.`,
                    },
                },
                { status: 400 },
            );
        }
        if (trimmed) reason = trimmed;
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    try {
        const created = await createResumeRequest(session?.access_token, {
            reason,
        });
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        const status = statusOf(e);
        if (status === 401) {
            // The Supabase JWT expired between our getUser() check and the MCP
            // call — an auth problem, not a quota one.
            return NextResponse.json(
                { error: 'Your session has expired. Please sign in again.' },
                { status: 401 },
            );
        }
        if (status === 429) {
            return NextResponse.json({ error: QUOTA_MESSAGE }, { status: 429 });
        }
        // The only body field is an optional reason (already length-validated
        // here), so any remaining client-side (4xx) rejection from the backend is
        // the per-user quota guard — surface the friendly quota message.
        if (status && status >= 400 && status < 500) {
            return NextResponse.json({ error: QUOTA_MESSAGE }, { status: 429 });
        }
        console.error('Failed to create résumé download request', e);
        return NextResponse.json(
            { error: 'Failed to submit your request. Please try again later.' },
            { status: 502 },
        );
    }
}
