import { Resend } from 'resend';

/**
 * Input for a contact-form submission. All fields are assumed to have already
 * been validated/trimmed by the caller (see the contact API route).
 */
export interface ContactEmailInput {
    name: string;
    email: string;
    message: string;
}

/**
 * Discriminated result of an attempt to send a contact email.
 *
 * - `ok: true` — the message was handed off to Resend.
 * - `reason: 'unconfigured'` — required env vars are missing; nothing was sent.
 *   The caller should map this to a 503 (delivery not configured).
 * - `reason: 'send_failed'` — Resend rejected/failed the send; map to a 502.
 */
export type SendContactResult =
    | { ok: true }
    | { ok: false; reason: 'unconfigured' | 'send_failed'; detail?: string };

interface ResendConfig {
    apiKey: string;
    toEmail: string;
    fromEmail: string;
}

/**
 * Read and validate the Resend configuration from the environment. Returns
 * `null` when any required value is missing so callers can degrade gracefully
 * rather than crash. Secrets themselves are never returned to logs.
 */
function readResendConfig(): ResendConfig | null {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
    const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();

    if (!apiKey || !toEmail || !fromEmail) {
        return null;
    }

    return { apiKey, toEmail, fromEmail };
}

/**
 * Escape a string for safe interpolation into HTML, preventing HTML/attribute
 * injection from untrusted user input in the email body.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Collapse CR/LF/tab whitespace in a single-line header-ish value (name,
 * email) to a single space, to prevent header-injection-style payloads from
 * leaking into the subject / reply-to.
 */
function sanitizeHeaderValue(value: string): string {
    return value.replace(/[\r\n\t]+/g, ' ').trim();
}

/**
 * Send a contact-form message via Resend. The Resend client is constructed
 * lazily from environment variables so that importing this module (e.g. during
 * `next build`) never requires the key to be present. When configuration is
 * missing the function returns `{ ok: false, reason: 'unconfigured' }` instead
 * of throwing.
 *
 * No secrets are ever logged; only non-sensitive failure detail is surfaced.
 */
export async function sendContactEmail(
    input: ContactEmailInput,
): Promise<SendContactResult> {
    const config = readResendConfig();
    if (!config) {
        console.warn(
            'email.sendContactEmail: Resend is not configured (missing RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL); skipping send.',
        );
        return { ok: false, reason: 'unconfigured' };
    }

    const name = sanitizeHeaderValue(input.name);
    const email = sanitizeHeaderValue(input.email);
    const message = input.message;

    try {
        const resend = new Resend(config.apiKey);

        const { error } = await resend.emails.send({
            from: config.fromEmail,
            to: config.toEmail,
            replyTo: email,
            subject: `New contact-form message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
            html: [
                '<div>',
                `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
                `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
                '<hr />',
                `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
                '</div>',
            ].join(''),
        });

        if (error) {
            console.error('email.sendContactEmail: Resend send failed', {
                name: error.name,
            });
            return {
                ok: false,
                reason: 'send_failed',
                detail: error.name,
            };
        }

        return { ok: true };
    } catch (e) {
        const error = e as Error;
        console.error('email.sendContactEmail: unexpected send error', {
            message: error.message,
        });
        return { ok: false, reason: 'send_failed', detail: error.message };
    }
}

/** Input for a branded admin invite email. */
export interface InviteEmailInput {
    /** Recipient email address (the invited user). */
    email: string;
    /** Supabase action link the recipient clicks to accept the invite. */
    inviteUrl: string;
}

/**
 * Resend configuration for the invite sender. The "to" address is the recipient
 * (passed per-call), so only the API key and a verified "from" address are read
 * from the environment.
 */
interface InviteResendConfig {
    apiKey: string;
    fromEmail: string;
}

/**
 * Read the invite-email config from the environment. Reuses `RESEND_API_KEY`
 * and `CONTACT_FROM_EMAIL` (the verified sender) so no new secret is required.
 * Returns `null` when anything is missing so callers can degrade gracefully.
 */
function readInviteResendConfig(): InviteResendConfig | null {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();

    if (!apiKey || !fromEmail) {
        return null;
    }

    return { apiKey, fromEmail };
}

/**
 * Send a branded admin invite email via Resend. Same env-gated, lazy, secret-safe
 * pattern as {@link sendContactEmail}: when Resend is not configured this returns
 * `{ ok: false, reason: 'unconfigured' }` so the caller can still surface the
 * raw invite link as a fallback rather than failing the invite outright.
 *
 * The `inviteUrl` is a trusted Supabase action link, but it is still HTML-escaped
 * before interpolation as defense-in-depth.
 */
export async function sendInviteEmail(
    input: InviteEmailInput,
): Promise<SendContactResult> {
    const config = readInviteResendConfig();
    if (!config) {
        console.warn(
            'email.sendInviteEmail: Resend is not configured (missing RESEND_API_KEY / CONTACT_FROM_EMAIL); skipping send.',
        );
        return { ok: false, reason: 'unconfigured' };
    }

    const email = sanitizeHeaderValue(input.email);
    const inviteUrl = input.inviteUrl;
    const safeUrl = escapeHtml(inviteUrl);

    try {
        const resend = new Resend(config.apiKey);

        const { error } = await resend.emails.send({
            from: config.fromEmail,
            to: email,
            subject: "You're invited to bryandebaun.dev",
            text: [
                "You've been invited to bryandebaun.dev.",
                '',
                'Accept your invitation by opening the link below:',
                inviteUrl,
            ].join('\n'),
            html: [
                '<div>',
                "<p>You've been invited to <strong>bryandebaun.dev</strong>.</p>",
                '<p>Accept your invitation by clicking the link below:</p>',
                `<p><a href="${safeUrl}">Accept invitation</a></p>`,
                '<hr />',
                '<p style="color:#666;font-size:12px">If the button does not work, copy and paste this URL into your browser:</p>',
                `<p style="word-break:break-all;font-size:12px">${safeUrl}</p>`,
                '</div>',
            ].join(''),
        });

        if (error) {
            console.error('email.sendInviteEmail: Resend send failed', {
                name: error.name,
            });
            return {
                ok: false,
                reason: 'send_failed',
                detail: error.name,
            };
        }

        return { ok: true };
    } catch (e) {
        const error = e as Error;
        console.error('email.sendInviteEmail: unexpected send error', {
            message: error.message,
        });
        return { ok: false, reason: 'send_failed', detail: error.message };
    }
}

/** Input for the gated-résumé approval email (ADR 0007 Phase 2). */
export interface ResumeApprovalEmailInput {
    /** Recipient email address (the approved requester). */
    to: string;
    /** Signed, time-limited download link (our `/api/resume/download?t=…`). */
    downloadUrl: string;
    /** ISO timestamp when the link expires (~72h out); shown in the copy. */
    expiresAt: string;
}

/**
 * Format an ISO timestamp for human-friendly display in the approval email.
 * Falls back to the raw value if it can't be parsed so we never send an empty
 * expiry line.
 */
function formatExpiry(expiresAt: string): string {
    const ms = Date.parse(expiresAt);
    if (Number.isNaN(ms)) return expiresAt;
    return new Date(ms).toUTCString();
}

/**
 * Send the "your résumé download is ready" email via Resend. Same env-gated,
 * lazy, secret-safe pattern as {@link sendInviteEmail}: reuses `RESEND_API_KEY`
 * and `CONTACT_FROM_EMAIL`, and returns `{ ok: false, reason: 'unconfigured' }`
 * when Resend isn't configured so the approve route can still succeed and
 * surface `emailSent: false`.
 *
 * The `downloadUrl` is a trusted, server-minted link, but it is still
 * HTML-escaped before interpolation as defense-in-depth. Never logs the link.
 */
export async function sendResumeApprovalEmail(
    input: ResumeApprovalEmailInput,
): Promise<SendContactResult> {
    const config = readInviteResendConfig();
    if (!config) {
        console.warn(
            'email.sendResumeApprovalEmail: Resend is not configured (missing RESEND_API_KEY / CONTACT_FROM_EMAIL); skipping send.',
        );
        return { ok: false, reason: 'unconfigured' };
    }

    const to = sanitizeHeaderValue(input.to);
    const safeUrl = escapeHtml(input.downloadUrl);
    const expiry = formatExpiry(input.expiresAt);
    const safeExpiry = escapeHtml(expiry);

    try {
        const resend = new Resend(config.apiKey);

        const { error } = await resend.emails.send({
            from: config.fromEmail,
            to,
            subject: 'Your résumé download is ready',
            text: [
                'Your request for the full résumé (PDF) has been approved.',
                '',
                'Download it here:',
                input.downloadUrl,
                '',
                `This link expires in about 72 hours (on ${expiry}).`,
            ].join('\n'),
            html: [
                '<div>',
                '<p>Your request for the full <strong>résumé (PDF)</strong> has been approved.</p>',
                `<p><a href="${safeUrl}">Download your résumé</a></p>`,
                `<p style="color:#666;font-size:12px">This link expires in about 72 hours (on ${safeExpiry}).</p>`,
                '<hr />',
                '<p style="color:#666;font-size:12px">If the button does not work, copy and paste this URL into your browser:</p>',
                `<p style="word-break:break-all;font-size:12px">${safeUrl}</p>`,
                '</div>',
            ].join(''),
        });

        if (error) {
            console.error('email.sendResumeApprovalEmail: Resend send failed', {
                name: error.name,
            });
            return {
                ok: false,
                reason: 'send_failed',
                detail: error.name,
            };
        }

        return { ok: true };
    } catch (e) {
        const error = e as Error;
        console.error('email.sendResumeApprovalEmail: unexpected send error', {
            message: error.message,
        });
        return { ok: false, reason: 'send_failed', detail: error.message };
    }
}
