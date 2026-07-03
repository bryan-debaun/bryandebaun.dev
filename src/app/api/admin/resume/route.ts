import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { createClient } from '@/lib/supabase/server';
import { getFullResume, updateResume } from '@/lib/services/resume';
import type { Resume } from '@/lib/resume';

/**
 * Admin résumé content API (ADR 0007 Phase 3).
 *
 * GET  → the FULL résumé (incl. private contact) so the editor can load it.
 * PUT  → validate + replace the singleton, forwarding the admin's Supabase JWT
 *        to the MCP server, then revalidate the public + gated résumé paths.
 *
 * Mirrors the articles admin routes: `requireAdmin` gate, JWT passthrough via
 * `getSession()`, 400 with `fieldErrors` on validation failure, 502 on backend
 * failure.
 */

/** Reject absurdly large bodies before parsing/forwarding (mirrors articles). */
const MAX_BODY_BYTES = 64 * 1024;

type FieldErrors = Record<string, string>;

/**
 * Validate an untrusted body as a {@link Resume}. Returns the typed résumé, or a
 * map of field errors. Enforces a non-empty `basics.name` and that the four
 * collection fields are arrays (defaulting missing ones to `[]`).
 */
function validateResume(
    body: unknown,
): { ok: true; resume: Resume } | { ok: false; fieldErrors: FieldErrors } {
    const fieldErrors: FieldErrors = {};

    if (typeof body !== 'object' || body === null) {
        return { ok: false, fieldErrors: { form: 'Invalid résumé payload.' } };
    }

    const doc = body as Record<string, unknown>;
    const basics = doc.basics as Record<string, unknown> | undefined;

    if (
        !basics ||
        typeof basics.name !== 'string' ||
        basics.name.trim() === ''
    ) {
        fieldErrors['basics.name'] = 'Name is required.';
    }

    for (const key of ['work', 'education', 'skills', 'projects'] as const) {
        if (doc[key] !== undefined && !Array.isArray(doc[key])) {
            fieldErrors[key] = `${key} must be a list.`;
        }
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, fieldErrors };
    }

    // Normalise: ensure the collection fields are always present as arrays so
    // the render path (which indexes them) never sees `undefined`. `body` is
    // `unknown`, so the single cast to `Resume` needs no intermediate `unknown`.
    const base = body as Resume;
    const resume: Resume = {
        ...base,
        work: base.work ?? [],
        education: base.education ?? [],
        skills: base.skills ?? [],
        projects: base.projects ?? [],
    };
    return { ok: true, resume };
}

/**
 * GET /api/admin/resume — the full résumé (incl. private contact) for the editor.
 */
export async function GET() {
    const guard = await requireAdmin();
    if (guard) return guard;

    const resume = await getFullResume();
    if (!resume) {
        return NextResponse.json(
            { error: 'Failed to load résumé' },
            { status: 502 },
        );
    }
    return NextResponse.json({ resume });
}

/**
 * PUT /api/admin/resume — validate + replace the singleton résumé, then
 * revalidate `/resume` and `/resume/full`.
 */
export async function PUT(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Résumé payload too large.' },
            { status: 413 },
        );
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { fieldErrors: { form: 'Invalid JSON body.' } },
            { status: 400 },
        );
    }

    // Guard oversized bodies even when Content-Length is absent/unreliable.
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Résumé payload too large.' },
            { status: 413 },
        );
    }

    const validation = validateResume(body);
    if (!validation.ok) {
        return NextResponse.json(
            { fieldErrors: validation.fieldErrors },
            { status: 400 },
        );
    }

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    try {
        const updated = await updateResume(
            session?.access_token,
            validation.resume,
        );
        revalidatePath('/resume');
        revalidatePath('/resume/full');
        return NextResponse.json({ resume: updated });
    } catch (e) {
        console.error('Admin: failed to update résumé', e);
        return NextResponse.json(
            { error: 'Failed to update résumé' },
            { status: 502 },
        );
    }
}
