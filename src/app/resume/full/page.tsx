import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ResumeDocument } from '@/components/ResumeDocument';
import { isCurrentUserAdmin } from '@/lib/auth-guard';
import { getFullResume } from '@/lib/services/resume';
import { isValidResumeFullToken } from '@/lib/resume-download';

// Gated + dynamic: this variant reads a request header / auth session and
// carries private contact info, so it must never be statically prerendered or
// cached.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Résumé (full) — Bryan DeBaun',
    // Never indexable — this render includes private contact info.
    robots: { index: false, follow: false },
};

/**
 * The contact-bearing résumé render that feeds the downloadable PDF (ADR 0007
 * Phase 1). Access requires EITHER a valid one-off token header (used by the
 * `resume:pdf` generator) OR an authenticated admin session (so Bryan can
 * preview it in a browser). Anyone else gets a 404 — the route reveals nothing.
 */
export default async function ResumeFullPage() {
    const token = (await headers()).get('x-resume-token');
    // Short-circuit on the cheap token check before touching Supabase auth.
    const allowed =
        isValidResumeFullToken(token) || (await isCurrentUserAdmin());
    if (!allowed) notFound();

    // Full, contact-bearing render sourced from the MCP `Resume` singleton
    // (ADR 0007 Phase 3). A null (MCP unreachable) is treated as not-found so
    // the PDF generator / admin preview fails closed rather than rendering an
    // empty document.
    const resume = await getFullResume();
    if (!resume) notFound();

    return <ResumeDocument resume={resume} includePrivateContact />;
}
