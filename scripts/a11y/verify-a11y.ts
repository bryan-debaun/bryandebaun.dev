#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import type { Browser, Page } from 'playwright'
import { chromium, firefox } from 'playwright'

/**
 * Axe and Lighthouse results are opaque here; treat them as unknown shapes
 * but avoid using `any` at module level.
 */
type AxeResults = unknown


const DEFAULT_VIEWPORTS = [
    { name: '320', width: 320, height: 800 },
    { name: '412', width: 412, height: 800 },
    { name: '768', width: 768, height: 1024 },
]

const DEFAULT_BROWSERS: Array<'chromium' | 'firefox'> = ['chromium', 'firefox']

interface Options {
    url: string
    outDir: string
    viewports: typeof DEFAULT_VIEWPORTS
    browsers: Array<'chromium' | 'firefox'>
    ci?: boolean
}

function mkdirp(dir: string) {
    fs.mkdirSync(dir, { recursive: true })
}

async function runAxeOnPage(page: Page): Promise<AxeResults> {
    // import axe-core dynamically so the module is only required at runtime
    const axeModule = await import('axe-core')
    // axeModule doesn't have strong typing here; access source safely
    await page.addScriptTag({ content: axeModule.source })

    // Run axe in the page context. Narrow typings to avoid `any` usage within the source file.
    const results = await page.evaluate(async () => (window as unknown as { axe: { run: () => Promise<unknown> } }).axe.run())
    return results as AxeResults
}

async function auditTouchTargets(page: Page) {
    const selectors = ['button', 'a[href]', '[role="button"]', 'input[type="button"]', 'input[type="submit"]']
    const results = (await page.$$eval(selectors.join(','), (els) => {
        return els.map((el) => {
            const r = el.getBoundingClientRect()
            return {
                outerHTML: el.outerHTML,
                width: Math.round(r.width),
                height: Math.round(r.height),
            }
        })
    })) as Array<{ outerHTML: string; width: number; height: number }>
    const failures = results.filter((r) => r.width < 44 || r.height < 44)
    return { all: results, failures }
}

async function runLighthouse(url: string, outPath: string, opts: { width: number; height: number; emulatedFormFactor?: 'mobile' | 'desktop' }): Promise<{ success: true } | { success: false; error: string } | null> {
    // Try to import lighthouse and chrome-launcher dynamically; if unavailable, skip
    try {
        const lighthouseModule = await import('lighthouse')
        const chromeLauncherModule = await import('chrome-launcher')
        // Some modules expose as default, some as named export
        const lighthouseFn = lighthouseModule.default ?? lighthouseModule
        // @ts-expect-error - runtime import shape
        const chromeLauncher = chromeLauncherModule.default ?? chromeLauncherModule

        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] })
        type LighthouseFlags = { port: number; output?: 'html' | 'json' | string; onlyCategories?: string[]; formFactor?: 'mobile' | 'desktop' }
        const options: LighthouseFlags = { port: chrome.port, output: 'html', onlyCategories: ['accessibility'], formFactor: opts.emulatedFormFactor ?? 'mobile' }
        const runnerResult = await (lighthouseFn as (u: string, o: LighthouseFlags) => Promise<{ report?: string } | undefined>)(url, options)
        const reportHtml = (runnerResult as { report?: string }).report as string
        fs.writeFileSync(outPath, reportHtml)
        await chrome.kill()
        return { success: true }
    } catch (err) {
        // If imports failed or lighthouse runtime failed, return a helpful error
        return { success: false, error: String(err) }
    }
}

async function run() {
    const argv = process.argv.slice(2)
    const urlArgIndex = argv.findIndex((v) => v === '--url')
    const outArgIndex = argv.findIndex((v) => v === '--outDir')
    const url = urlArgIndex >= 0 ? argv[urlArgIndex + 1] : process.env.A11Y_URL || 'http://localhost:3000'
    const outDir = outArgIndex >= 0 ? argv[outArgIndex + 1] : process.env.A11Y_OUTDIR || 'artifacts/a11y'

    const opts: Options = { url, outDir, viewports: DEFAULT_VIEWPORTS, browsers: DEFAULT_BROWSERS }
    mkdirp(outDir)

    for (const browserName of opts.browsers) {
        let browser: Browser | null = null
        try {
            if (browserName === 'chromium') browser = await chromium.launch({ headless: true })
            if (browserName === 'firefox') browser = await firefox.launch({ headless: true })
            if (!browser) continue

            for (const vp of opts.viewports) {
                const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
                const page = await context.newPage()
                // Light and dark modes
                for (const theme of ['light', 'dark']) {
                    await page.goto(url, { waitUntil: 'networkidle' })
                    // Apply theme class if needed
                    if (theme === 'dark') {
                        await page.evaluate(() => document.documentElement.classList.add('dark'))
                    } else {
                        await page.evaluate(() => document.documentElement.classList.remove('dark'))
                    }

                    const filePrefix = `${browserName}-${vp.name}-${theme}`
                    const screenshotPath = path.join(outDir, `${filePrefix}.png`)
                    await page.screenshot({ path: screenshotPath, fullPage: true })

                    // Axe
                    const axeResults = await runAxeOnPage(page)
                    fs.writeFileSync(path.join(outDir, `${filePrefix}-axe.json`), JSON.stringify(axeResults, null, 2))

                    // Touch-target audit
                    const touchReport = await auditTouchTargets(page)
                    fs.writeFileSync(path.join(outDir, `${filePrefix}-touch.json`), JSON.stringify(touchReport, null, 2))

                    // Lighthouse only for chromium — run if available. runLighthouse dynamically imports lighthouse and chrome-launcher.
                    if (browserName === 'chromium') {
                        const lhPath = path.join(outDir, `${filePrefix}-lighthouse.html`)
                        const result = await runLighthouse(url, lhPath, { width: vp.width, height: vp.height, emulatedFormFactor: vp.width <= 412 ? 'mobile' : 'desktop' })
                        if (!result || !('success' in result) || result.success === false) {
                            fs.writeFileSync(path.join(outDir, `${filePrefix}-lighthouse.txt`), result && 'error' in result ? String(result.error) : 'lighthouse not available')
                        }
                    }

                    console.log(`Wrote artifacts for ${filePrefix}`)
                }

                await context.close()
            }
        } catch (e) {
            console.error('Error while running a11y for', browserName, e)
        } finally {
            if (browser) await browser.close()
        }
    }

    console.log('A11y run complete. Artifacts in', outDir)
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
