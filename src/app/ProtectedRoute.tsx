import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute
 *
 * Wraps authenticated-only sections of the route tree.
 * - While the auth state is still loading (token validation in-flight),
 *   renders nothing (prevents flash-of-wrong-page).
 * - Unauthenticated → redirects to /login?returnUrl=<original path>
 * - Authenticated    → renders child routes via <Outlet />
 */
export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
    }

    return <Outlet />;
}
