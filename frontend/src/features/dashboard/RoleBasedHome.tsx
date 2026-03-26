import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';

/**
 * RoleBasedHome
 *
 * Mounted at `/dashboard` — reads the user's role and redirects to
 * the correct role-specific dashboard sub-route.  Falls back to the
 * generic user dashboard if the role is unrecognised.
 */
export function RoleBasedHome() {
    const { user } = useAuth();

    switch (user?.role) {
        case 'admin':
            return <Navigate to="/admin" replace />;
        case 'therapist':
            return <Navigate to="/dashboard/therapist" replace />;
        case 'listener':
            return <Navigate to="/dashboard/listener" replace />;
        case 'user':
        default:
            return <Navigate to="/dashboard/home" replace />;
    }
}
