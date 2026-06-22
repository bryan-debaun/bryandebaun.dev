/**
 * Typed loader for the single-source resume document.
 *
 * The resume lives at `src/data/resume.json` and follows the JSON Resume
 * schema (https://jsonresume.org/schema/) — we model only the subset of fields
 * the site renders. This module is the source of truth for both the `/resume`
 * page and the generated `public/resume.pdf`.
 *
 * To update the resume, edit `src/data/resume.json` (NOT this file), then
 * regenerate the PDF with `pnpm resume:pdf` while a dev/prod server is running.
 */

import resumeData from '@/data/resume.json';

/** Marker string used to flag placeholder content that still needs replacing. */
export const PLACEHOLDER_MARKER = 'PLACEHOLDER';

export interface ResumeLocation {
    city?: string;
    region?: string;
    countryCode?: string;
}

export interface ResumeProfile {
    network: string;
    username?: string;
    url: string;
}

export interface ResumeBasics {
    name: string;
    label: string;
    email: string;
    url: string;
    summary: string;
    location?: ResumeLocation;
    profiles: ResumeProfile[];
}

export interface ResumeWork {
    name: string;
    position: string;
    url?: string;
    startDate: string;
    /** Empty string denotes a current/ongoing role. */
    endDate?: string;
    summary?: string;
    highlights?: string[];
}

export interface ResumeEducation {
    institution: string;
    url?: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate?: string;
}

export interface ResumeSkill {
    name: string;
    level?: string;
    keywords: string[];
}

export interface ResumeProject {
    name: string;
    description: string;
    url?: string;
    keywords?: string[];
}

export interface Resume {
    /** Scaffold note explaining the file's purpose; not rendered. */
    _note?: string;
    basics: ResumeBasics;
    work: ResumeWork[];
    education: ResumeEducation[];
    skills: ResumeSkill[];
    projects: ResumeProject[];
}

/**
 * Returns the parsed resume document. The JSON is statically imported, so this
 * is synchronous and safe to call from a server component.
 */
export function getResume(): Resume {
    return resumeData as Resume;
}

/**
 * Returns true while the resume still contains placeholder content (any value
 * containing {@link PLACEHOLDER_MARKER}). The `/resume` page uses this to stay
 * `noindex` until real content lands; flip happens automatically once the last
 * PLACEHOLDER is removed from `src/data/resume.json`.
 *
 * The top-level `_note` field is intentionally excluded so the scaffold note
 * (which references the marker) does not keep the page noindex forever.
 */
export function resumeHasPlaceholders(resume: Resume = getResume()): boolean {
    const { _note, ...rest } = resume;
    return JSON.stringify(rest).includes(PLACEHOLDER_MARKER);
}
