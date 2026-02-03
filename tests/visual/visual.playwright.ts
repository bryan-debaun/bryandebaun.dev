import path from 'path'
import fs from 'fs'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { test, expect, type Page } from '@playwright/test'

const BASELINE_DIR = path.join(process.cwd(), 'tests/visual/baselines')
const DIFF_DIR = path.join(process.cwd(), 'artifacts/a11y/diffs')

// Utility: disable animations, force deterministic font stack, hide transient UI, and wait for fonts to load
async function stabilizePage(page: Page) {
    // Inject a deterministic webfont (Inter) to reduce font variation across runner environments
    await page.addScriptTag({
        content: `(function(){
            try {
                const l = document.createElement('link');
                l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
                l.rel = 'stylesheet';
                document.head.appendChild(l);
            } catch(e){ /* ignore */ }
        })()`,
    })

    await page.addStyleTag({
        content: `
    *,*::before,*::after{transition:none !important; animation:none !important}
    html{font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial !important; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility}
    /* Hide scrollbars and transient elements */
    ::-webkit-scrollbar{display:none}
    [data-visual-ignore], .cookie-banner, .notification, .announce{display:none !important}
    /* Force light color scheme for consistent baselines */
    :root{color-scheme: light}
  `,
    })
    // Wait for fonts to be loaded to avoid snapshotting before font swap
    try {
        await page.evaluate(async () => {
            const doc = document as Document & { fonts?: FontFaceSet }
            if (doc.fonts && doc.fonts.ready) await doc.fonts.ready
        })
        // Wait specifically for the Inter font to be available (best-effort); helps avoid fallback rendering
        try {
            await page.waitForFunction(() => {
                const doc = document as Document & { fonts?: FontFaceSet }
                return !!(doc.fonts && typeof doc.fonts.check === 'function' && doc.fonts.check('1em Inter'))
            }, { timeout: 5000 })
        } catch {
            // If the specific font isn't available, we still proceed after the fonts.ready wait
        }
        // small pause to let layout settle after font swap
        await page.waitForTimeout(150)
    } catch {
        // ignore — fonts API may not be available in all environments
    }
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

    // Use env-configurable threshold to allow CI to relax tolerance when needed
    // Default threshold slightly relaxed to tolerate minor rendering differences; can be overridden by CI via VISUAL_MAX_DIFF
    const maxDiff = Number.parseFloat(process.env.VISUAL_MAX_DIFF ?? '0.01')
    // Log for easier debugging in CI
    console.log(`visual diff for ${name}: ${ratio} (threshold: ${maxDiff})`)
    expect(ratio).toBeLessThan(maxDiff)
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
        // Capture page runtime metadata for diagnostics in CI
        try {
            const meta = await page.evaluate<{ userAgent: string; fontsStatus: string; bodyFont: string }>(() => {
                const doc = document as Document & { fonts?: FontFaceSet }
                return {
                    userAgent: navigator.userAgent,
                    fontsStatus: doc.fonts?.status ?? 'unsupported',
                    bodyFont: window.getComputedStyle(document.body).fontFamily
                }
            })
            if (process.env.CI) {
                const metaDir = path.join(process.cwd(), 'artifacts/a11y/visual-metadata')
                fs.mkdirSync(metaDir, { recursive: true })
                const safeName = p.url.replace(/^\//, 'root').replace(/\//g, '_')
                fs.writeFileSync(path.join(metaDir, `${safeName}-${Date.now()}.json`), JSON.stringify(meta, null, 2))
            }
        } catch (e) {
            console.warn('Failed to capture page metadata', e)
        }

        const buffer = await page.screenshot({ fullPage: true })
        await compareWithBaseline(p.baseline, buffer)
    })
}
