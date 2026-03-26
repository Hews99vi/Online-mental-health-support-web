/**
 * src/mocks/server.ts
 *
 * MSW Node.js server for use in Vitest / Jest tests.
 * @testing-library renders into jsdom which doesn't have a real service worker,
 * so we use setupServer instead of setupWorker.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
