import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WhatsAppButton from './WhatsAppButton';
import './PublicLayout.css';

const NAV_LINKS = [
    { to: '/', label: 'Home', end: true },
    { to: '/about', label: 'About Us' },
    { to: '/services', label: 'Services' },
    { to: '/products', label: 'Products' },
    { to: '/projects', label: 'Projects' },
    { to: '/team', label: 'Our Team' },
    { to: '/contact', label: 'Contact Us' },
];

export default function PublicNavbar() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'employee') return '/employee';
        return '/client';
    };

    return (
        <header className={`pub-nav ${scrolled ? 'pub-nav--scrolled' : ''}`}>
            <div className="pub-nav-inner">
                {/* Logo */}
                <Link to="/" className="pub-nav-logo">
                    <img src="/logo.png" alt="Medquad Health Solutions" />
                </Link>

                {/* Desktop links */}
                <nav className="pub-nav-links">
                    {NAV_LINKS.map(({ to, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `pub-nav-link ${isActive ? 'pub-nav-link--active' : ''}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* CTA */}
                <div className="pub-nav-actions">
                    {isAuthenticated ? (
                        <button
                            className="pub-nav-btn"
                            onClick={() => navigate(getDashboardPath())}
                        >
                            Go to Portal →
                        </button>
                    ) : (
                        <>
                            <Link to="/login" className="pub-nav-login">Login</Link>
                            <Link to="/contact" className="pub-nav-btn">Get a Quote</Link>
                            <div className="nav-wa-wrap">
                                <WhatsAppButton />
                            </div>
                        </>
                    )}
                </div>

                {/* Hamburger */}
                <button
                    className="pub-nav-hamburger"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`pub-hamburger-line ${mobileOpen ? 'open' : ''}`} />
                    <span className={`pub-hamburger-line ${mobileOpen ? 'open' : ''}`} />
                    <span className={`pub-hamburger-line ${mobileOpen ? 'open' : ''}`} />
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="pub-mobile-menu">
                    {NAV_LINKS.map(({ to, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `pub-mobile-link ${isActive ? 'pub-mobile-link--active' : ''}`
                            }
                            onClick={() => setMobileOpen(false)}
                        >
                            {label}
                        </NavLink>
                    ))}
                    <div className="pub-mobile-actions">
                        {isAuthenticated ? (
                            <button className="pub-nav-btn" onClick={() => { navigate(getDashboardPath()); setMobileOpen(false); }}>
                                Go to Portal →
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="pub-mobile-login" onClick={() => setMobileOpen(false)}>Login</Link>
                                <Link to="/contact" className="pub-nav-btn" onClick={() => setMobileOpen(false)}>Get a Quote</Link>
                                <div className="nav-wa-wrap-mobile">
                                    <WhatsAppButton />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
