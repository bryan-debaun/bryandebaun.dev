import type { Metadata } from 'next';
import Link from 'next/link';
import NowReading from '@/components/NowReading';
import PhilosophyList from '@/components/PhilosophyList';
import WorkPassions from '@/components/WorkPassions';

export const metadata: Metadata = {
    title: 'About — Bryan DeBaun',
    description:
        'Bryan DeBaun — a Senior Software Engineer focused on web platforms, cloud-native systems, and developer tools.',
};

export default function About() {
    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none">
            <h2>About</h2>
            <p>
                I&apos;m Bryan DeBaun — a Senior Software Engineer who focuses
                on web platforms, cloud-native systems, and developer tools. I
                enjoy building reliable systems and clear developer experiences.
            </p>

            <h3>Why BAD?</h3>
            <p>
                BAD stands for Bryan A. DeBaun, but the word isn&apos;t an
                accident. It&apos;s a deliberate contrast — a reminder that
                &quot;good&quot; and &quot;bad&quot; in software are rarely
                absolute. The name sticks, and that&apos;s the point.
            </p>

            <WorkPassions />

            <NowReading />

            <PhilosophyList />

            <h3>Reading</h3>
            <p>
                I keep a small, curated list of the books I&apos;m reading, with
                personal ratings and short notes. You can browse them on the{' '}
                <Link
                    href="/media"
                    className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                >
                    Media
                </Link>{' '}
                page.
            </p>

            <h3>Get in touch</h3>
            <p>
                Want to reach out? You can get in touch via the{' '}
                <Link
                    href="/contact"
                    className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                >
                    Contact
                </Link>{' '}
                page, or see my{' '}
                <Link
                    href="/resume"
                    className="text-[var(--color-norwegian-700)] hover:underline dark:text-[var(--color-white)]"
                >
                    Resume
                </Link>
                .
            </p>
        </div>
    );
}
