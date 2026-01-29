import path from 'path'
import fs from 'fs'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { test, expect, type Page } from '@playwright/test'

const BASELINE_DIR = path.join(process.cwd(), 'tests/visual/baselines')
const DIFF_DIR = path.join(process.cwd(), 'artifacts/a11y/diffs')

// Utility: disable animations and force deterministic font stack
async function stabilizePage(page: Page) {
    await page.addStyleTag({
        content: `
    *,*::before,*::after{transition:none !important; animation:none !important}
    html{font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial !important}
  `,
    })
}

async function compareWithBaseline(name: string, buffer: Buffer) {
    const baselinePath = path.join(BASELINE_DIR, name)
    if (!fs.existsSync(baselinePath)) throw new Error(`Baseline not found: ${baselinePath}`)

    const baselineBuf = fs.readFileSync(baselinePath)

    const imgA = PNG.sync.read(buffer)
    const imgB = PNG.sync.read(baselineBuf)

    // Crop to the overlapping region (top-left) to tolerate small height differences
    const cmpWidth = Math.min(imgA.width, imgB.width)
    const cmpHeight = Math.min(imgA.height, imgB.height)

    function crop(img: PNG, w: number, h: number) {
        const out = new PNG({ width: w, height: h })
        for (let y = 0; y < h; y++) {
            const rowStartA = y * img.width * 4
            const rowStartOut = y * w * 4
            img.data.copy(out.data, rowStartOut, rowStartA, rowStartA + w * 4)
        }
        return out
    }

    const a = crop(imgA, cmpWidth, cmpHeight)
    const b = crop(imgB, cmpWidth, cmpHeight)
    const diff = new PNG({ width: cmpWidth, height: cmpHeight })
    const mismatched = pixelmatch(a.data, b.data, diff.data, cmpWidth, cmpHeight, { threshold: 0.1 })
    const ratio = mismatched / (cmpWidth * cmpHeight)

    if (mismatched > 0) {
        fs.mkdirSync(DIFF_DIR, { recursive: true })
        const diffPath = path.join(DIFF_DIR, `${name.replace(/\.png$/, '')}-diff.png`)
        fs.writeFileSync(diffPath, PNG.sync.write(diff))
        // write the full current screenshot for debugging
        fs.writeFileSync(path.join(DIFF_DIR, `${name.replace(/\.png$/, '')}-current.png`), buffer)
        fs.writeFileSync(path.join(DIFF_DIR, `${name.replace(/\.png$/, '')}-baseline.png`), baselineBuf)
    }

    // Assert ratio to satisfy linter and ensure a clear test expectation
    expect(ratio).toBeLessThan(0.002)
}

const pages = [
    { url: '/', baseline: 'home-desktop-light.png' },
    { url: '/about', baseline: 'about-desktop-light.png' },
    { url: '/philosophy', baseline: 'philosophy-desktop-light.png' },
]

for (const p of pages) {
    test(`visual snapshot: ${p.url}`, async ({ page }) => {
        await page.goto(p.url)
        await stabilizePage(page)
        await page.waitForLoadState('networkidle')
        const buffer = await page.screenshot({ fullPage: true })
        await compareWithBaseline(p.baseline, buffer)
    })
}
