#!/usr/bin/env node
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// Preserve original fs methods so tests that mock fs won't cause normalization to write mocked data
const realFs = {
    readFileSync: fs.readFileSync.bind(fs),
    writeFileSync: fs.writeFileSync.bind(fs),
    readdirSync: fs.readdirSync.bind(fs),
    existsSync: fs.existsSync.bind(fs),
    statSync: fs.statSync.bind(fs),
}

export type NormalizeOptions = { apply?: boolean; backup?: boolean }

export function normalizeContentFiles(rootDir: string = path.join(process.cwd(), 'src', 'content'), options: NormalizeOptions = { apply: false, backup: true }) {
    // Recursively walk directory and collect .md/.mdx files using original fs
    function walk(dir: string): string[] {
        const entries = realFs.readdirSync(dir, { withFileTypes: true })
        let files: string[] = []
        for (const e of entries) {
            const p = path.join(dir, e.name)
            if (e.isDirectory()) files = files.concat(walk(p))
            else if (e.isFile() && /\.(md|mdx)$/.test(e.name)) files.push(p)
        }
        return files
    }

    if (!realFs.existsSync(rootDir)) return { files: [], applied: [] }
    const files = walk(rootDir)
    const changed: string[] = []
    const applied: string[] = []

    for (const f of files) {
        let s = realFs.readFileSync(f, 'utf8')
        const orig = s
        // Normalize CRLF -> LF, remove stray CR, trim trailing whitespace per-line, ensure trailing newline
        s = s.replace(/\r\n/g, '\n').replace(/\r/g, '')
        s = s.replace(/[ \t]+$/gm, '')
        if (!s.endsWith('\n')) s += '\n'
        if (s !== orig) {
            changed.push(path.relative(process.cwd(), f))
            if (options.apply) {
                // backup if requested
                if (options.backup) {
                    const bak = `${f}.${Date.now()}.bak`
                    realFs.writeFileSync(bak, orig, 'utf8')
                    console.log(`Backup written: ${path.relative(process.cwd(), bak)}`)
                }
                realFs.writeFileSync(f, s, 'utf8')
                applied.push(path.relative(process.cwd(), f))
                console.log(`Applied normalization: ${path.relative(process.cwd(), f)}`)
            }
        }
    }

    if (changed.length > 0) {
        console.log(`Normalization: ${changed.length} file(s) require normalization.`)
        if (!options.apply) {
            console.log('Dry run: no files were modified. Re-run with --apply-normalize or set CONTENT_NORMALIZE_APPLY=1 to apply changes.')
        }
    }

    return { files: changed, applied }
}

type SpawnLike = {
    stdout: { on: (event: 'data', cb: (d: Buffer) => void) => void }
    stderr: { on: (event: 'data', cb: (d: Buffer) => void) => void }
    on(event: 'error', cb: (e: Error) => void): void
    on(event: 'close', cb: (code: number) => void): void
}

type SpawnFn = (cmd: string, args: string[], opts: { shell: boolean }) => SpawnLike

export function runContentWithSpawn(spawnFn: SpawnFn, opts?: { normalizeFn?: (rootDir?: string, options?: NormalizeOptions) => { files: string[]; applied: string[] } }): Promise<number> {
    return new Promise((resolve, reject) => {
        try {
            // Decide whether to actually apply normalization or just dry-run
            const applyFlag = process.env.CONTENT_NORMALIZE_APPLY === '1' || process.env.CONTENT_NORMALIZE_APPLY === 'true' || process.argv.includes('--apply-normalize')
            const normalizeFn = opts?.normalizeFn ?? normalizeContentFiles
            const res = normalizeFn(undefined, { apply: applyFlag, backup: true })
            if (res.files.length > 0 && !applyFlag) {
                console.error('Content normalization required: some content files need normalization (LF endings / trimmed whitespace).')
                console.error('Please run `npm run normalize-content` and commit the changes before retrying the build.')
                reject({ code: 3, message: 'content normalization required' })
                return
            }
        } catch (e) {
            console.error('Content normalization failed', e)
            reject({ code: 1, message: 'content normalization failed' })
            return
        }

        // Ensure contentlayer2 is installed locally. If NODE_ENV is set to 'production' globally, devDependencies may be skipped and
        // contentlayer2 will be missing from node_modules. Provide a clear error message if that's the case.
        const cp = spawnFn('npx', ['contentlayer2', 'build', '--clearCache'], { shell: true })

        let out = ''
        let err = ''
        cp.stdout.on('data', (d: Buffer) => { out += d.toString(); process.stdout.write(d) })
        cp.stderr.on('data', (d: Buffer) => { err += d.toString(); process.stderr.write(d) })

        cp.on('error', (e: Error) => reject({ code: 1, error: e }))
        cp.on('close', (code: number) => {
            const combined = out + '\n' + err
            const generatedMatch = /Generated\s+(\d+)\s+documents in \\\.contentlayer/i.exec(combined)
            if (generatedMatch) {
                const n = Number(generatedMatch[1])
                if (n > 0) {
                    console.log(`Contentlayer: ${n} documents generated — treating as success.`)
                    resolve(0)
                    return
                }
                console.error('Contentlayer generated 0 documents — failing content build')
                reject({ code: 2, message: '0 documents generated' })
                return
            }

            // Fallback: check generated index file
            const idx = path.join(process.cwd(), '.contentlayer', 'generated', 'Post', '_index.json')
            if (fs.existsSync(idx)) {
                try {
                    const data = JSON.parse(fs.readFileSync(idx, 'utf8'))
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`Contentlayer: found ${data.length} generated docs (index). Treating as success.`)
                        resolve(0)
                        return
                    }
                } catch {
                    // fallthrough
                }
            }

            if (code === 0) {
                console.log('Contentlayer exited with code 0 but no generated count found; treating as success.')
                resolve(0)
                return
            }

            console.error('Contentlayer build failed with exit code', code)
            reject({ code: code || 1, out, err })
        })
    })
}

export function runContent(): Promise<number> {
    // Verify contentlayer2 is available when running the real spawn path. This gives a helpful error message for devs who
    // have NODE_ENV=production set and skipped installing devDependencies. Tests that call `runContentWithSpawn` directly will
    // bypass this check and can simulate errors via the provided spawn function.
    try {
        require.resolve('contentlayer2')
    } catch {
        // Some package versions may not expose an "exports" field that `require.resolve` can resolve.
        // Rather than failing hard, emit a warning and proceed to spawn the CLI; if the spawned process fails
        // we'll catch that below and surface a meaningful error.
        console.warn("Warning: require.resolve('contentlayer2') failed — attempting to spawn the contentlayer CLI. If this fails, run `npm ci --include=dev` to install devDependencies.")
    }

    return runContentWithSpawn(spawn)
}

export async function main(): Promise<void> {
    try {
        await runContent()
        process.exit(0)
    } catch (e: unknown) {
        console.error('Content build wrapper: failing with', e)
        if (typeof e === 'object' && e !== null && 'code' in e && typeof (e as { code?: number }).code === 'number') {
            process.exit((e as { code: number }).code)
        }
        process.exit(1)
    }
}

// When executed directly, run CLI entrypoint;
if (process.argv[1] && (process.argv[1].endsWith('run-content.ts') || process.argv[1].endsWith('run-content.js'))) {
    main()
}
