import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['src/setupTests.ts'],
        // Vitest owns unit tests only. The Playwright suites have their own
        // runners/configs — exclude them so `vitest` never tries to execute a
        // Playwright spec. (Defaults like node_modules/dist are preserved.)
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'tests/visual/**',
            'tests/integration/**'
        ]
    }
});
