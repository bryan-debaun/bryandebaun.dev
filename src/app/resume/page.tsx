import type { Metadata } from 'next';
import { ResumeDocument } from '@/components/ResumeDocument';
import ResumeRequestButton from '@/components/ResumeRequestButton';
import { getPublicResume } from '@/lib/services/resume';

// ISR: the résumé content lives in the MCP `Resume` singleton (ADR 0007
// Phase 3). Revalidate hourly so admin edits appear without a deploy; the admin
// write route also revalidates this path on save for an immediate refresh.
export const revalidate = 3600;

// Content is real (no placeholder scaffold anymore), so the page is indexable.
export const metadata: Metadata = {
    title: 'Résumé — Bryan DeBaun',
    description:
        'Résumé of Bryan DeBaun — Senior Software Engineer. View online; a full PDF with contact details is available to signed-in users on request.',
    robots: { index: true, follow: true },
};

export default async function ResumePage() {
    // Public variant: no direct contact info (email/phone stay private — ADR
    // 0007). The public MCP endpoint already strips `privateContact`, so this
    // page cannot leak it even in principle. The interactive request form is
    // passed as a client-component slot so this page stays a server component.
    const resume = await getPublicResume();

    if (!resume) {
        // Graceful degradation when the MCP API is unreachable — mirror the
        // articles service's soft-failure rather than throwing a 500.
        return (
            <main className="mx-auto max-w-2xl px-4 py-16 text-center">
                <h1 className="text-2xl font-semibold">Résumé</h1>
                <p className="mt-4 text-muted">
                    The résumé is temporarily unavailable. Please check back
                    shortly.
                </p>
            </main>
        );
    }

    return (
        <ResumeDocument resume={resume} requestSlot={<ResumeRequestButton />} />
    );
}
