import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/visual',
    // Only pick up Playwright-specific tests with this naming convention
    testMatch: '**/*.playwright.ts',
    timeout: 60_000,
    expect: {
        toHaveScreenshot: {
            // global default for screenshot diffs
            maxDiffPixelRatio: 0.002,
        },
    },
    use: {
        baseURL: process.env.VISUAL_BASE_URL || 'http://localhost:3000',
        headless: true,
        viewport: { width: 768, height: 1024 },
        // Force consistent fonts/locale where possible
        locale: 'en-US',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
