import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock } from 'react-icons/md';
import './Auth.css';

const DEMO_CREDENTIALS = [
    { role: 'Admin',    email: 'admin@medquad.com',    password: 'Admin@2026',  color: '#0D1B3E' },
    { role: 'Client',   email: 'ahmed@shifa.com.pk',   password: 'Client@2026', color: '#1A4DB4' },
    { role: 'Employee', email: 'usman@medquad.com',    password: 'Emp@2026',    color: '#E8192C' },
];

/* Simple email format check */
function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export default function LoginPage() {
    const { login, loading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate  = useNavigate();
    const emailRef  = useRef(null);

    const [formData, setFormData]     = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError]   = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filledDemo, setFilledDemo] = useState(null);

    /* Redirect if already authenticated */
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin')    navigate('/admin',    { replace: true });
            else if (user.role === 'employee') navigate('/employee', { replace: true });
            else if (user.role === 'client')   navigate('/client',   { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    /* Clear global auth error on unmount */
    useEffect(() => { return () => { if (error) clearError(); }; }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
        // Clear field-level error as user types
        if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
        if (formError) setFormError('');
        if (error) clearError();
    };

    /* Inline validation on blur — Nielsen Heuristic #5: Error Prevention */
    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (name === 'email' && value && !isValidEmail(value)) {
            setFieldErrors(p => ({ ...p, email: 'Please enter a valid email address.' }));
        }
        if (name === 'password' && value && value.length < 6) {
            setFieldErrors(p => ({ ...p, password: 'Password must be at least 6 characters.' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Full validation before submit
        const errs = {};
        if (!formData.email.trim())        errs.email    = 'Email address is required.';
        else if (!isValidEmail(formData.email)) errs.email = 'Please enter a valid email address.';
        if (!formData.password)             errs.password = 'Password is required.';

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            setFormError('Please fix the errors above to continue.');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(formData.email.trim(), formData.password);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* Fill demo credentials with visual feedback */
    const fillDemo = (cred) => {
        setFormData({ email: cred.email, password: cred.password });
        setFieldErrors({});
        setFormError('');
        if (error) clearError();
        setFilledDemo(cred.role);
        setTimeout(() => setFilledDemo(null), 1500);
    };

    /* Forgot password — show info (can be extended to a modal later) */
    const handleForgot = (e) => {
        e.preventDefault();
        setFormError('');
        // Replace with modal/email flow when backend supports it
        alert('Please contact your administrator at info@medquadhealth.com to reset your password.');
    };

    const busy = loading || isSubmitting;

    return (
        <div className="auth-page">
            {/* ── LEFT BRAND PANEL ── */}
            <div className="auth-brand-panel">
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

                    {/* Service pills */}
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
                            { value: '25+',  label: 'Hospitals Served' },
                            { value: '98%',  label: 'Uptime Assured' },
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

                    {/* Demo credentials — HCI: Flexibility & Efficiency of Use */}
                    <div className="auth-demo-section">
                        <p className="auth-demo-label">Quick Demo Access</p>
                        <div className="auth-demo-buttons">
                            {DEMO_CREDENTIALS.map((cred) => (
                                <button
                                    key={cred.role}
                                    type="button"
                                    className="auth-demo-btn"
                                    style={{ '--demo-color': cred.color }}
                                    onClick={() => fillDemo(cred)}
                                    title={`Fill credentials for ${cred.role}: ${cred.email}`}
                                    aria-label={`Use ${cred.role} demo account`}
                                >
                                    {filledDemo === cred.role ? '✓ Filled' : cred.role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Global error — HCI: Visibility of System Status */}
                    {(error || formError) && (
                        <div className="auth-alert auth-alert--error" role="alert">
                            <span className="auth-alert-icon">⚠️</span>
                            <span>{error || formError}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* ── Email ── */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">
                                Email Address
                            </label>
                            <div className="auth-field-wrapper">
                                {/* Icon in its own wrapper div — fixes the placeholder overlap bug */}
                                <span className="auth-field-icon-wrap" aria-hidden="true">
                                    <MdEmail />
                                </span>
                                <input
                                    ref={emailRef}
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    className={`auth-field-input ${
                                        fieldErrors.email
                                            ? 'auth-field-input--error'
                                            : formData.email && isValidEmail(formData.email)
                                            ? 'auth-field-input--success'
                                            : ''
                                    }`}
                                    placeholder="you@medquadhealth.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="email"
                                    inputMode="email"
                                    required
                                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                    aria-invalid={!!fieldErrors.email}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="auth-field-error" id="email-error" role="alert">
                                    <span aria-hidden="true">⚠</span> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* ── Password ── */}
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label" htmlFor="login-password">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="auth-forgot-link"
                                    onClick={handleForgot}
                                    tabIndex={0}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="auth-field-wrapper">
                                <span className="auth-field-icon-wrap" aria-hidden="true">
                                    <MdLock />
                                </span>
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`auth-field-input auth-field-input--pr ${
                                        fieldErrors.password ? 'auth-field-input--error' : ''
                                    }`}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="current-password"
                                    required
                                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                                    aria-invalid={!!fieldErrors.password}
                                />
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword(v => !v)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="auth-field-error" id="password-error" role="alert">
                                    <span aria-hidden="true">⚠</span> {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        {/* ── Submit ── */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${busy ? 'auth-submit-btn--loading' : ''}`}
                            disabled={busy}
                            aria-busy={busy}
                        >
                            {busy ? (
                                <>
                                    <span className="auth-btn-spinner" aria-hidden="true" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <span className="auth-btn-arrow" aria-hidden="true">→</span>
                                </>
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
