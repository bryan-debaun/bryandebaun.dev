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

            <h3>Work & Passions</h3>
            <p>Selected work, passions, and advocacy are surfaced in the sections below.</p>

            <h3>Why BAD?</h3>
            <p>
                BAD stands for Bryan A. DeBaun, but the word isn&apos;t an accident.
                It&apos;s a deliberate contrast — a reminder that &quot;good&quot; and &quot;bad&quot; in
                software are rarely absolute. The name sticks, and that&apos;s the point.
            </p>

            <NowReading />

            <PhilosophyList />
        </div>
    );
}
