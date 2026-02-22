import { type ReactNode, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types';
import styles from './RoleRoute.module.css';

interface RoleRouteProps {
    /** One or more roles that are allowed to access child routes. */
    allowedRoles: UserRole[];
    /** Optional: render custom children instead of <Outlet /> when authorised. */
    children?: ReactNode;
}

// ── AccessDeniedPage ─────────────────────────────────────────────────────────

function AccessDeniedPage() {
    const headingRef = useRef<HTMLHeadingElement>(null);

    // Move focus to the heading on mount so screen-readers announce the error
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <main className={styles.denied} aria-labelledby="access-denied-title">
            <div className={styles.deniedCard}>
                <ShieldOff
                    className={styles.deniedIcon}
                    size={48}
                    aria-hidden="true"
                    strokeWidth={1.5}
                />
                <h1
                    id="access-denied-title"
                    ref={headingRef}
                    className={styles.deniedTitle}
                    tabIndex={-1}
                >
                    Access Denied
                </h1>
                <p className={styles.deniedMessage}>
                    You don&apos;t have permission to view this page. Please contact an administrator
                    if you believe this is a mistake.
                </p>
                <a href="/dashboard" className={styles.deniedBackLink}>
                    <ArrowLeft size={16} aria-hidden="true" />
                    Return to Dashboard
                </a>
            </div>
        </main>
    );
}

// ── RoleRoute ─────────────────────────────────────────────────────────────────

/**
 * RoleRoute
 *
 * Must be nested inside <ProtectedRoute> (guarantees user is authenticated).
 * Renders <AccessDeniedPage> when the user's role is not in allowedRoles.
 */
export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    const hasRole = user !== null && allowedRoles.includes(user.role);

    if (!hasRole) return <AccessDeniedPage />;

    return children ? <>{children}</> : <Outlet />;
}
