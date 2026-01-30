import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'
import { analyzePair } from '../inspect-diff-ci-run'

function writePng(filename: string, width = 10, height = 10, fillFn?: (x: number, y: number, data: Uint8Array) => void) {
    const png = new PNG({ width, height })
    // white background
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2
            png.data[idx] = 255
            png.data[idx + 1] = 255
            png.data[idx + 2] = 255
            png.data[idx + 3] = 255
        }
    }
    if (fillFn) fillFn(0, 0, png.data)
    const buf = PNG.sync.write(png)
    fs.writeFileSync(filename, buf)
}

const tmp = path.join(__dirname, '__tmp__')
fs.rmSync(tmp, { recursive: true, force: true })
fs.mkdirSync(tmp, { recursive: true })

describe('inspect-diff-ci-run', () => {
    it('detects a single pixel difference', async () => {
        const a = path.join(tmp, 'a.png')
        const b = path.join(tmp, 'b.png')
        writePng(a)
        writePng(b, 10, 10, (x, y, data) => {
            // flip a single pixel at (5,5)
            const idx = (10 * 5 + 5) << 2
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            data[idx + 3] = 255
        })

        const report = await analyzePair(a, b)
        expect(report.mismatched).toBeGreaterThan(0)
        expect(report.ratio).toBeCloseTo(report.mismatched / (10 * 10))
        expect(report.bbox).toBeDefined()
        expect(report.topRows?.length).toBeGreaterThan(0)
    })
})
