import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';
import ScrollFloat from '../../components/animations/ScrollFloat';
import FadeIn from '../../components/animations/FadeIn';

const SERVICES = [
    {
        icon: '🔧', title: 'Preventive Maintenance',
        features: ['Scheduled PPM visits', 'Parts inspection & replacement', 'Performance benchmarking', 'Safety checks & compliance'],
        desc: 'Stay ahead of equipment failures with structured maintenance contracts. Our engineers carry out thorough inspections to keep your systems within OEM specifications.'
    },
    {
        icon: '🩺', title: 'Emergency Repair',
        features: ['24/7 call-out availability', 'Rapid fault diagnosis', 'On-site & remote support', 'Minimal downtime guarantee'],
        desc: 'When equipment fails, every minute matters. Our rapid-response team provides emergency repair services across Pakistan, often resolving issues on the first visit.'
    },
    {
        icon: '🏗️', title: 'Equipment Installation',
        features: ['Site survey & planning', 'Civil & electrical coordination', 'System commissioning', 'Staff handover & training'],
        desc: 'From initial site survey to full commissioning, we manage your MRI or CT installation end-to-end — ensuring compliance with all technical and safety requirements.'
    },
    {
        icon: '⚙️', title: 'System Upgrades',
        features: ['Software & hardware upgrades', 'Coil & component replacement', 'Performance enhancement', 'Post-upgrade testing'],
        desc: 'Extend the life of your existing systems with targeted upgrades. We source and fit genuine and OEM-compatible components to restore peak performance.'
    },
    {
        icon: '📦', title: 'Spare Parts Supply',
        features: ['Gradient amplifiers', 'Power supplies & boards', 'RF coils & cables', 'Tubes & cooling components'],
        desc: 'We maintain a curated inventory of spare parts for major MRI and CT platforms. Fast delivery ensures your engineers can complete repairs without long wait times.'
    },
    {
        icon: '📋', title: 'Service Contracts',
        features: ['Annual & multi-year plans', 'Priority response SLAs', 'Unlimited call-outs included', 'Detailed service reports'],
        desc: 'Protect your investment with a tailored service contract. Predictable costs, priority scheduling, and comprehensive coverage give you peace of mind all year round.'
    },
];

export default function ServicesPage() {
    useSEO(
        'Services — MRI, CT & Imaging Equipment',
        'Full-spectrum medical imaging services: MRI repair, CT scanner maintenance, equipment installation, preventive maintenance contracts, and 24/7 emergency support across Pakistan.'
    );
    return (
        <div>
            {/* Video Hero with BlurText */}
            <section className="pub-page-hero pub-page-hero--video">
                <video
                    className="pub-page-hero-video"
                    src="/services.mp4.mp4"
                    autoPlay loop muted playsInline preload="auto"
                />
                <div className="pub-page-hero-overlay" />
                <div className="pub-page-hero-content">
                    <span className="pub-page-hero-tag">Our Services</span>
                    <h1>
                        End-to-End{' '}
                        <span className="hero-accent">
                            Imaging Equipment
                        </span>
                        <br />
                        Services
                    </h1>
                    <p>From preventive maintenance to emergency breakdown support —
                        we provide the full spectrum of technical services for your MRI and CT equipment.</p>
                </div>
            </section>

            {/* Services grid */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="services-grid">
                        {SERVICES.map((s, i) => (
                            <FadeIn key={s.title} delay={i * 90} className="service-card">
                                <div className="service-card-icon">{s.icon}</div>
                                <h3 className="service-card-title">{s.title}</h3>
                                <p className="service-card-desc">{s.desc}</p>
                                <ul className="service-card-list">
                                    {s.features.map(f => (
                                        <li key={f}><span className="service-check">✓</span>{f}</li>
                                    ))}
                                </ul>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">How We Work</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Simple, <span>Transparent</span> Process
                        </ScrollFloat>
                    </div>
                    <div className="pub-grid-4">
                        {[
                            { step: '01', title: 'Contact Us', desc: 'Reach out via phone, email or the contact form. Describe your equipment and the issue.' },
                            { step: '02', title: 'Site Assessment', desc: 'Our engineer performs a remote or on-site assessment to diagnose the problem accurately.' },
                            { step: '03', title: 'Proposal & Quote', desc: 'We provide a clear, itemised quote with no hidden charges and realistic timelines.' },
                            { step: '04', title: 'Service & Handover', desc: 'Work is completed to the highest standard. Full documentation provided on handover.' },
                        ].map((p, i) => (
                            <FadeIn key={p.step} delay={i * 100} className="process-step">
                                <div className="process-step-num">{p.step}</div>
                                <h3 className="process-step-title">{p.title}</h3>
                                <p className="process-step-desc">{p.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <h2>Need a Service or Maintenance Quote?</h2>
                        <p>Our team is available 24/7. Get in touch for a fast, no-obligation response.</p>
                        <div className="pub-cta-btns">
                            <Link to="/contact" className="pub-btn-primary">Request a Quote →</Link>
                            <a href="tel:+923225014415" className="pub-btn-outline">+92 322 5014415</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
