import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await authAPI.getMe();
                setUser(data.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            setError(null);
            const { data } = await authAPI.login({ email, password });
            setUser(data.data.user);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            throw new Error(message);
        }
    }, []);

    const register = useCallback(async (userData) => {
        try {
            setError(null);
            const { data } = await authAPI.register(userData);
            setUser(data.data.user);
            return data;
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
            throw new Error(message);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch {
            // Even if the API call fails, clear the local state
        } finally {
            setUser(null);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isEmployee: user?.role === 'employee',
        isClient: user?.role === 'client',
        login,
        register,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
