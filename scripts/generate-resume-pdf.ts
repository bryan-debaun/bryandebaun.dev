#!/usr/bin/env tsx
/**
 * Generate public/resume.pdf from the running site's /resume page.
 *
 * Like the a11y / visual scripts in scripts/a11y/, this loads a RUNNING server
 * and drives a real browser — it does NOT spin up Next itself. Start a server
 * first, then run this:
 *
 *   # terminal 1
 *   pnpm dev            # or: pnpm build && pnpm start
 *
 *   # terminal 2
 *   pnpm resume:pdf                                   # default http://localhost:3000
 *   pnpm resume:pdf --url https://bryandebaun.dev     # against a deployed site
 *
 * The page's `@media print` rules (src/app/globals.css) hide site chrome and
 * force an ink-friendly palette; `printBackground: true` honours them.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

interface Options {
    url: string;
    out: string;
}

function parseOptions(): Options {
    const argv = process.argv.slice(2);
    const urlArgIndex = argv.findIndex((v) => v === '--url');
    const outArgIndex = argv.findIndex((v) => v === '--out');
    const baseUrl =
        urlArgIndex >= 0
            ? argv[urlArgIndex + 1]
            : process.env.RESUME_URL || 'http://localhost:3000';
    const out =
        outArgIndex >= 0
            ? argv[outArgIndex + 1]
            : path.join(process.cwd(), 'public', 'resume.pdf');
    const url = `${baseUrl.replace(/\/$/, '')}/resume`;
    return { url, out };
}

function extractErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
    ) {
        return (err as { message: string }).message;
    }
    return String(err);
}

async function run(): Promise<void> {
    const { url, out } = parseOptions();
    fs.mkdirSync(path.dirname(out), { recursive: true });

    console.log(`Generating resume PDF from ${url} → ${out}`);

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response || !response.ok()) {
            throw new Error(
                `Failed to load ${url} (status ${response ? response.status() : 'no response'}). Is the server running?`,
            );
        }

        // Emulate print media so @media print rules apply to the PDF.
        await page.emulateMedia({ media: 'print' });

        await page.pdf({
            path: out,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '18mm',
                right: '16mm',
                bottom: '18mm',
                left: '16mm',
            },
        });

        const { size } = fs.statSync(out);
        if (size === 0) {
            throw new Error(`Wrote an empty PDF to ${out}`);
        }
        console.log(`Wrote ${out} (${(size / 1024).toFixed(1)} KB)`);
    } finally {
        await browser.close();
    }
}

run().catch((err) => {
    const msg = extractErrorMessage(err);
    console.error('Failed to generate resume PDF:', msg);
    if (
        msg.includes("Executable doesn't exist") ||
        msg.includes('Please run the following command to download new browsers')
    ) {
        console.error(
            '\nPlaywright is missing browser binaries. Install them with:\n\n  pnpm exec playwright install\n',
        );
    }
    process.exit(1);
});
