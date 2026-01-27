#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function getArg(name: string, def?: string) {
    const argv = process.argv.slice(2)
    const idx = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
    if (idx === -1) return def
    const val = argv[idx].includes('=') ? argv[idx].split('=')[1] : argv[idx + 1]
    return val || def
}

const manifestRel = getArg('manifest', 'public/icons/site.webmanifest')!
const manifestPath = path.resolve(process.cwd(), manifestRel)

if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`)
    process.exit(2)
}

let manifest: any
try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
} catch (e: any) {
    console.error('Failed to parse manifest:', e.message)
    process.exit(2)
}

const icons = manifest.icons || []
const missing: string[] = []

icons.forEach((icon: any) => {
    if (!icon.src) return
    const raw = icon.src
    const rel = raw.startsWith('/') ? raw.slice(1) : raw
    // Try expected locations: project root (rare), and public/ (Next.js public)
    const candidates = [
        path.resolve(process.cwd(), rel),
        path.resolve(process.cwd(), 'public', rel)
    ]
    const exists = candidates.some((p) => fs.existsSync(p))
    if (!exists) missing.push(raw)
})

if (missing.length) {
    console.error('Missing icon files referenced in manifest:')
    missing.forEach((m) => console.error('  -', m))
    process.exit(1)
}

console.log('All manifest icon files exist.')
process.exit(0)
