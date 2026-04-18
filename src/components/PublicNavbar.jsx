import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const closeTimer = useRef(null);

    // Scroll handler — shrink navbar + close menu on scroll
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            if (mobileOpen) triggerClose();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [mobileOpen]);

    // Body scroll lock when menu open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Close on route change — immediately, no animation needed
    useEffect(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setMobileOpen(false);
        setClosing(false);
    }, [location.pathname]);

    const triggerClose = () => {
        // Bail out early if already closed — avoids rendering the mobile menu on desktop
        if (!mobileOpen && !closing) return;
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setClosing(true);
        closeTimer.current = setTimeout(() => {
            setMobileOpen(false);
            setClosing(false);
        }, 230);
    };

    const triggerOpen = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setClosing(false);
        setMobileOpen(true);
    };

    const getDashboardPath = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'employee') return '/employee';
        return '/client';
    };

    return (
        <header className={`pub-nav ${scrolled ? 'pub-nav--scrolled' : ''}`}>
            <div className="pub-nav-inner">
                {/* Logo */}
                <Link to="/" className="pub-nav-logo" aria-label="MedQuad Health — Home">
                    <img src="/logo.png" alt="Medquad Health Solutions" />
                </Link>

                {/* Desktop links */}
                <nav className="pub-nav-links" aria-label="Main navigation">
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
                        <button className="pub-nav-btn" onClick={() => navigate(getDashboardPath())}>
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

                {/* Hamburger → X */}
                <button
                    className={`pub-nav-hamburger ${mobileOpen ? 'is-open' : ''}`}
                    onClick={() => mobileOpen ? triggerClose() : triggerOpen()}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                >
                    <span className="pub-ham-line" />
                    <span className="pub-ham-line" />
                    <span className="pub-ham-line" />
                </button>
            </div>

            {/* Mobile Drawer — stays in DOM during close animation */}
            {(mobileOpen || closing) && (
                <div className={`pub-mobile-menu ${closing ? 'is-closing' : 'is-open'}`}>
                    <nav aria-label="Mobile navigation">
                        {NAV_LINKS.map(({ to, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    `pub-mobile-link ${isActive ? 'pub-mobile-link--active' : ''}`
                                }
                                onClick={triggerClose}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="pub-mobile-actions">
                        {isAuthenticated ? (
                            <button
                                className="pub-nav-btn pub-mobile-full-btn"
                                onClick={() => { navigate(getDashboardPath()); triggerClose(); }}
                            >
                                Go to Portal →
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="pub-mobile-login" onClick={triggerClose}>Login</Link>
                                <Link to="/contact" className="pub-nav-btn" onClick={triggerClose}>Get a Quote</Link>
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
