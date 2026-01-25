import Link from "next/link";

export default function Home() {
  return (
    <div className="prose prose-norwegian dark:prose-invert max-w-none">
      <h1 className="font-bold">Hi, I&apos;m Bryan DeBaun.</h1>
      <p className="text-lg">Senior software engineer — building reliable, scalable web apps and developer tools. This site showcases projects, writing, and technical demos.</p>
      <p className="mt-6">
        <Link href="/projects" className="inline-block rounded border px-4 py-2 no-underline btn">See projects</Link>
        <Link href="/blog" className="ml-4 inline-block rounded border px-4 py-2 no-underline btn">Read blog</Link>
      </p>
    </div>
  );
}
