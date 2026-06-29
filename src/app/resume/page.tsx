import type { Metadata } from 'next';
import { formatDate } from '@/lib/dates';
import {
    getResume,
    resumeHasPlaceholders,
    type ResumeProfile,
    type ResumeWork,
} from '@/lib/resume';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

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
        'Résumé of Bryan DeBaun — Senior Software Engineer. View online or download a PDF.',
    robots: isPlaceholder
        ? { index: false, follow: false }
        : { index: true, follow: true },
};

/** Format a JSON Resume date range, treating an empty endDate as "Present". */
function formatRange(startDate: string, endDate?: string): string {
    const start = formatDate(startDate, { month: 'short' });
    const end = endDate
        ? formatDate(endDate, { month: 'short' })
        : 'Present';
    return `${start} — ${end}`;
}

function ProfileLinks({ profiles }: { profiles: ResumeProfile[] }) {
    if (profiles.length === 0) return null;
    return (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {profiles.map((p) => (
                <a
                    key={`${p.network}-${p.url}`}
                    href={p.url}
                    rel="me noopener noreferrer"
                    target="_blank"
                >
                    {p.network}
                    {p.username ? ` (${p.username})` : ''}
                </a>
            ))}
        </p>
    );
}

function WorkEntry({ job }: { job: ResumeWork }) {
    return (
        <div className="resume-entry">
            <h4 className="!mb-0">
                {job.position}
                {' · '}
                {job.url ? (
                    <a href={job.url} rel="noopener noreferrer" target="_blank">
                        {job.name}
                    </a>
                ) : (
                    job.name
                )}
            </h4>
            <p className="text-sm text-muted !mt-0 !mb-1">
                {formatRange(job.startDate, job.endDate)}
            </p>
            {job.summary ? <p className="!mt-0">{job.summary}</p> : null}
            {job.highlights && job.highlights.length > 0 ? (
                <ul>
                    {job.highlights.map((h) => (
                        <li key={h}>{h}</li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

export default function ResumePage() {
    const { basics, work, education, skills, projects } = resume;

    // schema.org Person, embedded in a ProfilePage. Emitted as JSON-LD for
    // search engines / rich results. Mirrors the JSON-LD pattern used by the
    // writing slug page.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: `${SITE_URL}/resume`,
        mainEntity: {
            '@type': 'Person',
            name: basics.name,
            jobTitle: basics.label,
            email: `mailto:${basics.email}`,
            url: basics.url,
            ...(basics.summary ? { description: basics.summary } : {}),
            sameAs: basics.profiles.map((p) => p.url),
        },
    };

    return (
        <article className="resume-page prose prose-norwegian dark:prose-invert max-w-none">
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as a raw script body; content is a serialized object, not user HTML
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Basics header */}
            <header>
                <h2 className="!mb-1">{basics.name}</h2>
                <p className="lead !mt-0 text-center">{basics.label}</p>
                <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm !mb-2">
                    <a href={`mailto:${basics.email}`}>{basics.email}</a>
                    <a href={basics.url} rel="noopener noreferrer">
                        {basics.url.replace(/^https?:\/\//, '')}
                    </a>
                </p>
                <div className="flex justify-center">
                    <ProfileLinks profiles={basics.profiles} />
                </div>

                {/* Download PDF — points at the statically generated asset.
                    Generate/refresh it with `pnpm resume:pdf` (server running). */}
                <p className="resume-actions flex justify-center !mt-4">
                    <a
                        href="/resume.pdf"
                        className="btn btn--primary !no-underline"
                        download
                    >
                        Download PDF
                    </a>
                </p>

                {isPlaceholder ? (
                    <p className="resume-placeholder-note text-sm text-muted text-center">
                        This résumé is a placeholder scaffold (noindex). Real
                        content lands in{' '}
                        <code>src/data/resume.json</code>; the PDF is
                        generated via <code>pnpm resume:pdf</code>.
                    </p>
                ) : null}
            </header>

            {/* Summary */}
            {basics.summary ? (
                <section>
                    <h3>Summary</h3>
                    <p>{basics.summary}</p>
                </section>
            ) : null}

            {/* Work timeline */}
            {work.length > 0 ? (
                <section>
                    <h3>Experience</h3>
                    {work.map((job) => (
                        <WorkEntry
                            key={`${job.name}-${job.startDate}`}
                            job={job}
                        />
                    ))}
                </section>
            ) : null}

            {/* Education */}
            {education.length > 0 ? (
                <section>
                    <h3>Education</h3>
                    {education.map((ed) => (
                        <div
                            key={`${ed.institution}-${ed.startDate}`}
                            className="resume-entry"
                        >
                            <h4 className="!mb-0">
                                {ed.studyType}
                                {ed.area ? `, ${ed.area}` : ''}
                            </h4>
                            <p className="text-sm text-muted !mt-0 !mb-0">
                                {ed.url ? (
                                    <a
                                        href={ed.url}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        {ed.institution}
                                    </a>
                                ) : (
                                    ed.institution
                                )}
                                {' · '}
                                {formatRange(ed.startDate, ed.endDate)}
                            </p>
                        </div>
                    ))}
                </section>
            ) : null}

            {/* Skills */}
            {skills.length > 0 ? (
                <section>
                    <h3>Skills</h3>
                    <ul>
                        {skills.map((skill) => (
                            <li key={skill.name}>
                                <strong>{skill.name}:</strong>{' '}
                                {skill.keywords.join(', ')}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {/* Projects */}
            {projects.length > 0 ? (
                <section>
                    <h3>Projects</h3>
                    {projects.map((project) => (
                        <div key={project.name} className="resume-entry">
                            <h4 className="!mb-0">
                                {project.url ? (
                                    <a
                                        href={project.url}
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        {project.name}
                                    </a>
                                ) : (
                                    project.name
                                )}
                            </h4>
                            <p className="!mt-0">{project.description}</p>
                            {project.keywords && project.keywords.length > 0 ? (
                                <p className="text-sm text-muted !mt-0">
                                    {project.keywords.join(', ')}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </section>
            ) : null}
        </article>
    );
}
