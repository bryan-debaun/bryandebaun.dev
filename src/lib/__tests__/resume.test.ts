import { describe, expect, it } from 'vitest';
import {
    getResume,
    PLACEHOLDER_MARKER,
    type Resume,
    resumeHasPlaceholders,
} from '../resume';

describe('getResume', () => {
    it('returns a resume with the expected JSON Resume shape', () => {
        const resume = getResume();

        expect(resume.basics.name).toBe('Bryan DeBaun');
        expect(resume.basics.label).toBe('Senior Software Engineer');
        expect(typeof resume.basics.url).toBe('string');
        expect(typeof resume.basics.summary).toBe('string');
        expect(Array.isArray(resume.basics.profiles)).toBe(true);

        expect(Array.isArray(resume.work)).toBe(true);
        expect(Array.isArray(resume.education)).toBe(true);
        expect(Array.isArray(resume.skills)).toBe(true);
        expect(Array.isArray(resume.projects)).toBe(true);
    });

    it('exposes at least one entry in the populated sections', () => {
        const resume = getResume();
        expect(resume.work.length).toBeGreaterThan(0);
        expect(resume.education.length).toBeGreaterThan(0);
        expect(resume.skills.length).toBeGreaterThan(0);
        expect(resume.skills[0].keywords.length).toBeGreaterThan(0);
    });

    it('keeps direct contact info in privateContact, never flat on basics', () => {
        // ADR 0007: email/phone must not be public-surface fields. They live
        // under basics.privateContact so the /resume page cannot leak them.
        const resume = getResume();
        expect(resume.basics.privateContact?.email).toMatch(/@/);
        expect(resume.basics.privateContact?.phone).toBeTruthy();
        // The JSON must not carry a flat `email` on basics.
        expect(
            (resume.basics as unknown as Record<string, unknown>).email,
        ).toBeUndefined();
    });
});

describe('resumeHasPlaceholders', () => {
    it('reports no placeholders once real content has landed', () => {
        // Real résumé content is populated (ADR 0007 Phase 0), so the page is
        // indexable — resumeHasPlaceholders must be false for the shipped data.
        expect(resumeHasPlaceholders()).toBe(false);
    });

    it('returns true when any field contains the placeholder marker', () => {
        const withPlaceholder: Resume = {
            basics: {
                name: 'Bryan DeBaun',
                label: 'Senior Software Engineer',
                url: 'https://example.com',
                summary: `${PLACEHOLDER_MARKER} — replace me`,
                profiles: [],
            },
            work: [],
            education: [],
            skills: [],
            projects: [],
        };
        expect(resumeHasPlaceholders(withPlaceholder)).toBe(true);
    });

    it('returns false once all placeholder markers are removed', () => {
        const populated: Resume = {
            basics: {
                name: 'Bryan DeBaun',
                label: 'Senior Software Engineer',
                url: 'https://example.com',
                summary: 'A real summary with no markers.',
                profiles: [
                    {
                        network: 'GitHub',
                        username: 'bryan-debaun',
                        url: 'https://github.com/bryan-debaun',
                    },
                ],
            },
            work: [
                {
                    name: 'Acme',
                    position: 'Senior Software Engineer',
                    startDate: '2020-01-01',
                    endDate: '',
                    summary: 'Did real work.',
                    highlights: ['Shipped real things.'],
                },
            ],
            education: [],
            skills: [{ name: 'Languages', keywords: ['C#', 'TypeScript'] }],
            projects: [],
        };
        expect(resumeHasPlaceholders(populated)).toBe(false);
    });

    it('ignores the top-level _note field so the scaffold note never blocks indexing', () => {
        const populatedWithNote: Resume = {
            _note: `Scaffold note that mentions ${PLACEHOLDER_MARKER} on purpose.`,
            basics: {
                name: 'Bryan DeBaun',
                label: 'Senior Software Engineer',
                url: 'https://example.com',
                summary: 'A real summary with no markers.',
                profiles: [],
            },
            work: [],
            education: [],
            skills: [],
            projects: [],
        };
        expect(resumeHasPlaceholders(populatedWithNote)).toBe(false);
    });
});
