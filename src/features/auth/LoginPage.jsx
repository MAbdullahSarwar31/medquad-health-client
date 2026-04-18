import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './Auth.css';

const DEMO_CREDENTIALS = [
    { role: 'Admin', email: 'admin@medquad.com', password: 'Admin@2026', color: '#0D1B3E' },
    { role: 'Client', email: 'ahmed@shifa.com.pk', password: 'Client@2026', color: '#1A4DB4' },
    { role: 'Employee', email: 'usman@medquad.com', password: 'Emp@2026', color: '#E8192C' },
];

export default function LoginPage() {
    const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') navigate('/admin', { replace: true });
            else if (user.role === 'employee') navigate('/employee', { replace: true });
            else if (user.role === 'client') navigate('/client', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
        if (formError) setFormError('');
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setFormError('Please enter your email and password.');
            return;
        }
        setIsSubmitting(true);
        try {
            await login(formData.email, formData.password);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fillDemo = (cred) => {
        setFormData({ email: cred.email, password: cred.password });
        if (formError) setFormError('');
        if (error) clearError();
    };

    const busy = loading || isSubmitting;

    return (
        <div className="auth-page">
            {/* ── LEFT BRAND PANEL ── */}
            <div className="auth-brand-panel">
                {/* Decorative floating rings (subtle glass) */}
                <div className="auth-ring auth-ring-1" />
                <div className="auth-ring auth-ring-2" />
                <div className="auth-ring auth-ring-3" />

                <div className="auth-brand-content">
                    {/* Logo */}
                    <div className="auth-brand-logo">
                        <div className="auth-logo-card">
                            <img src="/logo.png" alt="Medquad Health Solutions" className="auth-logo-img" />
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="auth-brand-title">
                        Precision in Medical<br />
                        Imaging <span>Technology</span>
                    </h1>

                    {/* Tagline pills */}
                    <div className="auth-service-pills">
                        {['Service', 'Repair', 'Installation', 'Support'].map((s) => (
                            <span key={s} className="auth-pill">{s}</span>
                        ))}
                    </div>

                    <p className="auth-brand-desc">
                        End-to-end management of MRI, CT, X-ray, and medical imaging equipment —
                        from installation to preventive maintenance, all in one platform.
                    </p>

                    {/* Stats */}
                    <div className="auth-brand-stats">
                        {[
                            { value: '120+', label: 'Equipment Units' },
                            { value: '25+', label: 'Hospitals Served' },
                            { value: '98%', label: 'Uptime Assured' },
                        ].map((s) => (
                            <div key={s.label} className="auth-brand-stat">
                                <span className="auth-brand-stat-value">{s.value}</span>
                                <span className="auth-brand-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">Welcome Back</h2>
                        <p className="auth-form-sub">Sign in to your Medquad portal account</p>
                    </div>

                    {/* Demo credentials */}
                    <div className="auth-demo-section">
                        <p className="auth-demo-label">Quick demo access:</p>
                        <div className="auth-demo-buttons">
                            {DEMO_CREDENTIALS.map((cred) => (
                                <button
                                    key={cred.role}
                                    type="button"
                                    className="auth-demo-btn"
                                    style={{ '--demo-color': cred.color }}
                                    onClick={() => fillDemo(cred)}
                                >
                                    {cred.role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error message */}
                    {(error || formError) && (
                        <div className="alert alert-error" style={{ marginBottom: 16 }}>
                            <span>⚠</span>
                            <span>{error || formError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <div className="auth-field-wrapper">
                                <svg className="auth-field-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 5.5A1.5 1.5 0 013.5 4h13A1.5 1.5 0 0118 5.5v9A1.5 1.5 0 0116.5 16h-13A1.5 1.5 0 012 14.5v-9z" />
                                    <path d="M2 6l8 5 8-5" />
                                </svg>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="form-control auth-field-input"
                                    placeholder="you@medquad.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div className="auth-field-wrapper">
                                <svg className="auth-field-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="9" width="14" height="9" rx="1.5" />
                                    <path d="M6 9V6a4 4 0 018 0v3" />
                                </svg>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control auth-field-input auth-field-input--pr"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${busy ? 'auth-submit-btn--loading' : ''}`}
                            disabled={busy}
                        >
                            {busy ? (
                                <><span className="auth-btn-spinner" /> Signing in...</>
                            ) : (
                                <><span>Sign In</span><span className="auth-btn-arrow">→</span></>
                            )}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Don&apos;t have an account?{' '}
                        <Link to="/register">Request access</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
