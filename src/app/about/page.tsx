import NowReading from '@/components/NowReading';
import PhilosophyList from '@/components/PhilosophyList';
import WorkPassions from '@/components/WorkPassions';

export default function About() {
    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none site-bleed">
            <h2>About</h2>
            <p>
                I&apos;m Bryan DeBaun — a Senior Software Engineer who focuses on web
                platforms, cloud-native systems, and developer tools. I enjoy building
                reliable systems and clear developer experiences.
            </p>

            <h3>Why BAD?</h3>
            <p>
                BAD stands for Bryan A. DeBaun, but the word isn&apos;t an accident.
                It&apos;s a deliberate contrast — a reminder that &quot;good&quot; and &quot;bad&quot; in
                software are rarely absolute. The name sticks, and that&apos;s the point.
            </p>

            <WorkPassions />

            <NowReading />

            <PhilosophyList />

            <h3>Media</h3>
            <p>
                I keep a small, curated list of books, movies, games, and creators I enjoy.
                You can view them on the <a href="/media" className="text-[var(--color-norwegian-600)] hover:underline">Media</a> page.
            </p>
        </div>
    );
}
