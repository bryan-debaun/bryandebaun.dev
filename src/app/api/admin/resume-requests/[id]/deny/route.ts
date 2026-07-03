import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { createClient } from '@/lib/supabase/server';
import { denyResumeRequest } from '@/lib/services/resume-requests';

/** Maximum accepted request-body size (bytes) — coarse abuse guard. */
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

/** Maximum length of the optional internal admin note. */
const MAX_NOTE_LENGTH = 1000;

interface NotePayload {
    note?: unknown;
}

type RouteContext = {
    params: { id: string } | Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/resume-requests/[id]/deny
 *
 * Denies a pending request (admin-only). Accepts an optional `{ note? }`
 * internal admin note (ADR 0007 Phase 2). No email is sent on denial — the
 * requester simply won't receive a link.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Request body too large.' },
            { status: 413 },
        );
    }

    let note: string | undefined;
    try {
        const raw = await req.text();
        if (raw.trim()) {
            const body = JSON.parse(raw) as NotePayload;
            if (typeof body.note === 'string') {
                note = body.note.trim().slice(0, MAX_NOTE_LENGTH) || undefined;
            }
        }
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const { id } = await context.params;

    try {
        const updated = await denyResumeRequest(session?.access_token, id, {
            adminNote: note,
        });
        return NextResponse.json({ request: updated });
    } catch (e) {
        console.error('Admin: failed to deny résumé request', e);
        return NextResponse.json(
            { error: 'Failed to deny request' },
            { status: 502 },
        );
    }
}
