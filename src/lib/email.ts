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
