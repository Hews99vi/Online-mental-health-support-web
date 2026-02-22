/**
 * vitest.config.ts
 *
 * Vitest configuration for the mental-health-support-web project.
 * Uses happy-dom (faster than jsdom, full DOM APIs) as the test environment.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['src/tests/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/tests/**', 'src/mocks/**'],
        },
    },
});
