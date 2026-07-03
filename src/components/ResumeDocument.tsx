import { formatDate } from '@/lib/dates';
import type { Resume, ResumeProfile, ResumeWork } from '@/lib/resume';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

/** Format a JSON Resume date range, treating an empty endDate as "Present". */
function formatRange(startDate: string, endDate?: string): string {
    const start = formatDate(startDate, { month: 'short' });
    const end = endDate ? formatDate(endDate, { month: 'short' }) : 'Present';
    return `${start} — ${end}`;
}

/** Strip a display phone to a `tel:`-safe value (digits, keep a leading +). */
function telHref(phone: string): string {
    const digits = phone.replace(/[^+\d]/g, '');
    return `tel:${digits}`;
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

export interface ResumeDocumentProps {
    resume: Resume;
    /**
     * When true, render the private contact block (email + phone). This is used
     * ONLY by the gated `/resume/full` render that feeds the downloadable PDF.
     * The public `/resume` page leaves it false so direct contact info never
     * reaches public HTML or JSON-LD (ADR 0007). When false, the header instead
     * shows the request call-to-action provided via `requestSlot`.
     */
    includePrivateContact?: boolean;
    /**
     * Optional call-to-action rendered in the header of the PUBLIC variant only
     * (ignored when `includePrivateContact` is true). This is where the public
     * `/resume` page injects the interactive `<ResumeRequestButton />` client
     * component — passing it as a child keeps `ResumeDocument` a server
     * component and keeps the request UI out of the `/resume/full` PDF render.
     */
    requestSlot?: React.ReactNode;
}

/**
 * Presentational résumé document shared by the public `/resume` page and the
 * gated `/resume/full` render. The single `includePrivateContact` switch is the
 * one difference between them, which keeps the privacy boundary in exactly one
 * place.
 */
export function ResumeDocument({
    resume,
    includePrivateContact = false,
    requestSlot,
}: ResumeDocumentProps) {
    const { basics, work, education, skills, projects } = resume;
    const privateContact = includePrivateContact
        ? basics.privateContact
        : undefined;

    // schema.org Person, embedded in a ProfilePage. Emitted as JSON-LD for
    // search engines / rich results. Never carries private contact info.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: `${SITE_URL}/resume`,
        mainEntity: {
            '@type': 'Person',
            name: basics.name,
            jobTitle: basics.label,
            url: basics.url,
            ...(basics.summary ? { description: basics.summary } : {}),
            ...(basics.location
                ? {
                      address: {
                          '@type': 'PostalAddress',
                          ...(basics.location.city
                              ? { addressLocality: basics.location.city }
                              : {}),
                          ...(basics.location.region
                              ? { addressRegion: basics.location.region }
                              : {}),
                          ...(basics.location.countryCode
                              ? { addressCountry: basics.location.countryCode }
                              : {}),
                      },
                  }
                : {}),
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
                {basics.location ? (
                    <p className="text-sm text-muted text-center !mt-0 !mb-2">
                        {[basics.location.city, basics.location.region]
                            .filter(Boolean)
                            .join(', ')}
                    </p>
                ) : null}
                {/* Contact line. On the public page this is the site + profile
                    links only; on the gated full render it also carries the
                    private email/phone (ADR 0007). */}
                <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm !mb-2">
                    {privateContact?.email ? (
                        <a href={`mailto:${privateContact.email}`}>
                            {privateContact.email}
                        </a>
                    ) : null}
                    {privateContact?.phone ? (
                        <a href={telHref(privateContact.phone)}>
                            {privateContact.phone}
                        </a>
                    ) : null}
                    <a href={basics.url} rel="noopener noreferrer">
                        {basics.url.replace(/^https?:\/\//, '')}
                    </a>
                </p>
                <div className="flex justify-center">
                    <ProfileLinks profiles={basics.profiles} />
                </div>

                {/* The full résumé (with complete contact details) is available
                    on request to verified signed-in users. The interactive
                    request control is injected via `requestSlot` (a client
                    component) so this document stays a server component and the
                    request UI never reaches the `/resume/full` PDF render. */}
                {includePrivateContact ? null : requestSlot}
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
                            {ed.note ? (
                                <p className="text-sm !mt-1 !mb-0">{ed.note}</p>
                            ) : null}
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
