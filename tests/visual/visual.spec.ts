// DEPRECATED: moved to visual.playwright.ts
// This placeholder avoids import-time issues with Vitest accidentally importing Playwright test files.

import { test, expect } from 'vitest';

// Trivial placeholder test to keep Vitest happy while Playwright tests are owned by Playwright
test('placeholder - visual.spec (vitest) is intentionally trivial', () => {
    expect(true).toBe(true);
});

