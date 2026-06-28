import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendInviteEmail } from '@/lib/email';
import { EMAIL_REGEX } from '@/lib/contact';

/** Maximum accepted request-body size (bytes) — coarse abuse guard. */
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

interface InvitePayload {
    email: string;
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/**
 * Supabase reports an already-registered email via a 422 with one of these
 * codes. We map those to a 409 Conflict.
 */
function isUserExistsError(error: { status?: number; code?: string }): boolean {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
        return true;
    }
    return error.status === 422;
}

/**
 * POST /api/admin/invites
 *
 * Body: `{ email }`. Creates an invited user via the service-role client and
 * generates an invite action link, then sends a branded invite email. Gated by
 * `requireAdmin()` BEFORE any service-role use.
 *
 * Degradation:
 *  - service-role unconfigured ⇒ 503.
 *  - Resend unconfigured/failed ⇒ the user is still created; the response sets
 *    `emailSent: false` and returns `inviteUrl` so the UI can surface it.
 *  - email already registered ⇒ 409.
 */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const admin = getAdminSupabase();
    if (!admin.ok) {
        return NextResponse.json(
            { error: 'Admin user management is not configured.' },
            { status: 503 },
        );
    }

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Request body too large.' },
            { status: 413 },
        );
    }

    let body: Partial<InvitePayload>;
    try {
        body = (await req.json()) as Partial<InvitePayload>;
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    const email = asString(body.email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json(
            {
                error: 'Validation failed.',
                fieldErrors: { email: 'A valid email address is required.' },
            },
            { status: 400 },
        );
    }

    let inviteUrl: string;
    let userId: string;
    try {
        const { data, error } = await admin.client.auth.admin.generateLink({
            type: 'invite',
            email,
        });

        if (error) {
            if (isUserExistsError(error)) {
                return NextResponse.json(
                    { error: 'A user with that email already exists.' },
                    { status: 409 },
                );
            }
            console.error('Admin: failed to generate invite link', {
                name: error.name,
            });
            return NextResponse.json(
                { error: 'Failed to create invite.' },
                { status: 502 },
            );
        }

        inviteUrl = data.properties.action_link;
        userId = data.user.id;
    } catch (e) {
        console.error('Admin: unexpected error creating invite', e);
        return NextResponse.json(
            { error: 'Failed to create invite.' },
            { status: 502 },
        );
    }

    // User created. Attempt to deliver the invite email; never fail the invite
    // just because email delivery is unconfigured — surface the link instead.
    const emailResult = await sendInviteEmail({ email, inviteUrl });

    return NextResponse.json(
        {
            id: userId,
            email,
            emailSent: emailResult.ok,
            // Always include the link so an admin can hand it off if email was
            // not delivered. The link is admin-only (this route is gated).
            inviteUrl,
        },
        { status: 201 },
    );
}
