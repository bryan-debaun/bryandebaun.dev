import NowReading from '@/components/NowReading'
import PhilosophyList from '@/components/PhilosophyList'

export default function About() {
    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>About</h2>
            <p>
                I&apos;m Bryan DeBaun — a Senior Software Engineer who focuses on web
                platforms, cloud-native systems, and developer tools. I enjoy building
                reliable systems and clear developer experiences.
            </p>
            <p>
                This site shows selected projects, writings, and demos that highlight my
                technical approach and engineering craft.
            </p>

            <h3>Work & Passions</h3>
            <p>Selected work, passions, and advocacy are surfaced in the sections below.</p>

            <NowReading />

            <PhilosophyList />
        </div>
    );
}
