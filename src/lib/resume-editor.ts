import type {
    Resume,
    ResumeEducation,
    ResumeProfile,
    ResumeProject,
    ResumeSkill,
    ResumeWork,
} from '@/lib/resume';

/**
 * Form-model types for the admin résumé editor. Every array entry carries a
 * stable numeric `id` so React keys survive add/remove/reorder edits (mirrors
 * the leg-id pattern in `BetForm`). {@link toResume} strips these ids and drops
 * empty optional fields when building the `Resume` payload.
 */

let nextId = 0;
/** Monotonic id generator for form rows (module-scoped, edit-session unique). */
export function makeId(): number {
    nextId += 1;
    return nextId;
}

export interface StringRow {
    id: number;
    value: string;
}

export interface ProfileRow {
    id: number;
    network: string;
    username: string;
    url: string;
}

export interface WorkRow {
    id: number;
    name: string;
    position: string;
    url: string;
    startDate: string;
    endDate: string;
    summary: string;
    highlights: StringRow[];
}

export interface EducationRow {
    id: number;
    institution: string;
    url: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    note: string;
}

export interface SkillRow {
    id: number;
    name: string;
    level: string;
    keywords: StringRow[];
}

export interface ProjectRow {
    id: number;
    name: string;
    description: string;
    url: string;
    keywords: StringRow[];
}

export interface ResumeFormValues {
    basics: {
        name: string;
        label: string;
        url: string;
        summary: string;
        location: {
            city: string;
            region: string;
            countryCode: string;
        };
        profiles: ProfileRow[];
        privateContact: {
            email: string;
            phone: string;
        };
    };
    work: WorkRow[];
    education: EducationRow[];
    skills: SkillRow[];
    projects: ProjectRow[];
}

const s = (v: unknown): string => (typeof v === 'string' ? v : '');

function toStringRows(values: string[] | undefined): StringRow[] {
    return (values ?? []).map((value) => ({ id: makeId(), value }));
}

/** Build the editable form model from a fetched {@link Resume}. */
export function formFromResume(resume: Resume): ResumeFormValues {
    return {
        basics: {
            name: s(resume.basics?.name),
            label: s(resume.basics?.label),
            url: s(resume.basics?.url),
            summary: s(resume.basics?.summary),
            location: {
                city: s(resume.basics?.location?.city),
                region: s(resume.basics?.location?.region),
                countryCode: s(resume.basics?.location?.countryCode),
            },
            profiles: (resume.basics?.profiles ?? []).map((p) => ({
                id: makeId(),
                network: s(p.network),
                username: s(p.username),
                url: s(p.url),
            })),
            privateContact: {
                email: s(resume.basics?.privateContact?.email),
                phone: s(resume.basics?.privateContact?.phone),
            },
        },
        work: (resume.work ?? []).map((w) => ({
            id: makeId(),
            name: s(w.name),
            position: s(w.position),
            url: s(w.url),
            startDate: s(w.startDate),
            endDate: s(w.endDate),
            summary: s(w.summary),
            highlights: toStringRows(w.highlights),
        })),
        education: (resume.education ?? []).map((e) => ({
            id: makeId(),
            institution: s(e.institution),
            url: s(e.url),
            area: s(e.area),
            studyType: s(e.studyType),
            startDate: s(e.startDate),
            endDate: s(e.endDate),
            note: s(e.note),
        })),
        skills: (resume.skills ?? []).map((sk) => ({
            id: makeId(),
            name: s(sk.name),
            level: s(sk.level),
            keywords: toStringRows(sk.keywords),
        })),
        projects: (resume.projects ?? []).map((p) => ({
            id: makeId(),
            name: s(p.name),
            description: s(p.description),
            url: s(p.url),
            keywords: toStringRows(p.keywords),
        })),
    };
}

/** Trim + drop blank string rows to a plain array. */
function cleanStrings(rows: StringRow[]): string[] {
    return rows.map((r) => r.value.trim()).filter((v) => v !== '');
}

/** Include `key: value` only when the trimmed string is non-empty. */
function optionalString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}

/**
 * Build the {@link Resume} payload from the form model: strip row ids, trim
 * strings, drop empty optional fields, and omit empty nested objects (location,
 * privateContact) so the stored document stays clean.
 */
export function toResume(values: ResumeFormValues): Resume {
    const b = values.basics;

    const location: Resume['basics']['location'] = {};
    if (optionalString(b.location.city)) location.city = b.location.city.trim();
    if (optionalString(b.location.region))
        location.region = b.location.region.trim();
    if (optionalString(b.location.countryCode))
        location.countryCode = b.location.countryCode.trim();

    const privateContact: NonNullable<Resume['basics']['privateContact']> = {};
    if (optionalString(b.privateContact.email))
        privateContact.email = b.privateContact.email.trim();
    if (optionalString(b.privateContact.phone))
        privateContact.phone = b.privateContact.phone.trim();

    const profiles: ResumeProfile[] = b.profiles
        .filter((p) => p.network.trim() !== '' || p.url.trim() !== '')
        .map((p) => ({
            network: p.network.trim(),
            url: p.url.trim(),
            ...(optionalString(p.username)
                ? { username: p.username.trim() }
                : {}),
        }));

    const work: ResumeWork[] = values.work.map((w) => ({
        name: w.name.trim(),
        position: w.position.trim(),
        startDate: w.startDate.trim(),
        endDate: w.endDate.trim(),
        ...(optionalString(w.url) ? { url: w.url.trim() } : {}),
        ...(optionalString(w.summary) ? { summary: w.summary.trim() } : {}),
        ...(w.highlights.length
            ? { highlights: cleanStrings(w.highlights) }
            : {}),
    }));

    const education: ResumeEducation[] = values.education.map((e) => ({
        institution: e.institution.trim(),
        area: e.area.trim(),
        studyType: e.studyType.trim(),
        startDate: e.startDate.trim(),
        ...(optionalString(e.url) ? { url: e.url.trim() } : {}),
        ...(optionalString(e.endDate) ? { endDate: e.endDate.trim() } : {}),
        ...(optionalString(e.note) ? { note: e.note.trim() } : {}),
    }));

    const skills: ResumeSkill[] = values.skills.map((sk) => ({
        name: sk.name.trim(),
        keywords: cleanStrings(sk.keywords),
        ...(optionalString(sk.level) ? { level: sk.level.trim() } : {}),
    }));

    const projects: ResumeProject[] = values.projects.map((p) => ({
        name: p.name.trim(),
        description: p.description.trim(),
        ...(optionalString(p.url) ? { url: p.url.trim() } : {}),
        ...(p.keywords.length ? { keywords: cleanStrings(p.keywords) } : {}),
    }));

    return {
        basics: {
            name: b.name.trim(),
            label: b.label.trim(),
            url: b.url.trim(),
            summary: b.summary.trim(),
            ...(Object.keys(location).length ? { location } : {}),
            profiles,
            ...(Object.keys(privateContact).length ? { privateContact } : {}),
        },
        work,
        education,
        skills,
        projects,
    };
}

/** Client-side validation mirroring the admin route's server checks. */
export function validateResumeForm(
    values: ResumeFormValues,
): { ok: true } | { ok: false; error: string } {
    if (values.basics.name.trim() === '') {
        return { ok: false, error: 'Name is required.' };
    }
    return { ok: true };
}

/** An empty work row. */
export function emptyWorkRow(): WorkRow {
    return {
        id: makeId(),
        name: '',
        position: '',
        url: '',
        startDate: '',
        endDate: '',
        summary: '',
        highlights: [],
    };
}

/** An empty education row. */
export function emptyEducationRow(): EducationRow {
    return {
        id: makeId(),
        institution: '',
        url: '',
        area: '',
        studyType: '',
        startDate: '',
        endDate: '',
        note: '',
    };
}

/** An empty skill row. */
export function emptySkillRow(): SkillRow {
    return { id: makeId(), name: '', level: '', keywords: [] };
}

/** An empty project row. */
export function emptyProjectRow(): ProjectRow {
    return { id: makeId(), name: '', description: '', url: '', keywords: [] };
}

/** An empty profile row. */
export function emptyProfileRow(): ProfileRow {
    return { id: makeId(), network: '', username: '', url: '' };
}

/** An empty string row. */
export function emptyStringRow(): StringRow {
    return { id: makeId(), value: '' };
}
