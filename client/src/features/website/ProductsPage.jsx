import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';

const PRODUCTS = [
    {
        category: 'MRI Systems',
        icon: '🧲',
        desc: 'Certified refurbished MRI units from leading manufacturers. Available in 1.5T and 3.0T field strengths.',
        brands: ['GE Healthcare', 'Siemens Healthineers', 'Philips Healthcare', 'Canon Medical', 'Hitachi'],
        features: ['Factory-tested & certified', 'Full warranty included', 'Installation support available', 'Training for operators'],
    },
    {
        category: 'CT Scanners',
        icon: '🩻',
        desc: 'High-performance CT imaging systems from 16-slice to 128-slice configurations for all clinical applications.',
        brands: ['GE Healthcare', 'Siemens Healthineers', 'Philips Healthcare', 'Canon Medical'],
        features: ['Multi-slice configurations', 'Low-dose technology', 'DICOM compatible', 'Remote diagnostics ready'],
    },
    {
        category: 'Spare Parts',
        icon: '⚙️',
        desc: 'Genuine and OEM-compatible spare components for MRI and CT systems — fast delivery across Pakistan.',
        brands: ['All Major Brands'],
        features: ['Gradient amplifiers', 'Power supplies & boards', 'RF coils & cables', 'Tubes & cooling systems'],
    },
];

export default function ProductsPage() {
    useSEO(
        'Products — Certified MRI & CT Scanners',
        'Buy certified refurbished MRI units, CT scanners, and medical imaging spare parts from Medquad Health Solutions. GE, Siemens, Philips, Canon, Hitachi.'
    );
    const [active, setActive] = useState(0);
    const p = PRODUCTS[active];

    return (
        <div>
            <section className="pub-page-hero">
                <span className="pub-page-hero-tag">Our Products</span>
                <h1>Certified Refurbished<br /><span className="hero-accent">Medical Imaging</span> Equipment</h1>
                <p>Premium MRI systems, CT scanners, and spare parts — sourced globally,
                    delivered and commissioned across Pakistan.</p>
            </section>

            {/* Category tabs */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="products-tabs">
                        {PRODUCTS.map((prod, i) => (
                            <button
                                key={prod.category}
                                className={`products-tab ${i === active ? 'products-tab--active' : ''}`}
                                onClick={() => setActive(i)}
                            >
                                <span>{prod.icon}</span> {prod.category}
                            </button>
                        ))}
                    </div>

                    <div className="products-detail pub-grid-2">
                        <div>
                            <div className="products-detail-icon">{p.icon}</div>
                            <h2 className="pub-section-title" style={{ marginBottom: 16 }}>{p.category}</h2>
                            <p className="pub-section-sub" style={{ marginBottom: 28 }}>{p.desc}</p>
                            <h4 style={{ fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 14, fontSize: 14 }}>KEY FEATURES</h4>
                            <ul className="products-features">
                                {p.features.map(f => (
                                    <li key={f}><span className="service-check">✓</span> {f}</li>
                                ))}
                            </ul>
                            <Link to="/contact" className="pub-btn-primary" style={{ marginTop: 32, display: 'inline-flex' }}>
                                Request a Quote →
                            </Link>
                        </div>
                        <div>
                            <div className="products-brands-box">
                                <h4 className="products-brands-title">Available Brands</h4>
                                {p.brands.map(b => (
                                    <div key={b} className="products-brand-row">
                                        <span className="products-brand-dot" />
                                        <span>{b}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="products-note">
                                <span>📞</span>
                                <div>
                                    <strong>Can't find what you need?</strong>
                                    <p>Call us on <a href="tel:+923225014415">+92 322 5014415</a> — we source equipment globally to meet your specification.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust strip */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center" style={{ marginBottom: 40 }}>
                        <span className="pub-section-tag">Why Buy From Us</span>
                        <h2 className="pub-section-title">Certified. Tested. <span>Guaranteed.</span></h2>
                    </div>
                    <div className="pub-grid-4">
                        {[
                            { icon: '✅', title: 'OEM Certified', desc: 'Every system tested to manufacturer specifications before shipment.' },
                            { icon: '🛡️', title: 'Warranty Included', desc: 'Comprehensive warranty on parts and labour for peace of mind.' },
                            { icon: '🚚', title: 'Nationwide Delivery', desc: 'We handle logistics and installation anywhere in Pakistan.' },
                            { icon: '🔧', title: 'Ongoing Support', desc: 'Post-sale service contracts available for continued maintenance.' },
                        ].map(x => (
                            <div key={x.title} className="pub-card" style={{ textAlign: 'center' }}>
                                <div className="pub-card-icon" style={{ margin: '0 auto 16px', fontSize: 22 }}>{x.icon}</div>
                                <h3 className="pub-card-title">{x.title}</h3>
                                <p className="pub-card-desc">{x.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <h2>Looking for a Specific System?</h2>
                        <p>Tell us your requirements and we'll source the right equipment for your facility.</p>
                        <div className="pub-cta-btns">
                            <Link to="/contact" className="pub-btn-primary">Submit an Enquiry →</Link>
                            <a href="https://wa.me/923225014415" target="_blank" rel="noreferrer" className="pub-btn-outline">💬 WhatsApp Us</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
