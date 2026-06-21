'use client';
import {
    CONTACT_EMAIL,
    EMAIL_REGEX,
    MESSAGE_MAX,
    MESSAGE_MIN,
    NAME_MAX,
    NAME_MIN,
} from '@/lib/contact';
import type React from 'react';
import { useState } from 'react';

interface FieldErrors {
    name?: string;
    email?: string;
    message?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'unconfigured';

function validate(values: {
    name: string;
    email: string;
    message: string;
}): FieldErrors {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();

    if (name.length < NAME_MIN || name.length > NAME_MAX) {
        errors.name = `Name must be ${NAME_MIN}–${NAME_MAX} characters.`;
    }
    if (!EMAIL_REGEX.test(email)) {
        errors.email = 'A valid email address is required.';
    }
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
        errors.message = `Message must be ${MESSAGE_MIN}–${MESSAGE_MAX} characters.`;
    }
    return errors;
}

export default function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    // Honeypot — hidden from real users; bots tend to fill every field.
    const [company, setCompany] = useState('');

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [status, setStatus] = useState<Status>('idle');
    const [formError, setFormError] = useState<string | null>(null);

    const submitting = status === 'submitting';

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);

        const errors = validate({ name, email, message });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setStatus('submitting');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name, email, message, company }),
            });

            if (res.ok) {
                setStatus('success');
                setName('');
                setEmail('');
                setMessage('');
                return;
            }

            const payload = await res.json().catch(() => ({}));

            if (res.status === 400 && payload?.fieldErrors) {
                setFieldErrors(payload.fieldErrors as FieldErrors);
                setStatus('idle');
                return;
            }

            if (res.status === 503) {
                setStatus('unconfigured');
                return;
            }

            setFormError(
                payload?.error ||
                    'Something went wrong sending your message. Please try again.',
            );
            setStatus('error');
        } catch {
            setFormError(
                'Network error — please try again, or use the email link below.',
            );
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <div
                className="rounded-md border border-[var(--color-norwegian-300)] p-4"
                role="status"
            >
                <p className="font-semibold">
                    Thanks — I&apos;ll get back to you.
                </p>
                <p className="mt-2 text-sm">
                    Your message is on its way. Prefer email? Reach me at{' '}
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="text-[var(--color-norwegian-700)] hover:underline"
                    >
                        {CONTACT_EMAIL}
                    </a>
                    .
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
                <label htmlFor="contact-name" className="block text-sm">
                    Name
                </label>
                <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className="mt-1 w-full form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={fieldErrors.name ? true : undefined}
                    aria-describedby={
                        fieldErrors.name ? 'contact-name-error' : undefined
                    }
                    disabled={submitting}
                    maxLength={NAME_MAX}
                />
                {fieldErrors.name ? (
                    <p
                        id="contact-name-error"
                        className="mt-1 text-sm text-red-600"
                    >
                        {fieldErrors.name}
                    </p>
                ) : null}
            </div>

            <div>
                <label htmlFor="contact-email" className="block text-sm">
                    Email
                </label>
                <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1 w-full form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={
                        fieldErrors.email ? 'contact-email-error' : undefined
                    }
                    disabled={submitting}
                />
                {fieldErrors.email ? (
                    <p
                        id="contact-email-error"
                        className="mt-1 text-sm text-red-600"
                    >
                        {fieldErrors.email}
                    </p>
                ) : null}
            </div>

            <div>
                <label htmlFor="contact-message" className="block text-sm">
                    Message
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    className="mt-1 w-full form-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={fieldErrors.message ? true : undefined}
                    aria-describedby={
                        fieldErrors.message
                            ? 'contact-message-error'
                            : undefined
                    }
                    disabled={submitting}
                    maxLength={MESSAGE_MAX}
                />
                {fieldErrors.message ? (
                    <p
                        id="contact-message-error"
                        className="mt-1 text-sm text-red-600"
                    >
                        {fieldErrors.message}
                    </p>
                ) : null}
            </div>

            {/* Honeypot: visually hidden + off-screen, not announced to AT.
                Real users never see or fill this; bots usually do. */}
            <div aria-hidden="true" className="hidden">
                <label htmlFor="contact-company">
                    Company (leave this field empty)
                </label>
                <input
                    id="contact-company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                />
            </div>

            {status === 'unconfigured' ? (
                <div className="text-sm text-red-600" role="alert">
                    Email delivery isn&apos;t set up right now. Please reach me
                    directly at{' '}
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-medium hover:underline"
                    >
                        {CONTACT_EMAIL}
                    </a>
                    .
                </div>
            ) : null}

            {status === 'error' && formError ? (
                <div className="text-sm text-red-600" role="alert">
                    {formError}
                </div>
            ) : null}

            <div className="form-actions">
                <button
                    type="submit"
                    className="btn btn--primary w-full md:w-auto"
                    disabled={submitting}
                >
                    {submitting ? 'Sending…' : 'Send message'}
                </button>
            </div>
        </form>
    );
}
