/**
 * src/mocks/browser.ts
 *
 * MSW Service Worker setup for browser / Vite dev server.
 * Started by DemoModeProvider when demo mode is enabled.
 *
 * Usage:
 *   import { mswWorker } from './mocks/browser';
 *   await mswWorker.start({ onUnhandledRequest: 'bypass' });
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const mswWorker = setupWorker(...handlers);
