import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MdVisibility, MdVisibilityOff, MdEmail, MdLock, MdPerson, MdPhone } from 'react-icons/md';
import './Auth.css';

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') navigate('/admin', { replace: true });
            else if (user.role === 'employee') navigate('/employee', { replace: true });
            else if (user.role === 'client') navigate('/client', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
        setFormErrors((p) => ({ ...p, [e.target.name]: '' }));
        if (error) clearError();
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Full name is required.';
        if (!formData.email.trim()) errs.email = 'Email is required.';
        if (!formData.password) errs.password = 'Password is required.';
        else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';
        if (formData.password !== formData.confirmPassword)
            errs.confirmPassword = 'Passwords do not match.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
        const { confirmPassword, ...payload } = formData;
        await register(payload);
    };

    return (
        <div className="auth-page">
            {/* Left brand panel */}
            <div className="auth-brand-panel">
                {/* Decorative rings for depth */}
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

            {/* Right form panel */}
            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <div className="auth-form-header">
                        <h2 className="auth-form-title">Create Account</h2>
                        <p className="auth-form-sub">Fill in your details to request portal access</p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 20 }}>
                            <span>⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <div className="auth-field-wrapper">
                                <MdPerson className="auth-field-icon" />
                                <input
                                    id="name" name="name" type="text"
                                    className={`form-control auth-field-input ${formErrors.name ? 'form-control-error' : ''}`}
                                    placeholder="Dr. Ahmed Khan"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            </div>
                            {formErrors.name && <p className="form-error-msg">{formErrors.name}</p>}
                        </div>

                        {/* Email & Phone */}
                        <div className="auth-name-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email</label>
                                <div className="auth-field-wrapper">
                                    <MdEmail className="auth-field-icon" />
                                    <input
                                        id="email" name="email" type="email"
                                        className={`form-control auth-field-input ${formErrors.email ? 'form-control-error' : ''}`}
                                        placeholder="you@hospital.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                </div>
                                {formErrors.email && <p className="form-error-msg">{formErrors.email}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Phone (optional)</label>
                                <div className="auth-field-wrapper">
                                    <MdPhone className="auth-field-icon" />
                                    <input
                                        id="phone" name="phone" type="tel"
                                        className="form-control auth-field-input"
                                        placeholder="+92 300 0000000"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div className="auth-field-wrapper">
                                <MdLock className="auth-field-icon" />
                                <input
                                    id="password" name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control auth-field-input auth-field-input--pr ${formErrors.password ? 'form-control-error' : ''}`}
                                    placeholder="Minimum 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <button type="button" className="auth-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}>
                                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                            {formErrors.password && <p className="form-error-msg">{formErrors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                            <div className="auth-field-wrapper">
                                <MdLock className="auth-field-icon" />
                                <input
                                    id="confirmPassword" name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    className={`form-control auth-field-input auth-field-input--pr ${formErrors.confirmPassword ? 'form-control-error' : ''}`}
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <button type="button" className="auth-eye-btn"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    tabIndex={-1}>
                                    {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                </button>
                            </div>
                            {formErrors.confirmPassword && <p className="form-error-msg">{formErrors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="auth-btn-spinner" /> Creating account...</>
                            ) : (
                                <><span>Create Account</span><span className="auth-btn-arrow">→</span></>
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
