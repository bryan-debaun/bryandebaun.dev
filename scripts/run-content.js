#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

function runContent() {
    return new Promise((resolve, reject) => {
        const cp = spawn('npx', ['contentlayer', 'build', '--clearCache'], { shell: true })

        let out = ''
        let err = ''
        cp.stdout.on('data', (d) => { out += d.toString(); process.stdout.write(d) })
        cp.stderr.on('data', (d) => { err += d.toString(); process.stderr.write(d) })

        cp.on('error', (e) => reject({ code: 1, error: e }))
        cp.on('close', (code) => {
            const combined = out + '\n' + err
            const generatedMatch = /Generated\s+(\d+)\s+documents in \\.contentlayer/i.exec(combined)
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

async function main() {
    try {
        await runContent()
        process.exit(0)
    } catch (e) {
        console.error('Content build wrapper: failing with', e)
        process.exit(typeof e.code === 'number' ? e.code : 1)
    }
}

main()
