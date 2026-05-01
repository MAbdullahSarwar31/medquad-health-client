import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock, MdPerson, MdPhone } from 'react-icons/md';
import './Auth.css';

/* ── Password strength calculator ── */
function getPasswordStrength(password) {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8)  score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 'weak',   label: 'Weak — add uppercase, numbers & symbols' };
    if (score === 2) return { level: 'weak',   label: 'Weak — add more complexity' };
    if (score === 3) return { level: 'medium', label: 'Medium — add a symbol for stronger security' };
    return              { level: 'strong',  label: 'Strong password ✓' };
}

function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export default function RegisterPage() {
    const { register, loading, error, clearError, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword]   = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);
    const [fieldErrors, setFieldErrors]     = useState({});
    const [submitted, setSubmitted]         = useState(false);

    const strength = getPasswordStrength(formData.password);

    /* Confirm password match state */
    const confirmMatch =
        formData.confirmPassword.length > 0 &&
        formData.password === formData.confirmPassword;
    const confirmMismatch =
        formData.confirmPassword.length > 0 &&
        formData.password !== formData.confirmPassword;

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin')         navigate('/admin',    { replace: true });
            else if (user.role === 'employee') navigate('/employee', { replace: true });
            else if (user.role === 'client')   navigate('/client',   { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => { return () => { if (error) clearError(); }; }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
        if (error) clearError();
    };

    /* Inline validation on blur */
    const handleBlur = (e) => {
        const { name, value } = e.target;
        const errs = { ...fieldErrors };

        if (name === 'name' && !value.trim()) {
            errs.name = 'Full name is required.';
        }
        if (name === 'email') {
            if (!value.trim()) errs.email = 'Email is required.';
            else if (!isValidEmail(value)) errs.email = 'Please enter a valid email address.';
            else delete errs.email;
        }
        if (name === 'password') {
            if (!value) errs.password = 'Password is required.';
            else if (value.length < 8) errs.password = 'Password must be at least 8 characters.';
            else delete errs.password;
        }
        if (name === 'confirmPassword') {
            if (value && value !== formData.password) {
                errs.confirmPassword = 'Passwords do not match.';
            } else {
                delete errs.confirmPassword;
            }
        }
        setFieldErrors(errs);
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim())              errs.name    = 'Full name is required.';
        if (!formData.email.trim())             errs.email   = 'Email is required.';
        else if (!isValidEmail(formData.email)) errs.email   = 'Please enter a valid email address.';
        if (!formData.password)                 errs.password = 'Password is required.';
        else if (formData.password.length < 8)  errs.password = 'Password must be at least 8 characters.';
        if (formData.password !== formData.confirmPassword)
            errs.confirmPassword = 'Passwords do not match.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        const { confirmPassword, ...payload } = formData;
        const result = await register(payload);
        if (result && !error) {
            setSubmitted(true);
        }
    };

    /* ── Success state ── */
    if (submitted && !error) {
        return (
            <div className="auth-page">
                <div className="auth-brand-panel">
                    <div className="auth-ring auth-ring-1" />
                    <div className="auth-ring auth-ring-2" />
                    <div className="auth-brand-content">
                        <div className="auth-brand-logo">
                            <div className="auth-logo-card">
                                <img src="/logo.png" alt="Medquad Health Solutions" className="auth-logo-img" />
                            </div>
                        </div>
                        <h1 className="auth-brand-title">
                            Join the<br />Medquad <span>Platform</span>
                        </h1>
                    </div>
                </div>
                <div className="auth-form-panel">
                    <div className="auth-form-card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                        <h2 className="auth-form-title" style={{ textAlign: 'center' }}>Request Submitted!</h2>
                        <p className="auth-form-sub" style={{ textAlign: 'center', marginBottom: 28 }}>
                            Your account request has been received. An administrator will review and activate
                            your account shortly. You will be notified via email.
                        </p>
                        <Link
                            to="/login"
                            className="auth-submit-btn"
                            style={{ display: 'flex', textDecoration: 'none', justifyContent: 'center' }}
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            {/* ── LEFT BRAND PANEL ── */}
            <div className="auth-brand-panel">
                <div className="auth-ring auth-ring-1" />
                <div className="auth-ring auth-ring-2" />

                <div className="auth-brand-content">
                    <div className="auth-brand-logo">
                        <div className="auth-logo-card">
                            <img src="/logo.png" alt="Medquad Health Solutions" className="auth-logo-img" />
                        </div>
                    </div>
                    <h1 className="auth-brand-title">
                        Join the<br />
                        Medquad <span>Platform</span>
                    </h1>
                    <p className="auth-brand-desc">
                        Create your account to access equipment tracking, service tickets,
                        and maintenance management tools tailored to your role.
                    </p>
                    <div className="auth-brand-stats">
                        <div className="auth-brand-stat">
                            <span className="auth-brand-stat-value">MRI</span>
                            <span className="auth-brand-stat-label">CT · X-Ray · More</span>
                        </div>
                        <div className="auth-brand-stat">
                            <span className="auth-brand-stat-value">24/7</span>
                            <span className="auth-brand-stat-label">Support Access</span>
                        </div>
                        <div className="auth-brand-stat">
                            <span className="auth-brand-stat-value">100%</span>
                            <span className="auth-brand-stat-label">Digital Workflow</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">Create Account</h2>
                        <p className="auth-form-sub">Fill in your details to request portal access</p>
                    </div>

                    {error && (
                        <div className="auth-alert auth-alert--error" role="alert">
                            <span className="auth-alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>

                        {/* ── Full Name ── */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-name">Full Name</label>
                            <div className="auth-field-wrapper">
                                <span className="auth-field-icon-wrap" aria-hidden="true">
                                    <MdPerson />
                                </span>
                                <input
                                    id="reg-name"
                                    name="name"
                                    type="text"
                                    className={`auth-field-input ${
                                        fieldErrors.name
                                            ? 'auth-field-input--error'
                                            : formData.name.trim().length > 1
                                            ? 'auth-field-input--success'
                                            : ''
                                    }`}
                                    placeholder="Dr. Ahmed Khan"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="name"
                                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                                    aria-invalid={!!fieldErrors.name}
                                />
                            </div>
                            {fieldErrors.name && (
                                <p className="auth-field-error" id="name-error" role="alert">
                                    <span aria-hidden="true">⚠</span> {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        {/* ── Email & Phone ── */}
                        <div className="auth-name-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-email">Email</label>
                                <div className="auth-field-wrapper">
                                    <span className="auth-field-icon-wrap" aria-hidden="true">
                                        <MdEmail />
                                    </span>
                                    <input
                                        id="reg-email"
                                        name="email"
                                        type="email"
                                        className={`auth-field-input ${
                                            fieldErrors.email
                                                ? 'auth-field-input--error'
                                                : formData.email && isValidEmail(formData.email)
                                                ? 'auth-field-input--success'
                                                : ''
                                        }`}
                                        placeholder="you@hospital.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        autoComplete="email"
                                        inputMode="email"
                                        aria-describedby={fieldErrors.email ? 'email-reg-error' : undefined}
                                        aria-invalid={!!fieldErrors.email}
                                    />
                                </div>
                                {fieldErrors.email && (
                                    <p className="auth-field-error" id="email-reg-error" role="alert">
                                        <span aria-hidden="true">⚠</span> {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-phone">
                                    Phone <span style={{ fontWeight: 400, color: 'var(--gray-500)' }}>(optional)</span>
                                </label>
                                <div className="auth-field-wrapper">
                                    <span className="auth-field-icon-wrap" aria-hidden="true">
                                        <MdPhone />
                                    </span>
                                    <input
                                        id="reg-phone"
                                        name="phone"
                                        type="tel"
                                        className="auth-field-input"
                                        placeholder="+92 300 0000000"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                        inputMode="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Password ── */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">Password</label>
                            <div className="auth-field-wrapper">
                                <span className="auth-field-icon-wrap" aria-hidden="true">
                                    <MdLock />
                                </span>
                                <input
                                    id="reg-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`auth-field-input auth-field-input--pr ${
                                        fieldErrors.password
                                            ? 'auth-field-input--error'
                                            : strength?.level === 'strong'
                                            ? 'auth-field-input--success'
                                            : ''
                                    }`}
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="new-password"
                                    aria-describedby={fieldErrors.password ? 'password-reg-error' : 'password-strength'}
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

                            {fieldErrors.password ? (
                                <p className="auth-field-error" id="password-reg-error" role="alert">
                                    <span aria-hidden="true">⚠</span> {fieldErrors.password}
                                </p>
                            ) : (
                                /* Password Strength Meter */
                                formData.password && strength && (
                                    <div className="auth-strength" id="password-strength" aria-live="polite">
                                        <div className="auth-strength-track">
                                            <div className={`auth-strength-bar auth-strength-bar--${strength.level}`} />
                                        </div>
                                        <p className={`auth-strength-label auth-strength-label--${strength.level}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* ── Confirm Password ── */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                            <div className="auth-field-wrapper">
                                <span className="auth-field-icon-wrap" aria-hidden="true">
                                    <MdLock />
                                </span>
                                <input
                                    id="reg-confirm"
                                    name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    className={`auth-field-input auth-field-input--pr ${
                                        fieldErrors.confirmPassword
                                            ? 'auth-field-input--error'
                                            : confirmMatch
                                            ? 'auth-field-input--success'
                                            : ''
                                    }`}
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="new-password"
                                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                                    aria-invalid={!!fieldErrors.confirmPassword}
                                />
                                {/* Live match indicator */}
                                {formData.confirmPassword && (
                                    <span
                                        className={`auth-confirm-indicator ${confirmMatch ? 'auth-confirm-indicator--match' : 'auth-confirm-indicator--mismatch'}`}
                                        aria-hidden="true"
                                    >
                                        {confirmMatch ? '✓' : '✗'}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowConfirm(v => !v)}
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="auth-field-error" id="confirm-error" role="alert">
                                    <span aria-hidden="true">⚠</span> {fieldErrors.confirmPassword}
                                </p>
                            )}
                            {confirmMatch && (
                                <p className="auth-field-hint" style={{ color: '#16A34A', fontWeight: 500 }}>
                                    ✓ Passwords match
                                </p>
                            )}
                        </div>

                        {/* ── Submit ── */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="auth-btn-spinner" aria-hidden="true" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <span className="auth-btn-arrow" aria-hidden="true">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
