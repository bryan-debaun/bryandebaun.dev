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

// Pages to capture for visual regression and accessibility audits (exported for tests and reuse)
export const pagesToAudit = ['/', '/about', '/philosophy']

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

/**
 * Safely extract a string message from unknown errors without using `any`.
 */
function extractErrorMessage(err: unknown): string {
    if (!err) return ''
    if (typeof err === 'string') return err
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        return (err as { message: string }).message
    }
    return String(err)
}

/**
 * Read axe source safely from different module shapes without `any`.
 */
function getAxeSourceModule(m: unknown): string | undefined {
    if (!m || typeof m !== 'object') return undefined
    const mm = m as Record<string, unknown>
    if (typeof mm.source === 'string') return mm.source
    if (mm.default && typeof mm.default === 'object') {
        const d = mm.default as Record<string, unknown>
        if (typeof d.source === 'string') return d.source
        if (d.axe && typeof d.axe === 'object') {
            const ax = d.axe as Record<string, unknown>
            if (typeof ax.source === 'string') return ax.source
        }
    }
    return undefined
}

async function runAxeOnPage(page: Page): Promise<AxeResults> {
    // import axe-core dynamically so the module is only required at runtime
    const axeModule = await import('axe-core')
    // axeModule may export the source in a few different shapes depending on bundler or package layout.
    const axeSource = getAxeSourceModule(axeModule)
    if (!axeSource) {
        // As a last resort, attempt to load the browser build from the installed package folder
        try {
            const fallbackPath = require.resolve('axe-core/axe.min.js')
            await page.addScriptTag({ path: fallbackPath })
        } catch (error) {
            console.error('Could not locate axe-core source. Module keys:', Object.keys(axeModule || {}), 'error:', extractErrorMessage(error))
            throw new Error('axe-core source not found; cannot inject axe into page')
        }
    } else {
        await page.addScriptTag({ content: axeSource })
    }

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

    const ciMode = argv.includes('--ci') || Boolean(process.env.CI)
    const opts: Options = { url, outDir, viewports: DEFAULT_VIEWPORTS, browsers: DEFAULT_BROWSERS }
    mkdirp(outDir)

    // Pages to capture for visual regression and accessibility audits
    // Uses the exported `pagesToAudit` constant at module scope

    let hadError = false

    for (const browserName of opts.browsers) {
        let browser: Browser | null = null
        try {
            if (browserName === 'chromium') browser = await chromium.launch({ headless: true })
            if (browserName === 'firefox') browser = await firefox.launch({ headless: true })
            if (!browser) continue

            for (const vp of opts.viewports) {
                // Create separate contexts per theme so both `prefers-color-scheme` and `class`-based dark modes work reliably.
                for (const theme of ['light', 'dark']) {
                    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme as 'light' | 'dark' })
                    const page = await context.newPage()

                    // Ensure the theme class is present before any page scripts run so initial render respects it.
                    if (theme === 'dark') {
                        await context.addInitScript({ content: `document.documentElement.classList.add('dark')` })
                    } else {
                        await context.addInitScript({ content: `document.documentElement.classList.remove('dark')` })
                    }

                    for (const subPath of pagesToAudit) {
                        const fullUrl = subPath === '/' ? url : `${url.replace(/\/$/, '')}${subPath}`
                        await page.goto(fullUrl, { waitUntil: 'networkidle' })

                        // Dispatch a 'themechange' event to notify any client-side listeners (e.g., DarkModeToggle) to re-sync.
                        try {
                            await page.evaluate(() => {
                                window.dispatchEvent(new CustomEvent('themechange'))
                            })
                        } catch (err) {
                            // Non-fatal: some pages may block synthetic events; log and continue
                            console.warn('Failed to dispatch themechange event:', err)
                        }

                        // Give the page a short moment to apply theme-related changes
                        await page.waitForTimeout(250)

                        const pageTag = subPath === '/' ? 'home' : subPath.replace(/^\//, '').replace(/\//g, '_')
                        const filePrefix = `${browserName}-${vp.name}-${theme}-${pageTag}`
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
                            const result = await runLighthouse(fullUrl, lhPath, { width: vp.width, height: vp.height, emulatedFormFactor: vp.width <= 412 ? 'mobile' : 'desktop' })
                            if (!result || !('success' in result) || result.success === false) {
                                fs.writeFileSync(path.join(outDir, `${filePrefix}-lighthouse.txt`), result && 'error' in result ? String(result.error) : 'lighthouse not available')
                            }
                        }

                        console.log(`Wrote artifacts for ${filePrefix}`)
                    }

                    await context.close()
                }
            }
        } catch (e: unknown) {
            hadError = true
            console.error('Error while running a11y for', browserName)
            // Provide a helpful message when Playwright browsers are not installed
            const msg = extractErrorMessage(e)
            if (msg.includes("Executable doesn't exist") || msg.includes('Please run the following command to download new browsers') || msg.includes('playwright')) {
                console.error('\nPlaywright appears to be missing the required browser binaries for', browserName + '.')
                console.error('Install them locally with:')
                console.error('\n  npx playwright install\n')
                if (ciMode) {
                    console.error('In CI, ensure the workflow runs: `npx playwright install --with-deps` before executing this script.')
                }
            }
            console.error(msg)
        } finally {
            if (browser) await browser.close()
        }
    }

    if (hadError) {
        console.error('One or more browsers failed during the a11y run. See errors above. Exiting with non-zero status.')
        process.exit(1)
    }

    console.log('A11y run complete. Artifacts in', outDir)
    // Explicitly exit to avoid lingering handles in some environments
    process.exit(0)
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
