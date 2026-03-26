/**
 * AdminPages.tsx
 *
 * Re-exports all admin feature pages so Router.tsx can import from a
 * single path.  Each page lives in its own dedicated file.
 */
export { AdminDashboardPage } from './AdminDashboardPage';
export { AdminTherapistApprovalsPage as AdminTherapistsPage } from './AdminTherapistApprovalsPage';
export { AdminListenerApprovalsPage as AdminListenersPage } from './AdminListenerApprovalsPage';
export { AdminContentManagerPage as AdminContentPage } from './AdminContentManagerPage';
export { AdminAnalyticsPage } from './AdminAnalyticsPage';
