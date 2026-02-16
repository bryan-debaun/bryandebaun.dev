import React from 'react';

export const metadata = {
    title: 'Visual Snapshot — Stable',
};

export default function VisualSnapPage() {
    return (
        <main className="mx-auto max-w-3xl p-8">
            <header className="mb-6">
                <h1 className="text-4xl font-semibold">Visual snapshot — stable fixture</h1>
                <p className="mt-2 text-gray-600">This page is intentionally static and deterministic for visual tests.</p>
            </header>

            <section className="space-y-6">
                <div className="rounded-lg border p-4 shadow-sm">
                    <h2 className="text-2xl font-medium">Card title</h2>
                    <p className="mt-2 text-gray-700">Fixed content that should not change across PRs.</p>
                    <div className="mt-4 flex gap-3">
                        <button className="px-4 py-2 bg-slate-900 text-white rounded">Primary</button>
                        <button className="px-4 py-2 border rounded">Secondary</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <article className="rounder p-4 border">
                        <h3 className="font-medium">List</h3>
                        <ul className="mt-2 list-disc pl-6 text-gray-700">
                            <li>Static item one</li>
                            <li>Static item two</li>
                            <li>Static item three</li>
                        </ul>
                    </article>
                    <article className="rounder p-4 border">
                        <h3 className="font-medium">Meta</h3>
                        <pre className="mt-2 bg-gray-50 p-2 rounded text-sm">{`{ "stable": true, "version": "v1" }`}</pre>
                    </article>
                </div>
            </section>

            <footer className="mt-12 text-sm text-gray-500">Do not put dynamic content here — this page is for visual regression baselines.</footer>
        </main>
    );
}
