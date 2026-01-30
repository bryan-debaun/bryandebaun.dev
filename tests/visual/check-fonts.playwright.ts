import { test, expect } from '@playwright/test'

// Small smoke test to verify the Inter font is available in the runner.
// This fails fast and gives a clearer error when Inter isn't installed.

test('fonts: Inter available (smoke)', async ({ page }) => {
    await page.goto('/')
    // Wait for fonts.ready if available
    await page.evaluate(async () => {
        const doc = document as unknown as Document & { fonts?: FontFaceSet }
        if (doc.fonts && doc.fonts.ready) await doc.fonts.ready
    })
    // Best-effort check for Inter on the page
    const meta = await page.evaluate(() => {
        const doc = document as unknown as Document & { fonts?: FontFaceSet }
        const fontsStatus = doc.fonts?.status ?? 'unsupported'
        const bodyFont = window.getComputedStyle(document.body).fontFamily
        const hasInter = !!(doc.fonts && typeof doc.fonts.check === 'function' && doc.fonts.check('1em Inter'))
        return { fontsStatus, bodyFont, hasInter }
    })

    // Helpful failure message
    expect(meta.hasInter, `Inter font not available in runner. fontsStatus=${meta.fontsStatus}, bodyFont=${meta.bodyFont}`).toBe(true)
})