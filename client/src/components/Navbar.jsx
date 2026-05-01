import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMenu, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">
                        <span className="navbar-logo-icon">⚕</span>
                        <div className="navbar-logo-text">
                            <span className="navbar-logo-name">MEDQUAD</span>
                            <span className="navbar-logo-sub">Health Solutions</span>
                        </div>
                    </div>
                </Link>

                <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
                    <Link to="/catalog" className="navbar-link">Equipment Catalog</Link>

                    {isAuthenticated && user?.role === 'admin' && (
                        <Link to="/admin" className="navbar-link">Admin Dashboard</Link>
                    )}
                    {isAuthenticated && user?.role === 'employee' && (
                        <Link to="/employee" className="navbar-link">My Tasks</Link>
                    )}
                    {isAuthenticated && user?.role === 'client' && (
                        <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                    )}

                    {isAuthenticated ? (
                        <div className="navbar-user">
                            <div className="navbar-user-info">
                                <HiOutlineUser />
                                <span>{user.name}</span>
                                <span className="navbar-role-badge">{user.role}</span>
                            </div>
                            <button onClick={handleLogout} className="btn btn-ghost navbar-logout">
                                <HiOutlineLogout />
                                <span className="hide-mobile">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="navbar-auth">
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                        </div>
                    )}
                </div>

                <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <HiOutlineMenu />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
