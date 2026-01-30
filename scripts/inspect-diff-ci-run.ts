/**
 * scripts/inspect-diff-ci-run.ts
 *
 * CLI to analyze visual-diff artifacts from CI runs.
 * Usage: `npm run inspect:ci -- <runDir>` (defaults to ./gh_artifacts)
 * Produces: <runDir>/inspect-report.json and saves per-image diffs to <runDir>/reports
 */

import fs from 'fs/promises'
import path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

export type DiffBBox = { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number }
export type ImageReport = {
    name: string
    baseline: string
    current: string
    mismatched: number
    ratio: number
    bbox?: DiffBBox
    topRows?: Array<{ row: number; count: number }>
}

function padImage(img: PNG, width: number, height: number) {
    if (img.width === width && img.height === height) return img
    const outImg = new PNG({ width, height })
    // transparent
    outImg.data.fill(0)
    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            const srcIdx = (img.width * y + x) << 2
            const dstIdx = (width * y + x) << 2
            outImg.data[dstIdx] = img.data[srcIdx]
            outImg.data[dstIdx + 1] = img.data[srcIdx + 1]
            outImg.data[dstIdx + 2] = img.data[srcIdx + 2]
            outImg.data[dstIdx + 3] = img.data[srcIdx + 3]
        }
    }
    return outImg
}

export async function analyzePair(baseFile: string, curFile: string, outFile?: string): Promise<ImageReport> {
    const baseBuf = await fs.readFile(baseFile)
    const curBuf = await fs.readFile(curFile)
    const a = PNG.sync.read(baseBuf)
    const b = PNG.sync.read(curBuf)

    const width = Math.max(a.width, b.width)
    const height = Math.max(a.height, b.height)
    const aP = padImage(a, width, height)
    const bP = padImage(b, width, height)
    const out = new PNG({ width, height })

    const mismatched = pixelmatch(aP.data, bP.data, out.data, width, height, { threshold: 0.1 })
    const ratio = mismatched / (width * height)

    // bbox
    let minX = width,
        minY = height,
        maxX = 0,
        maxY = 0
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2
            const r = out.data[idx],
                g = out.data[idx + 1],
                bC = out.data[idx + 2],
                aC = out.data[idx + 3]
            if (r || g || bC || aC) {
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
            }
        }
    }

    let bbox: DiffBBox | undefined
    let topRows: Array<{ row: number; count: number }> | undefined
    if (minX <= maxX && minY <= maxY) {
        bbox = { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 }
        const rows = new Array<number>(height).fill(0)
        for (let y = 0; y < height; y++) {
            let count = 0
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) << 2
                if (out.data[idx] || out.data[idx + 1] || out.data[idx + 2] || out.data[idx + 3]) count++
            }
            rows[y] = count
        }
        topRows = rows
            .map((c, i) => ({ row: i, count: c }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    }

    if (outFile) {
        await fs.mkdir(path.dirname(outFile), { recursive: true })
        await fs.writeFile(outFile, PNG.sync.write(out))
    }

    return {
        name: path.basename(baseFile).replace('-baseline.png', ''),
        baseline: baseFile,
        current: curFile,
        mismatched,
        ratio,
        bbox,
        topRows,
    }
}

export async function analyzeRun(runDir: string): Promise<{ reports: ImageReport[]; reportFile: string }> {
    const diffsDir = path.join(runDir, 'diffs')
    const outReports: ImageReport[] = []
    if (!(await exists(diffsDir))) {
        throw new Error(`diffs directory not found: ${diffsDir}. If you deleted artifacts, re-download the CI run artifacts or pass the run folder path as an argument to this script.`)
    }
    const files = await fs.readdir(diffsDir)
    const baselines = files.filter((f) => f.endsWith('-baseline.png'))
    for (const b of baselines) {
        const name = b.replace('-baseline.png', '')
        const baseFile = path.join(diffsDir, `${name}-baseline.png`)
        const curFile = path.join(diffsDir, `${name}-current.png`)
        if (!(await exists(curFile))) continue
        const outFile = path.join(runDir, 'reports', `${name}-diff.png`)
        const report = await analyzePair(baseFile, curFile, outFile)
        outReports.push(report)
    }
    const reportFile = path.join(runDir, 'inspect-report.json')
    await fs.writeFile(reportFile, JSON.stringify({ reports: outReports }, null, 2))
    return { reports: outReports, reportFile }
}

async function exists(p: string) {
    try {
        await fs.access(p)
        return true
    } catch {
        return false
    }
}

if (require.main === module) {
    ; (async () => {
        const runDir = process.argv[2] || './gh_artifacts'
        try {
            const res = await analyzeRun(runDir)
            for (const r of res.reports) {
                console.log(r.name, 'mismatched', r.mismatched, 'ratio', r.ratio)
            }
            console.log('wrote report to', res.reportFile)
        } catch (err) {
            console.error('error analyzing run:', err)
            process.exit(1)
        }
    })()
}
