/**
 * Shared contact-form constants used by both the API route (server) and the
 * contact page (client). Keep this module free of server-only imports so it can
 * be bundled into the client component.
 */

/**
 * Public-facing contact email used for the `mailto:` fallback link on the
 * contact page. This is intentionally a public address (NOT the server-only
 * `CONTACT_TO_EMAIL`), so it is safe to ship to the client. The working contact
 * form is the primary path; this is only the no-JS / send-down fallback.
 *
 * Swap to an `@bryandebaun.dev` alias if you prefer a domain address over the
 * personal inbox here.
 */
export const CONTACT_EMAIL = 'brn.dbn@gmail.com';

/** Field length bounds, shared so client + server validation stay in sync. */
export const NAME_MIN = 1;
export const NAME_MAX = 100;
export const MESSAGE_MIN = 1;
export const MESSAGE_MAX = 5000;

/**
 * Pragmatic email format check. Server-side validation is the source of truth;
 * the client uses the same regex for inline feedback. Deliberately permissive
 * (we are not trying to RFC-5322-perfectly validate) but rejects obvious junk.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
