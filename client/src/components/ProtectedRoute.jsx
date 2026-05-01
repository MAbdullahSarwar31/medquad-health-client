import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="page-loader" style={{ minHeight: '100vh' }}>
                <div className="spinner" />
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If specific roles are required and user's role doesn't match,
    // redirect them to their own correct dashboard instead of showing a 403.
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        const dashboardByRole = {
            admin: '/admin',
            employee: '/employee',
            client: '/client',
        };
        const redirectTo = dashboardByRole[user.role] || '/';
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
