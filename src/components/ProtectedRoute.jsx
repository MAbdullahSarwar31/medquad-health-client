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

    // If specific roles are required, check them
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                padding: '40px',
            }}>
                <h1 style={{ fontSize: 64, fontWeight: 900, color: 'var(--brand-red)', marginBottom: 12 }}>403</h1>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8 }}>Access Denied</h2>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>You do not have permission to access this page.</p>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
