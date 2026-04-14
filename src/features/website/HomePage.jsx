import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';

import ScrollFloat from '../../components/animations/ScrollFloat';
import FadeIn from '../../components/animations/FadeIn';
import CountUp from '../../components/animations/CountUp';

import { FiTool, FiMonitor, FiSettings, FiShield, FiPackage, FiPhone, FiMapPin } from 'react-icons/fi';

const SERVICES = [
    { Icon: FiTool,     color: '#E8192C', bg: 'rgba(232,25,44,0.09)',   title: 'MRI System Service',      desc: 'Comprehensive maintenance and repair services for all MRI platforms including GE, Siemens, Philips, Canon and Hitachi systems.' },
    { Icon: FiMonitor,  color: '#1A4DB4', bg: 'rgba(26,77,180,0.09)',   title: 'CT Scanner Repair',       desc: 'Expert diagnosis and repair for CT scanners. From routine servicing to emergency breakdown support across all major brands.' },
    { Icon: FiSettings, color: '#059669', bg: 'rgba(5,150,105,0.09)',   title: 'Equipment Installation',   desc: 'Professional site planning, installation, and commissioning of new and refurbished imaging equipment to meet all regulatory standards.' },
    { Icon: FiShield,   color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', title: 'Preventive Maintenance',   desc: 'Scheduled PPM contracts that keep your equipment running at peak performance, reducing costly downtime and unexpected failures.' },
    { Icon: FiPackage,  color: '#D97706', bg: 'rgba(217,119,6,0.09)',  title: 'Spare Parts Supply',       desc: 'Genuine and OEM-compatible spare parts for MRI and CT systems — gradient amplifiers, power supplies, coils, tubes and cables.' },
    { Icon: FiPhone,    color: '#0891B2', bg: 'rgba(8,145,178,0.09)',  title: '24/7 Support',             desc: 'Round-the-clock remote and on-site support ensuring your critical imaging infrastructure stays operational when patients need it most.' },
];

const STATS = [
    { value: '500+', label: 'Equipment Units' },
    { value: '50+',  label: 'Hospitals Served' },
    { value: '99%',  label: 'Uptime Assured' },
    { value: '12+',  label: 'Years Experience' },
];

const BRANDS = ['GE Healthcare', 'Siemens Healthineers', 'Philips Healthcare', 'Canon Medical', 'Hitachi'];

const PROJECTS = [
    { name: 'Advance Diagnostic Centre', location: 'Islamabad' },
    { name: 'Abdullah Hospital',          location: 'Lala Musa' },
    { name: 'Bahawalpur MRI Centre',      location: 'Bahawalpur' },
    { name: 'Rahim X-Ray',               location: 'Rahim Yar Khan' },
    { name: 'German Diagnostics',         location: 'Rahim Yar Khan' },
    { name: 'LifeLine Diagnostic Centre', location: 'D.G. Khan' },
];

export default function HomePage() {
    useSEO(
        'Medical Imaging Equipment — MRI & CT Repair Pakistan',
        'Medquad Health Solutions — Supply, installation, repair and maintenance of MRI, CT and imaging equipment at hospitals across Pakistan. Islamabad, Punjab, Nationwide.'
    );
    return (
        <div className="home-page">
            {/* ══ HERO ══ */}
            <section className="home-hero">
                <video
                    className="home-hero-video"
                    src="/hero-background.mp4.mp4"
                    autoPlay loop muted playsInline preload="auto"
                />
                <div className="home-hero-overlay" />
                <div className="home-hero-content pub-container">
                    <div className="home-hero-badge">
                        Trusted Partner for Medical Imaging Equipment
                    </div>

                    <h1 className="home-hero-title">
                        Premium Refurbished<br />
                        <span className="hero-accent">MRI &amp; CT Scanners</span>
                    </h1>

                    <p className="home-hero-tagline">
                        Certified Equipment · Expert Service · Nationwide Coverage
                    </p>

                    <p className="home-hero-desc">
                        Medquad Health Solutions is Pakistan's premier provider of certified refurbished MRI and CT scanners —
                        offering service, repair, installation and maintenance for hospitals and diagnostic centres nationwide.
                    </p>

                    <div className="home-hero-btns">
                        <Link to="/contact" className="pub-btn-primary">Get a Quote →</Link>
                        <Link to="/products" className="pub-btn-outline">View Products</Link>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="home-stats-bar">
                    <div className="pub-container home-stats-inner">
                        {STATS.map(s => (
                            <div key={s.label} className="home-stat">
                                <span className="home-stat-value">
                                    <CountUp value={s.value} duration={2200} />
                                </span>
                                <span className="home-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ SERVICES ══ */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">What We Do</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Complete Imaging Equipment <span>Solutions</span>
                        </ScrollFloat>
                        <ScrollFloat Tag="p" className="pub-section-sub" delay={160}>
                            From sourcing and installation to ongoing maintenance and spare parts —
                            we keep your imaging equipment performing at its best.
                        </ScrollFloat>
                    </div>
                    <div className="pub-grid-3">
                        {SERVICES.map((s, i) => (
                            <FadeIn key={s.title} delay={i * 90} className="pub-card">
                                <div className="pub-card-icon" style={{ background: s.bg, color: s.color }}>
                                    <s.Icon size={22} strokeWidth={2} />
                                </div>
                                <h3 className="pub-card-title">{s.title}</h3>
                                <p className="pub-card-desc">{s.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 48 }}>
                        <Link to="/services" className="pub-btn-primary">View All Services →</Link>
                    </div>
                </div>
            </section>

            {/* ══ WHY CHOOSE US ══ */}
            <section className="pub-section">
                <div className="pub-container pub-grid-2">
                    <div>
                        <ScrollFloat Tag="span" className="pub-section-tag">Why Medquad</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Pakistan's Trusted<br /><span>Imaging Equipment</span> Partner
                        </ScrollFloat>
                        <p className="pub-section-sub" style={{ marginBottom: 32 }}>
                            With over a decade of experience and a team of certified engineers,
                            we bring precision, reliability, and affordability to every engagement.
                        </p>
                        <div className="home-reasons">
                            {[
                                'Certified refurbished equipment — tested to OEM standards',
                                'Multi-brand expertise: GE, Siemens, Philips, Canon, Hitachi',
                                'Nationwide service coverage across Pakistan',
                                'Fast turnaround — minimising patient care disruption',
                                'Competitive pricing without compromising quality',
                            ].map((text, i) => (
                                <FadeIn key={text} delay={i * 80} Tag="div" className="home-reason">
                                    <span className="home-reason-dot" />
                                    <span>{text}</span>
                                </FadeIn>
                            ))}
                        </div>
                        <Link to="/about" className="pub-btn-primary" style={{ marginTop: 28, display: 'inline-flex' }}>
                            About Us →
                        </Link>
                    </div>
                    <div className="home-brands-box">
                        <p className="home-brands-label">Brands We Service</p>
                        <div className="home-brands-grid">
                            {BRANDS.map((b, i) => (
                                <FadeIn key={b} delay={i * 70} Tag="div" className="home-brand-chip">{b}</FadeIn>
                            ))}
                        </div>
                        <div className="home-mission-box">
                            <p className="home-mission-quote">
                                "Provide exceptional quality and performance in every product we supply,
                                building lasting partnerships through trust and integrity."
                            </p>
                            <p className="home-mission-attr">— Medquad Health Solutions Mission</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ PROJECTS ══ */}
            <section className="pub-section pub-section--navy">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">Our Footprint</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Serving Healthcare<br /><span>Across Pakistan</span>
                        </ScrollFloat>
                        <ScrollFloat Tag="p" className="pub-section-sub" delay={160}>
                            Trusted by diagnostic centres and hospitals in major cities nationwide.
                        </ScrollFloat>
                    </div>
                    <div className="pub-grid-3" style={{ marginBottom: 48 }}>
                        {PROJECTS.map((p, i) => (
                            <FadeIn key={p.name} delay={i * 80} className="home-project-card">
                                <p className="home-project-name">{p.name}</p>
                                <p className="home-project-loc">
                                    <FiMapPin size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    {p.location}
                                </p>
                            </FadeIn>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Link to="/contact" className="pub-btn-outline">Partner with Us →</Link>
                    </div>
                </div>
            </section>

            {/* ══ CTA ══ */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <ScrollFloat Tag="h2" delay={0}>Ready to upgrade your<br />imaging infrastructure?</ScrollFloat>
                        <ScrollFloat Tag="p" delay={80}>Contact our team today for a free consultation and competitive quote.</ScrollFloat>
                        <div className="pub-cta-btns" style={{ marginTop: 36 }}>
                            <Link to="/contact" className="pub-btn-primary">Get a Free Quote →</Link>
                            <a href="tel:+923225014415" className="pub-btn-outline">Call Now</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
