/**
 * Authoritative TypeScript types for the résumé document (JSON Resume schema
 * subset — https://jsonresume.org/schema/ — for the fields the site renders).
 *
 * As of ADR 0007 Phase 3 the résumé CONTENT lives in the MCP `Resume`
 * singleton, edited live via `/admin/resume`; the retired
 * `src/data/resume.json` is gone. The generated client's `ResumeDocument` is
 * loosely typed (`work?: any[]`, index signatures), so these types stay the
 * source of truth and the service (`src/lib/services/resume.ts`) casts at the
 * MCP boundary. Fetch content via that service, never from this module.
 *
 * Privacy note (ADR 0007): direct contact info (email, phone) lives under
 * `basics.privateContact` and is a deliberate deviation from the JSON Resume
 * schema (which puts them flat on `basics`). The public `/resume` page and its
 * JSON-LD MUST NOT render `privateContact`; those fields are for the gated full
 * résumé only. The public MCP endpoint strips them server-side as well.
 */

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

/**
 * Private contact info — rendered ONLY into the gated full résumé (ADR 0007),
 * never on the public `/resume` page or in its HTML/JSON-LD.
 */
export interface ResumePrivateContact {
    email?: string;
    phone?: string;
}

export interface ResumeBasics {
    name: string;
    label: string;
    url: string;
    summary: string;
    location?: ResumeLocation;
    profiles: ResumeProfile[];
    /** Private contact info — public surfaces must not read this. */
    privateContact?: ResumePrivateContact;
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
    /** Optional free-text note (e.g. context on an incomplete program). */
    note?: string;
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
    /** Optional scaffold/authoring note; not rendered. */
    _note?: string;
    basics: ResumeBasics;
    work: ResumeWork[];
    education: ResumeEducation[];
    skills: ResumeSkill[];
    projects: ResumeProject[];
}
