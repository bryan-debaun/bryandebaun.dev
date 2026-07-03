import type { Metadata } from 'next';
import { ResumeDocument } from '@/components/ResumeDocument';
import { getResume, resumeHasPlaceholders } from '@/lib/resume';

const resume = getResume();
const isPlaceholder = resumeHasPlaceholders(resume);

// NOINDEX: while the resume is a placeholder scaffold we keep this page out of
// search indexes. This is wired to the placeholder detector in src/lib/resume.ts
// (`resumeHasPlaceholders`): once the last PLACEHOLDER marker is removed from
// src/data/resume.json, `isPlaceholder` becomes false and the page flips to
// indexable automatically — no code change required here.
export const metadata: Metadata = {
    title: 'Résumé — Bryan DeBaun',
    description:
        'Résumé of Bryan DeBaun — Senior Software Engineer. View online; a full PDF with contact details is available to signed-in users on request.',
    robots: isPlaceholder
        ? { index: false, follow: false }
        : { index: true, follow: true },
};

export default function ResumePage() {
    // Public variant: no direct contact info (email/phone stay private — ADR 0007).
    return <ResumeDocument resume={resume} />;
}
