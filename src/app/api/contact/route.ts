import {
    EMAIL_REGEX,
    MESSAGE_MAX,
    MESSAGE_MIN,
    NAME_MAX,
    NAME_MIN,
} from '@/lib/contact';
import { sendContactEmail } from '@/lib/email';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Maximum accepted request-body size (bytes). A generous ceiling that still
 * rejects absurdly large payloads cheaply, before parsing/validation.
 *
 * NOTE: This is a coarse abuse guard, not a rate limiter. A proper per-IP rate
 * limiter (e.g. Vercel KV / Upstash `@upstash/ratelimit`) would slot in at the
 * top of this handler — read the client IP from `x-forwarded-for`, check the
 * limiter, and short-circuit with a 429 before doing any work.
 */
const MAX_BODY_BYTES = 100 * 1024; // 100 KB

interface FieldErrors {
    name?: string;
    email?: string;
    message?: string;
}

interface ContactPayload {
    name: string;
    email: string;
    message: string;
    /** Honeypot — must remain empty for a legitimate submission. */
    company: string;
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

export async function POST(req: NextRequest) {
    // --- Abuse guard: reject absurdly large bodies before parsing. ---
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json(
            { error: 'Request body too large.' },
            { status: 413 },
        );
    }

    let body: Partial<ContactPayload>;
    try {
        body = (await req.json()) as Partial<ContactPayload>;
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body.' },
            { status: 400 },
        );
    }

    // --- Honeypot: if the hidden field is filled, silently pretend success. ---
    const honeypot = asString(body.company).trim();
    if (honeypot.length > 0) {
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    const name = asString(body.name).trim();
    const email = asString(body.email).trim();
    const message = asString(body.message).trim();

    // --- Server-side validation (source of truth). ---
    const fieldErrors: FieldErrors = {};
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
        fieldErrors.name = `Name must be ${NAME_MIN}–${NAME_MAX} characters.`;
    }
    if (!EMAIL_REGEX.test(email)) {
        fieldErrors.email = 'A valid email address is required.';
    }
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
        fieldErrors.message = `Message must be ${MESSAGE_MIN}–${MESSAGE_MAX} characters.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
            { error: 'Validation failed.', fieldErrors },
            { status: 400 },
        );
    }

    // --- Deliver. ---
    const result = await sendContactEmail({ name, email, message });

    if (result.ok) {
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (result.reason === 'unconfigured') {
        return NextResponse.json(
            { error: 'Email delivery is not configured.' },
            { status: 503 },
        );
    }

    // send_failed
    return NextResponse.json(
        { error: 'Failed to send your message. Please try again later.' },
        { status: 502 },
    );
}
