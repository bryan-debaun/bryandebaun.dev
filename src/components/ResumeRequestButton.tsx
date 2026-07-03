'use client';

import { useContext, useId, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import {
    createResumeRequest,
    ResumeRequestError,
} from '@/lib/repositories/resumeRequestsRepository';

/** Optional free-text reason cap, mirrored from the server route. */
const MAX_REASON_LENGTH = 500;

type SubmitState =
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'success' }
    | { kind: 'error'; message: string };

/**
 * Requester-facing control on the public résumé page (ADR 0007 Phase 2).
 *
 * - Signed out: renders a "Sign in to request" link to `/login`.
 * - Signed in: renders a compact form (optional reason + submit) that POSTs to
 *   `/api/resume-requests`. The server enforces the verified-email gate and the
 *   3-per-30-day quota; those come back as inline error/success messages.
 *
 * Never renders email/phone — this lives only on the PUBLIC résumé variant, so
 * no direct contact info is exposed (ADR 0007).
 */
export default function ResumeRequestButton() {
    const { isAuthenticated } = useContext(AuthContext);
    const [reason, setReason] = useState('');
    const [state, setState] = useState<SubmitState>({ kind: 'idle' });
    const reasonId = useId();
    const statusId = useId();

    if (!isAuthenticated) {
        return (
            <div className="resume-actions flex flex-col items-center gap-1 !mt-4">
                <a href="/login" className="btn btn--primary !no-underline">
                    Sign in to request the full résumé (PDF)
                </a>
                <span className="text-sm text-muted">
                    A copy with full contact details is available to verified
                    users on request.
                </span>
            </div>
        );
    }

    const submitting = state.kind === 'submitting';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setState({ kind: 'submitting' });
        try {
            await createResumeRequest({
                reason: reason.trim() || undefined,
            });
            setReason('');
            setState({ kind: 'success' });
        } catch (err) {
            const message =
                err instanceof ResumeRequestError
                    ? err.message
                    : 'Something went wrong. Please try again later.';
            setState({ kind: 'error', message });
        }
    };

    if (state.kind === 'success') {
        return (
            <div className="resume-actions flex flex-col items-center gap-1 !mt-4">
                <p
                    role="status"
                    className="text-sm text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]"
                >
                    Thanks — your request was submitted. You&rsquo;ll get an
                    email with a download link once it&rsquo;s approved.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="resume-actions flex flex-col items-center gap-2 !mt-4"
            aria-label="Request the full résumé"
        >
            <div className="flex w-full max-w-md flex-col">
                <label htmlFor={reasonId} className="text-sm mb-1">
                    Reason (optional)
                </label>
                <textarea
                    id={reasonId}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={MAX_REASON_LENGTH}
                    rows={2}
                    placeholder="e.g. Considering you for a Senior Engineer role at Acme."
                    className="rounded-md border border-[var(--tw-prose-td-borders)] bg-[var(--background)] px-3 py-2 text-sm"
                    disabled={submitting}
                />
            </div>
            <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
                aria-describedby={state.kind === 'error' ? statusId : undefined}
            >
                {submitting ? 'Submitting…' : 'Request full résumé (PDF)'}
            </button>
            {state.kind === 'error' ? (
                <p id={statusId} role="alert" className="text-sm text-red-600">
                    {state.message}
                </p>
            ) : null}
        </form>
    );
}
