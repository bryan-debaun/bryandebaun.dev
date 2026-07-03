import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { createClient } from '@/lib/supabase/server';
import { approveResumeRequest } from '@/lib/services/resume-requests';
import { sendResumeApprovalEmail } from '@/lib/email';
import { signResumeDownloadLink } from '@/lib/resume-download';

/** Maximum accepted request-body size (bytes) — coarse abuse guard. */
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

/** Maximum length of the optional internal admin note. */
const MAX_NOTE_LENGTH = 1000;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

interface NotePayload {
    note?: unknown;
}

type RouteContext = {
    params: { id: string } | Promise<{ id: string }>;
};

/** Parse an optional `{ note? }` body, tolerating an empty request body. */
async function readNote(
    req: NextRequest,
): Promise<
    { ok: true; note?: string } | { ok: false; response: NextResponse }
> {
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Request body too large.' },
                { status: 413 },
            ),
        };
    }

    try {
        const raw = await req.text();
        if (!raw.trim()) return { ok: true };
        const body = JSON.parse(raw) as NotePayload;
        if (typeof body.note !== 'string') return { ok: true };
        const note = body.note.trim().slice(0, MAX_NOTE_LENGTH);
        return { ok: true, note: note || undefined };
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Invalid JSON body.' },
                { status: 400 },
            ),
        };
    }
}

/**
 * PATCH /api/admin/resume-requests/[id]/approve
 *
 * Approves a pending request (admin-only), then best-effort emails the approved
 * requester a signed, time-limited download link built from the returned `id`
 * and `expiresAt` (ADR 0007 Phase 2). Mirrors the invites route: if the email
 * can't be sent, the approval still succeeds and the response carries
 * `emailSent: false`.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const parsed = await readNote(req);
    if (!parsed.ok) return parsed.response;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const { id } = await context.params;

    let updated: Awaited<ReturnType<typeof approveResumeRequest>>;
    try {
        updated = await approveResumeRequest(session?.access_token, id, {
            adminNote: parsed.note,
        });
    } catch (e) {
        console.error('Admin: failed to approve résumé request', e);
        return NextResponse.json(
            { error: 'Failed to approve request' },
            { status: 502 },
        );
    }

    // Best-effort delivery of the signed download link. Never fail the approval
    // just because email delivery is unconfigured or the link can't be signed.
    let emailSent = false;
    const token = updated.expiresAt
        ? signResumeDownloadLink({
              requestId: updated.id,
              expiresAt: updated.expiresAt,
          })
        : '';
    if (token && updated.expiresAt) {
        const downloadUrl = `${SITE_URL}/api/resume/download?t=${encodeURIComponent(token)}`;
        const result = await sendResumeApprovalEmail({
            to: updated.userEmail,
            downloadUrl,
            expiresAt: updated.expiresAt,
        });
        emailSent = result.ok;
    } else {
        console.warn(
            'Admin: approved résumé request without a signable download link (missing expiresAt or RESUME_DOWNLOAD_SECRET); skipping email.',
        );
    }

    return NextResponse.json({ request: updated, emailSent });
}
