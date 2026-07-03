#!/usr/bin/env tsx
/**
 * Generate the CONTACT-BEARING résumé PDF and upload it to a private Supabase
 * Storage bucket (ADR 0007, Phase 1).
 *
 * The public /resume page no longer has a downloadable PDF — the only PDF is the
 * "full" one (with email + phone), which is gated. This script:
 *   1. drives a real browser over a RUNNING server's /resume/full render,
 *      sending the `x-resume-token` header so the gated page will render;
 *   2. produces the PDF honouring the page's `@media print` rules; and
 *   3. uploads it to the PRIVATE bucket `resume-private` (created if missing),
 *      overwriting the stable object key. Phase 2 mints a signed URL for it.
 *
 * It does NOT spin up Next itself — start a server first:
 *
 *   # terminal 1
 *   doppler run -- pnpm dev            # or: pnpm build && pnpm start
 *
 *   # terminal 2 (env provides RESUME_FULL_TOKEN + Supabase secret)
 *   doppler run -- pnpm resume:pdf
 *   doppler run -- pnpm resume:pdf --url https://bryandebaun.dev
 *   doppler run -- pnpm resume:pdf --out ./resume-full.pdf   # also save locally
 *
 * Required env (all supplied by Doppler):
 *   RESUME_FULL_TOKEN            header token to reach /resume/full
 *   NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
 *   SUPABASE_SECRET_KEY          service-role key (SUPABASE_SERVICE_ROLE_KEY accepted)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

// Keep in sync with src/lib/resume-download.ts (that module is server-only and
// can't be imported from a plain tsx script without path-alias/`server-only`
// friction, so the two constants are duplicated deliberately).
const RESUME_BUCKET = 'resume-private';
const RESUME_OBJECT_KEY = 'resume-full.pdf';

interface Options {
    url: string;
    localOut: string | null;
}

function parseOptions(): Options {
    const argv = process.argv.slice(2);
    const urlArgIndex = argv.findIndex((v) => v === '--url');
    const outArgIndex = argv.findIndex((v) => v === '--out');
    const baseUrl =
        urlArgIndex >= 0
            ? argv[urlArgIndex + 1]
            : process.env.RESUME_URL || 'http://localhost:3000';
    const localOut = outArgIndex >= 0 ? argv[outArgIndex + 1] : null;
    const url = `${baseUrl.replace(/\/$/, '')}/resume/full`;
    return { url, localOut };
}

function requireEnv(name: string, ...fallbacks: string[]): string {
    for (const key of [name, ...fallbacks]) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }
    throw new Error(
        `Missing required env ${name}. Run under Doppler (e.g. \`doppler run -- pnpm resume:pdf\`).`,
    );
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

async function renderPdf(url: string, token: string): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    try {
        // The token rides in a request header (not the URL) so it never lands
        // in access logs or the referrer.
        const context = await browser.newContext({
            extraHTTPHeaders: { 'x-resume-token': token },
        });
        const page = await context.newPage();
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response || !response.ok()) {
            const status = response ? response.status() : 'no response';
            throw new Error(
                `Failed to load ${url} (status ${status}). Is the server running, and does RESUME_FULL_TOKEN match the server's?`,
            );
        }

        // Emulate print media so @media print rules apply to the PDF.
        await page.emulateMedia({ media: 'print' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
        });
        if (pdf.length === 0) throw new Error('Generated an empty PDF.');
        return pdf;
    } finally {
        await browser.close();
    }
}

async function run(): Promise<void> {
    const { url, localOut } = parseOptions();
    const token = requireEnv('RESUME_FULL_TOKEN');
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = requireEnv(
        'SUPABASE_SECRET_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
    );

    console.log(`Rendering full résumé PDF from ${url}`);
    const pdf = await renderPdf(url, token);
    console.log(`Rendered PDF (${(pdf.length / 1024).toFixed(1)} KB)`);

    if (localOut) {
        const outPath = path.resolve(localOut);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, pdf);
        console.log(`Also wrote a local copy → ${outPath}`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Ensure the private bucket exists (idempotent). Ignore "already exists".
    const created = await supabase.storage.createBucket(RESUME_BUCKET, {
        public: false,
    });
    if (created.error && !/exist/i.test(created.error.message)) {
        throw new Error(
            `Failed to ensure bucket "${RESUME_BUCKET}": ${created.error.message}`,
        );
    }

    const upload = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(RESUME_OBJECT_KEY, pdf, {
            contentType: 'application/pdf',
            upsert: true,
        });
    if (upload.error) {
        throw new Error(`Upload failed: ${upload.error.message}`);
    }

    console.log(
        `Uploaded → ${RESUME_BUCKET}/${RESUME_OBJECT_KEY} (private). Phase 2 will mint a 72h signed URL on approval.`,
    );
}

run().catch((err) => {
    const msg = extractErrorMessage(err);
    console.error('Failed to generate/upload résumé PDF:', msg);
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
