/**
 * src/tests/setup.ts
 *
 * Global test setup — runs before every test file.
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';

// ── MSW lifecycle ─────────────────────────────────────────────────────────────
// Start the Node server before all tests so every fetch is intercepted.

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request-scope overrides added inside individual tests.
afterEach(() => server.resetHandlers());

// Clean up after the entire suite.
afterAll(() => server.close());
