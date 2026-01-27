#!/usr/bin/env node
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export function runContentWithSpawn(spawnFn: (cmd: string, args: string[], opts: any) => any): Promise<number> {
    return new Promise((resolve, reject) => {
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
    return runContentWithSpawn(spawn)
}

export async function main(): Promise<void> {
    try {
        await runContent()
        process.exit(0)
    } catch (e: any) {
        console.error('Content build wrapper: failing with', e)
        process.exit(typeof e.code === 'number' ? e.code : 1)
    }
}

// When executed directly, run CLI entrypoint;
if (process.argv[1] && (process.argv[1].endsWith('run-content.ts') || process.argv[1].endsWith('run-content.js'))) {
    main()
}
