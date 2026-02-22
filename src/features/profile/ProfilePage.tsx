import { PlaceholderPage } from '../../components/PlaceholderPage';

export function ProfilePage() {
    return (
        <PlaceholderPage icon="👤" title="My Profile" description="View and update your name, avatar, notification preferences, and account settings." />
    );
}

export function NotFoundPage() {
    return (
        <PlaceholderPage icon="🔍" title="404 — Page Not Found" description="The page you're looking for doesn't exist. Check the URL or navigate back to the dashboard." />
    );
}
