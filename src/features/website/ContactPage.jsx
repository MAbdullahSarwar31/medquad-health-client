import { useState } from 'react';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';

export default function ContactPage() {
    useSEO(
        'Contact Us — Get in Touch',
        'Contact Medquad Health Solutions for MRI repair, CT scanner service, spare parts, or equipment installation. Reach us by phone, WhatsApp, email or visit our Islamabad office.'
    );
    const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const [status, setStatus] = useState('idle');

    const handleSubmit = async e => {
        e.preventDefault();
        setStatus('submitting');
        
        try {
            const formData = new FormData();
            // Fallback key provided just in case, but user should set environment variable
            formData.append("access_key", import.meta.env.VITE_WEB3FORMS_KEY);
            formData.append("name", form.name);
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("service", form.service);
            formData.append("message", form.message);
            formData.append("subject", `New Website Inquiry from ${form.name}`);
            formData.append("from_name", "MHS Website Portal");

            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSent(true);
            } else {
                alert("Something went wrong submitting the form. Please try again or use WhatsApp.");
                setStatus('idle');
            }
        } catch (error) {
            alert("Network error. Please try again or use WhatsApp.");
            setStatus('idle');
        }
    };

    return (
        <div>
            <section className="pub-page-hero">
                <span className="pub-page-hero-tag">Contact Us</span>
                <h1>Get in <span className="hero-accent">Touch</span></h1>
                <p style={{ color: 'rgba(255,255,255,0.90)', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                    Have a question about our products or services?
                    Our team typically responds within 2 hours during business hours.
                </p>
            </section>

            <section className="pub-section">
                <div className="pub-container pub-grid-2" style={{ alignItems: 'start' }}>
                    {/* Form */}
                    <div className="contact-form-card">
                        <h2 className="contact-form-title">Send Us a Message</h2>
                        <p className="contact-form-sub">Fill in the form and we'll get back to you shortly.</p>

                        {sent ? (
                            <div className="contact-success">
                                <div className="contact-success-icon">✅</div>
                                <h3>Message Sent!</h3>
                                <p>Thank you for reaching out. A member of our team will be in touch within 2 business hours.</p>
                                <button className="pub-btn-primary" onClick={() => setSent(false)} style={{ marginTop: 20 }}>
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="contact-form-row">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Dr. Ahmed Khan" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input className="form-control" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@hospital.com" required />
                                    </div>
                                </div>
                                <div className="contact-form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 0000000" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Service Required</label>
                                        <select className="form-control" name="service" value={form.service} onChange={handleChange}>
                                            <option value="">Select a service</option>
                                            <option>MRI System — Purchase / Quote</option>
                                            <option>CT Scanner — Purchase / Quote</option>
                                            <option>Preventive Maintenance</option>
                                            <option>Emergency Repair</option>
                                            <option>Equipment Installation</option>
                                            <option>Spare Parts Enquiry</option>
                                            <option>Service Contract</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea className="form-control" name="message" value={form.message} onChange={handleChange}
                                        rows={5} placeholder="Describe your requirement — equipment type, make/model, issue, or any other details..." required />
                                </div>
                                <button type="submit" disabled={status === 'submitting'} className="pub-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    {status === 'submitting' ? 'Sending Message...' : 'Send Message →'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Info */}
                    <div className="contact-info-col">
                        <div className="contact-info-card">
                            <h3 className="contact-info-title">Contact Information</h3>
                            <div className="contact-info-item">
                                <span className="contact-info-icon">📍</span>
                                <div>
                                    <strong>Office Address</strong>
                                    <p>Plot 207, Service Road East<br />Industrial Area I-10/3<br />Islamabad, Pakistan</p>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <span className="contact-info-icon">📞</span>
                                <div>
                                    <strong>Phone / WhatsApp</strong>
                                    <a href="tel:+923225014415">+92 322 5014415</a>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <span className="contact-info-icon">✉️</span>
                                <div>
                                    <strong>Email</strong>
                                    <a href="mailto:info@medquadhealth.com">info@medquadhealth.com</a>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <span className="contact-info-icon">🕒</span>
                                <div>
                                    <strong>Business Hours</strong>
                                    <p>Mon–Sat: 9:00 AM – 6:00 PM<br />Emergency: 24/7</p>
                                </div>
                            </div>
                        </div>
                        <a href="https://wa.me/923225014415" target="_blank" rel="noreferrer" className="contact-whatsapp-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.117 1.528 5.846L0 24l6.335-1.658A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-4.988-1.366l-.358-.212-3.76.985 1.003-3.655-.233-.374A9.79 9.79 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z" /></svg>
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
