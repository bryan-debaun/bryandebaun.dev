#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function getArg(name: string, def?: string) {
    const argv = process.argv.slice(2);
    const idx = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return def;
    const val = argv[idx].includes('=') ? argv[idx].split('=')[1] : argv[idx + 1];
    return val || def;
}

const manifestRel = getArg('manifest', 'public/icons/site.webmanifest')!;
const manifestPath = path.resolve(process.cwd(), manifestRel);

if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(2);
}

type Manifest = { icons?: Array<{ src?: string }> }

let manifest: unknown;
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? (e as { message?: string }).message : String(e);
    console.error('Failed to parse manifest:', msg);
    process.exit(2);
}

const icons = (manifest && typeof manifest === 'object' && 'icons' in manifest && Array.isArray((manifest as Manifest).icons))
    ? (manifest as Manifest).icons!
    : [];
const missing: string[] = [];

icons.forEach((icon) => {
    if (!icon || typeof icon !== 'object') return;
    const raw = (icon as { src?: string }).src;
    if (!raw) return;
    const rel = raw.startsWith('/') ? raw.slice(1) : raw;
    // Try expected locations: project root (rare), and public/ (Next.js public)
    const candidates = [
        path.resolve(process.cwd(), rel),
        path.resolve(process.cwd(), 'public', rel)
    ];
    const exists = candidates.some((p) => fs.existsSync(p));
    if (!exists) missing.push(raw);
});

if (missing.length) {
    console.error('Missing icon files referenced in manifest:');
    missing.forEach((m) => console.error('  -', m));
    process.exit(1);
}

// Ensure the primary icon is the wolf icon to avoid accidental regressions where a different
// icon (e.g., the "badge") becomes the default PWA icon.
const firstIconSrc = icons && icons[0] && typeof icons[0].src === 'string' ? icons[0].src : '';
if (!/wolf/.test(firstIconSrc)) {
    console.error('Primary manifest icon should be the wolf icon, but manifest lists:', firstIconSrc);
    process.exit(1);
}

console.log('All manifest icon files exist.');
process.exit(0);
