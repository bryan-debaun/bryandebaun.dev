import Link from 'next/link';

export default function Home() {
    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none">
            <h1 className="font-bold">Hi, I&apos;m Bryan DeBaun.</h1>
            <p className="text-lg">
                A Software Engineer focused on building reliable, scalable web
                apps and developer tools. This site is where I share my
                projects, writing, and what I&apos;m reading.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <Link
                    href="/projects"
                    className="block w-full sm:inline-block sm:w-auto text-center rounded px-4 py-3 no-underline btn btn--primary"
                >
                    See projects
                </Link>
            </div>
        </div>
    );
}
