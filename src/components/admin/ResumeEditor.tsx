'use client';

import React, { useState } from 'react';
import { useAdminResume } from '@/lib/hooks/useAdminResume';
import { ResumeContentError } from '@/lib/repositories/resumeRepository';
import {
    emptyEducationRow,
    emptyProfileRow,
    emptyProjectRow,
    emptySkillRow,
    emptyStringRow,
    emptyWorkRow,
    formFromResume,
    toResume,
    validateResumeForm,
    type EducationRow,
    type ProfileRow,
    type ProjectRow,
    type ResumeFormValues,
    type SkillRow,
    type StringRow,
    type WorkRow,
} from '@/lib/resume-editor';

/** A labelled text input. `id` ties the label to the control for a11y. */
function TextField({
    id,
    label,
    value,
    onChange,
    required,
    type = 'text',
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
                {required ? (
                    <span className="text-red-500" aria-hidden="true">
                        {' '}
                        *
                    </span>
                ) : null}
            </label>
            <input
                id={id}
                type={type}
                className="mt-1 w-full form-input"
                value={value}
                required={required}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/** A labelled textarea. */
function TextAreaField({
    id,
    label,
    value,
    onChange,
    rows = 3,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
            </label>
            <textarea
                id={id}
                className="mt-1 w-full form-input"
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/**
 * An add/remove list of single-string rows (job highlights, skill/project
 * keywords). Each row has a stable id so keys survive edits.
 */
function StringRowList({
    idPrefix,
    itemLabel,
    rows,
    onChange,
}: {
    idPrefix: string;
    itemLabel: string;
    rows: StringRow[];
    onChange: (rows: StringRow[]) => void;
}) {
    const update = (id: number, value: string) =>
        onChange(rows.map((r) => (r.id === id ? { ...r, value } : r)));
    const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));
    const add = () => onChange([...rows, emptyStringRow()]);

    return (
        <div className="space-y-2">
            {rows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
                    <label
                        htmlFor={`${idPrefix}-${row.id}`}
                        className="sr-only"
                    >
                        {itemLabel} {idx + 1}
                    </label>
                    <input
                        id={`${idPrefix}-${row.id}`}
                        type="text"
                        className="w-full form-input"
                        value={row.value}
                        onChange={(e) => update(row.id, e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn"
                        aria-label={`Remove ${itemLabel} ${idx + 1}`}
                        onClick={() => remove(row.id)}
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button type="button" className="btn" onClick={add}>
                + Add {itemLabel.toLowerCase()}
            </button>
        </div>
    );
}

/** A framed section with a heading. */
function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <fieldset className="rounded-md border border-[var(--color-norwegian-300)] dark:border-[var(--color-norwegian-600)] p-4 space-y-4">
            <legend className="px-1 text-lg font-semibold">{title}</legend>
            {children}
        </fieldset>
    );
}

/**
 * Admin résumé content editor (ADR 0007 Phase 3). Loads the FULL résumé via
 * {@link useAdminResume}, edits it as a form model, and PUTs it back through the
 * admin API. The "Private" section (email + phone) is clearly labelled as
 * download-only content — it is stripped from every public surface server-side.
 */
export default function ResumeEditor() {
    const { resume, isLoading, isError, error, updateMutation } =
        useAdminResume();

    const [values, setValues] = useState<ResumeFormValues | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // Initialise the form model once the résumé loads.
    const loadedRef = React.useRef(false);
    React.useEffect(() => {
        if (resume && !loadedRef.current) {
            loadedRef.current = true;
            setValues(formFromResume(resume));
        }
    }, [resume]);

    const isSaving = updateMutation.isPending;

    if (isLoading && !values) {
        return (
            <p role="status" className="text-sm text-muted">
                Loading résumé…
            </p>
        );
    }

    if (isError && !values) {
        return (
            <p role="alert" className="text-sm text-red-600">
                {error?.message ?? 'Failed to load résumé.'}
            </p>
        );
    }

    if (!values) {
        return (
            <p role="status" className="text-sm text-muted">
                Loading résumé…
            </p>
        );
    }

    const v = values;

    // --- Update helpers -----------------------------------------------------
    const setBasics = (patch: Partial<ResumeFormValues['basics']>) =>
        setValues((prev) =>
            prev ? { ...prev, basics: { ...prev.basics, ...patch } } : prev,
        );
    const setLocation = (
        patch: Partial<ResumeFormValues['basics']['location']>,
    ) =>
        setValues((prev) =>
            prev
                ? {
                      ...prev,
                      basics: {
                          ...prev.basics,
                          location: { ...prev.basics.location, ...patch },
                      },
                  }
                : prev,
        );
    const setPrivateContact = (
        patch: Partial<ResumeFormValues['basics']['privateContact']>,
    ) =>
        setValues((prev) =>
            prev
                ? {
                      ...prev,
                      basics: {
                          ...prev.basics,
                          privateContact: {
                              ...prev.basics.privateContact,
                              ...patch,
                          },
                      },
                  }
                : prev,
        );

    // Profiles
    const setProfiles = (profiles: ProfileRow[]) => setBasics({ profiles });
    const updateProfile = (id: number, patch: Partial<ProfileRow>) =>
        setProfiles(
            v.basics.profiles.map((p) =>
                p.id === id ? { ...p, ...patch } : p,
            ),
        );

    // Generic list setter for the top-level arrays.
    const setWork = (work: WorkRow[]) =>
        setValues((prev) => (prev ? { ...prev, work } : prev));
    const setEducation = (education: EducationRow[]) =>
        setValues((prev) => (prev ? { ...prev, education } : prev));
    const setSkills = (skills: SkillRow[]) =>
        setValues((prev) => (prev ? { ...prev, skills } : prev));
    const setProjects = (projects: ProjectRow[]) =>
        setValues((prev) => (prev ? { ...prev, projects } : prev));

    const updateWork = (id: number, patch: Partial<WorkRow>) =>
        setWork(v.work.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    const moveWork = (index: number, dir: -1 | 1) => {
        const next = [...v.work];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setWork(next);
    };
    const updateEducation = (id: number, patch: Partial<EducationRow>) =>
        setEducation(
            v.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        );
    const updateSkill = (id: number, patch: Partial<SkillRow>) =>
        setSkills(
            v.skills.map((sk) => (sk.id === id ? { ...sk, ...patch } : sk)),
        );
    const updateProject = (id: number, patch: Partial<ProjectRow>) =>
        setProjects(
            v.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        );

    async function save() {
        setFormError(null);
        setSaved(false);

        const validation = validateResumeForm(v);
        if (!validation.ok) {
            setFormError(validation.error);
            return;
        }

        try {
            await updateMutation.mutateAsync(toResume(v));
            setSaved(true);
        } catch (err) {
            if (err instanceof ResumeContentError) {
                const first = Object.values(err.fieldErrors)[0];
                setFormError(first ?? err.message);
                return;
            }
            setFormError(
                (err as Error).message ?? 'Failed to save the résumé.',
            );
        }
    }

    return (
        <form
            className="space-y-8"
            aria-label="Edit résumé"
            onSubmit={(e) => {
                e.preventDefault();
                void save();
            }}
        >
            {/* Basics */}
            <Section title="Basics">
                <TextField
                    id="resume-name"
                    label="Name"
                    required
                    value={v.basics.name}
                    onChange={(name) => setBasics({ name })}
                />
                <TextField
                    id="resume-label"
                    label="Label / title"
                    value={v.basics.label}
                    onChange={(label) => setBasics({ label })}
                />
                <TextField
                    id="resume-url"
                    label="Website URL"
                    type="url"
                    value={v.basics.url}
                    onChange={(url) => setBasics({ url })}
                />
                <TextAreaField
                    id="resume-summary"
                    label="Summary"
                    rows={4}
                    value={v.basics.summary}
                    onChange={(summary) => setBasics({ summary })}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <TextField
                        id="resume-city"
                        label="City"
                        value={v.basics.location.city}
                        onChange={(city) => setLocation({ city })}
                    />
                    <TextField
                        id="resume-region"
                        label="Region"
                        value={v.basics.location.region}
                        onChange={(region) => setLocation({ region })}
                    />
                    <TextField
                        id="resume-country"
                        label="Country code"
                        value={v.basics.location.countryCode}
                        onChange={(countryCode) => setLocation({ countryCode })}
                    />
                </div>

                {/* Profiles */}
                <div className="space-y-3">
                    <p className="text-sm font-medium">Profiles</p>
                    {v.basics.profiles.map((p, idx) => (
                        <div
                            key={p.id}
                            className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end"
                        >
                            <div className="sm:col-span-3">
                                <TextField
                                    id={`profile-network-${p.id}`}
                                    label="Network"
                                    value={p.network}
                                    onChange={(network) =>
                                        updateProfile(p.id, { network })
                                    }
                                />
                            </div>
                            <div className="sm:col-span-3">
                                <TextField
                                    id={`profile-username-${p.id}`}
                                    label="Username"
                                    value={p.username}
                                    onChange={(username) =>
                                        updateProfile(p.id, { username })
                                    }
                                />
                            </div>
                            <div className="sm:col-span-5">
                                <TextField
                                    id={`profile-url-${p.id}`}
                                    label="URL"
                                    type="url"
                                    value={p.url}
                                    onChange={(url) =>
                                        updateProfile(p.id, { url })
                                    }
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <button
                                    type="button"
                                    className="btn w-full"
                                    aria-label={`Remove profile ${idx + 1}`}
                                    onClick={() =>
                                        setProfiles(
                                            v.basics.profiles.filter(
                                                (x) => x.id !== p.id,
                                            ),
                                        )
                                    }
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn"
                        onClick={() =>
                            setProfiles([
                                ...v.basics.profiles,
                                emptyProfileRow(),
                            ])
                        }
                    >
                        + Add profile
                    </button>
                </div>
            </Section>

            {/* Private contact */}
            <Section title="Private — only on the downloadable PDF">
                <p className="text-sm text-muted">
                    Email and phone are rendered ONLY into the gated full résumé
                    download. They are stripped from the public{' '}
                    <code>/resume</code> page and its HTML/JSON-LD server-side
                    (ADR 0007).
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                        id="resume-email"
                        label="Email"
                        type="email"
                        value={v.basics.privateContact.email}
                        onChange={(email) => setPrivateContact({ email })}
                    />
                    <TextField
                        id="resume-phone"
                        label="Phone"
                        value={v.basics.privateContact.phone}
                        onChange={(phone) => setPrivateContact({ phone })}
                    />
                </div>
            </Section>

            {/* Work */}
            <Section title="Experience">
                {v.work.map((w, idx) => (
                    <fieldset
                        key={w.id}
                        className="rounded-md border border-[var(--color-norwegian-200)] dark:border-[var(--color-norwegian-700)] p-3 space-y-3"
                    >
                        <legend className="px-1 text-sm font-medium">
                            Role {idx + 1}
                        </legend>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`work-name-${w.id}`}
                                label="Company"
                                value={w.name}
                                onChange={(name) => updateWork(w.id, { name })}
                            />
                            <TextField
                                id={`work-position-${w.id}`}
                                label="Position"
                                value={w.position}
                                onChange={(position) =>
                                    updateWork(w.id, { position })
                                }
                            />
                        </div>
                        <TextField
                            id={`work-url-${w.id}`}
                            label="Company URL"
                            type="url"
                            value={w.url}
                            onChange={(url) => updateWork(w.id, { url })}
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`work-start-${w.id}`}
                                label="Start date"
                                placeholder="YYYY-MM-DD"
                                value={w.startDate}
                                onChange={(startDate) =>
                                    updateWork(w.id, { startDate })
                                }
                            />
                            <TextField
                                id={`work-end-${w.id}`}
                                label="End date (empty = Present)"
                                placeholder="YYYY-MM-DD"
                                value={w.endDate}
                                onChange={(endDate) =>
                                    updateWork(w.id, { endDate })
                                }
                            />
                        </div>
                        <TextAreaField
                            id={`work-summary-${w.id}`}
                            label="Summary"
                            value={w.summary}
                            onChange={(summary) =>
                                updateWork(w.id, { summary })
                            }
                        />
                        <div>
                            <p className="text-sm font-medium mb-1">
                                Highlights
                            </p>
                            <StringRowList
                                idPrefix={`work-highlight-${w.id}`}
                                itemLabel="Highlight"
                                rows={w.highlights}
                                onChange={(highlights) =>
                                    updateWork(w.id, { highlights })
                                }
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn"
                                aria-label={`Move role ${idx + 1} up`}
                                disabled={idx === 0}
                                onClick={() => moveWork(idx, -1)}
                            >
                                ↑ Up
                            </button>
                            <button
                                type="button"
                                className="btn"
                                aria-label={`Move role ${idx + 1} down`}
                                disabled={idx === v.work.length - 1}
                                onClick={() => moveWork(idx, 1)}
                            >
                                ↓ Down
                            </button>
                            <button
                                type="button"
                                className="btn"
                                aria-label={`Remove role ${idx + 1}`}
                                onClick={() =>
                                    setWork(v.work.filter((x) => x.id !== w.id))
                                }
                            >
                                Remove role
                            </button>
                        </div>
                    </fieldset>
                ))}
                <button
                    type="button"
                    className="btn"
                    onClick={() => setWork([...v.work, emptyWorkRow()])}
                >
                    + Add role
                </button>
            </Section>

            {/* Education */}
            <Section title="Education">
                {v.education.map((e, idx) => (
                    <fieldset
                        key={e.id}
                        className="rounded-md border border-[var(--color-norwegian-200)] dark:border-[var(--color-norwegian-700)] p-3 space-y-3"
                    >
                        <legend className="px-1 text-sm font-medium">
                            Entry {idx + 1}
                        </legend>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`edu-institution-${e.id}`}
                                label="Institution"
                                value={e.institution}
                                onChange={(institution) =>
                                    updateEducation(e.id, { institution })
                                }
                            />
                            <TextField
                                id={`edu-url-${e.id}`}
                                label="Institution URL"
                                type="url"
                                value={e.url}
                                onChange={(url) =>
                                    updateEducation(e.id, { url })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`edu-area-${e.id}`}
                                label="Area"
                                value={e.area}
                                onChange={(area) =>
                                    updateEducation(e.id, { area })
                                }
                            />
                            <TextField
                                id={`edu-studytype-${e.id}`}
                                label="Study type"
                                value={e.studyType}
                                onChange={(studyType) =>
                                    updateEducation(e.id, { studyType })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`edu-start-${e.id}`}
                                label="Start date"
                                placeholder="YYYY-MM-DD"
                                value={e.startDate}
                                onChange={(startDate) =>
                                    updateEducation(e.id, { startDate })
                                }
                            />
                            <TextField
                                id={`edu-end-${e.id}`}
                                label="End date"
                                placeholder="YYYY-MM-DD"
                                value={e.endDate}
                                onChange={(endDate) =>
                                    updateEducation(e.id, { endDate })
                                }
                            />
                        </div>
                        <TextAreaField
                            id={`edu-note-${e.id}`}
                            label="Note"
                            value={e.note}
                            onChange={(note) => updateEducation(e.id, { note })}
                        />
                        <button
                            type="button"
                            className="btn"
                            aria-label={`Remove education entry ${idx + 1}`}
                            onClick={() =>
                                setEducation(
                                    v.education.filter((x) => x.id !== e.id),
                                )
                            }
                        >
                            Remove entry
                        </button>
                    </fieldset>
                ))}
                <button
                    type="button"
                    className="btn"
                    onClick={() =>
                        setEducation([...v.education, emptyEducationRow()])
                    }
                >
                    + Add education entry
                </button>
            </Section>

            {/* Skills */}
            <Section title="Skills">
                {v.skills.map((sk, idx) => (
                    <fieldset
                        key={sk.id}
                        className="rounded-md border border-[var(--color-norwegian-200)] dark:border-[var(--color-norwegian-700)] p-3 space-y-3"
                    >
                        <legend className="px-1 text-sm font-medium">
                            Skill group {idx + 1}
                        </legend>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <TextField
                                id={`skill-name-${sk.id}`}
                                label="Name"
                                value={sk.name}
                                onChange={(name) =>
                                    updateSkill(sk.id, { name })
                                }
                            />
                            <TextField
                                id={`skill-level-${sk.id}`}
                                label="Level (optional)"
                                value={sk.level}
                                onChange={(level) =>
                                    updateSkill(sk.id, { level })
                                }
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-1">Keywords</p>
                            <StringRowList
                                idPrefix={`skill-keyword-${sk.id}`}
                                itemLabel="Keyword"
                                rows={sk.keywords}
                                onChange={(keywords) =>
                                    updateSkill(sk.id, { keywords })
                                }
                            />
                        </div>
                        <button
                            type="button"
                            className="btn"
                            aria-label={`Remove skill group ${idx + 1}`}
                            onClick={() =>
                                setSkills(
                                    v.skills.filter((x) => x.id !== sk.id),
                                )
                            }
                        >
                            Remove skill group
                        </button>
                    </fieldset>
                ))}
                <button
                    type="button"
                    className="btn"
                    onClick={() => setSkills([...v.skills, emptySkillRow()])}
                >
                    + Add skill group
                </button>
            </Section>

            {/* Projects */}
            <Section title="Projects">
                {v.projects.map((p, idx) => (
                    <fieldset
                        key={p.id}
                        className="rounded-md border border-[var(--color-norwegian-200)] dark:border-[var(--color-norwegian-700)] p-3 space-y-3"
                    >
                        <legend className="px-1 text-sm font-medium">
                            Project {idx + 1}
                        </legend>
                        <TextField
                            id={`project-name-${p.id}`}
                            label="Name"
                            value={p.name}
                            onChange={(name) => updateProject(p.id, { name })}
                        />
                        <TextAreaField
                            id={`project-description-${p.id}`}
                            label="Description"
                            value={p.description}
                            onChange={(description) =>
                                updateProject(p.id, { description })
                            }
                        />
                        <TextField
                            id={`project-url-${p.id}`}
                            label="URL"
                            type="url"
                            value={p.url}
                            onChange={(url) => updateProject(p.id, { url })}
                        />
                        <div>
                            <p className="text-sm font-medium mb-1">Keywords</p>
                            <StringRowList
                                idPrefix={`project-keyword-${p.id}`}
                                itemLabel="Keyword"
                                rows={p.keywords}
                                onChange={(keywords) =>
                                    updateProject(p.id, { keywords })
                                }
                            />
                        </div>
                        <button
                            type="button"
                            className="btn"
                            aria-label={`Remove project ${idx + 1}`}
                            onClick={() =>
                                setProjects(
                                    v.projects.filter((x) => x.id !== p.id),
                                )
                            }
                        >
                            Remove project
                        </button>
                    </fieldset>
                ))}
                <button
                    type="button"
                    className="btn"
                    onClick={() =>
                        setProjects([...v.projects, emptyProjectRow()])
                    }
                >
                    + Add project
                </button>
            </Section>

            {formError ? (
                <p role="alert" className="text-sm text-red-600">
                    {formError}
                </p>
            ) : null}
            {saved ? (
                <p role="status" className="text-sm text-green-600">
                    Résumé saved.
                </p>
            ) : null}

            <div className="flex items-center gap-3 border-t border-[var(--tw-prose-td-borders)] pt-4">
                <button
                    type="button"
                    className="btn btn--primary"
                    disabled={isSaving}
                    onClick={() => void save()}
                >
                    {isSaving ? 'Saving…' : 'Save résumé'}
                </button>
            </div>
        </form>
    );
}
