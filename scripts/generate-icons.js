#!/usr/bin/env node
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Simple CLI parsing (supports --src value or --src=value)
const argv = process.argv.slice(2);

function getArg(name, def) {
    const idx = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return def;
    const val = argv[idx].includes('=') ? argv[idx].split('=')[1] : argv[idx + 1];
    return val || def;
}

function hasFlag(name) {
    return argv.includes(`--${name}`);
}

if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage: node scripts/generate-icons.js [--src <path>] [--out <dir>] [--sizes <csv>] [--ico]

Options:
  --src     Source SVG/PNG (default: public/icons/omega-wolf.svg)
  --out     Output directory (default: public/icons)
  --sizes   Comma separated list of sizes (default: 16,32,48,96,180,192,512)
  --ico     (optional) Generate an .ico file (not implemented in this script)
`);
    process.exit(0);
}

const srcArg = getArg('src', 'public/icons/omega-wolf.svg');
const outArg = getArg('out', 'public/icons');
const sizesArg = getArg('sizes', '16,32,48,96,180,192,512');
const makeIco = hasFlag('ico');

const src = path.resolve(process.cwd(), srcArg);
const outDir = path.resolve(process.cwd(), outArg);
const sizes = Array.from(new Set(sizesArg.split(',').map(s => parseInt(s, 10)).filter(Boolean))).sort((a, b) => a - b);

if (!fs.existsSync(src)) {
    console.error('Source not found:', src);
    process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(src, path.extname(src));

async function generate() {
    console.log('Generating icons for', src);
    await Promise.all(sizes.map(async (s) => {
        const outPath = path.join(outDir, `${base}-${s}x${s}.png`);
        await sharp(src, { density: 300 })
            .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png({ compressionLevel: 9 })
            .toFile(outPath);
        console.log('Created', outPath);
    }));

    if (makeIco) {
        console.warn('.ico generation requested but not implemented. You can use existing ico tools or add png-to-ico as needed.');
    }

    console.log('Done.');
}

generate().catch((err) => {
    console.error(err);
    process.exit(1);
});