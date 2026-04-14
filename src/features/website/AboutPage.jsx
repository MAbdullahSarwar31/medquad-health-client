import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';
import ScrollFloat from '../../components/animations/ScrollFloat';
import FadeIn from '../../components/animations/FadeIn';

const VALUES = [
    { icon: '🏆', title: 'Quality First', desc: 'Every system undergoes rigorous testing and certification to meet OEM performance standards before delivery.' },
    { icon: '🤝', title: 'Trust & Integrity', desc: 'We build lasting partnerships with healthcare institutions through transparent pricing and honest communication.' },
    { icon: '💡', title: 'Innovation', desc: 'Staying current with the latest imaging technology to offer cost-effective, cutting-edge solutions.' },
    { icon: '🌍', title: 'Healthcare for All', desc: 'Making high-quality imaging technology accessible to hospitals and clinics across Pakistan at affordable prices.' },
];

const TIMELINE = [
    { year: '2012', title: 'Founded', desc: 'Medquad Health Solutions established in Islamabad with a vision to transform medical imaging accessibility in Pakistan.' },
    { year: '2015', title: 'First MRI Installation', desc: 'Successfully installed and commissioned our first full MRI system at a major diagnostic centre in Punjab.' },
    { year: '2018', title: 'Expanded Services', desc: 'Launched comprehensive service contracts and preventive maintenance programs for hospitals across Pakistan.' },
    { year: '2021', title: 'National Footprint', desc: 'Grew to serve 50+ hospitals and diagnostic centres from Islamabad to Karachi, DG Khan, and Bahawalpur.' },
    { year: '2024', title: 'Today', desc: 'Over 500 active equipment units maintained, with a team of 8+ certified engineers and industry specialists.' },
];

export default function AboutPage() {
    useSEO(
        'About Us — Who We Are',
        'Learn about Medquad Health Solutions — a team of 10 certified medical imaging engineers and specialists serving hospitals across Pakistan since 2010.'
    );
    return (
        <div>
            {/* Hero */}
            <section className="pub-page-hero">
                <span className="pub-page-hero-tag">About Medquad</span>
                <h1>Transforming Medical Imaging<br /><span className="hero-accent">in Pakistan</span></h1>
                <p>A decade of excellence in sourcing, servicing, and supporting
                    MRI and CT imaging equipment for Pakistan's healthcare sector.</p>
            </section>

            {/* Mission */}
            <section className="pub-section">
                <div className="pub-container pub-grid-2">
                    <div>
                        <ScrollFloat Tag="span" className="pub-section-tag">Our Mission</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Built on <span>Purpose</span>
                        </ScrollFloat>
                        <p className="pub-section-sub">
                            Medquad Health Solutions was founded with a singular mission: to bridge the gap between
                            high-quality medical imaging technology and Pakistan's growing healthcare infrastructure.
                        </p>
                        <p className="pub-section-sub" style={{ marginTop: 16 }}>
                            We believe every patient deserves access to accurate, timely diagnostic imaging —
                            regardless of the hospital's size or budget. Certified refurbished equipment,
                            backed by expert service, makes this possible.
                        </p>
                    </div>
                    <FadeIn className="about-mission-visual" delay={150}>
                        <div className="about-mission-card">
                            <div className="about-mission-icon">🎯</div>
                            <h3>Our Vision</h3>
                            <p>To become Pakistan's most trusted partner in medical imaging technology —
                                known for reliability, expertise, and impact on patient outcomes.</p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Values */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">Core Values</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            What <span>Drives</span> Us
                        </ScrollFloat>
                    </div>
                    <div className="pub-grid-4">
                        {VALUES.map((v, i) => (
                            <FadeIn key={v.title} delay={i * 90} className="pub-card" style={{ textAlign: 'center' }}>
                                <div className="pub-card-icon" style={{ margin: '0 auto 20px' }}>{v.icon}</div>
                                <h3 className="pub-card-title">{v.title}</h3>
                                <p className="pub-card-desc">{v.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">Our Journey</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            A Decade of <span>Growth</span>
                        </ScrollFloat>
                    </div>
                    <div className="about-timeline">
                        {TIMELINE.map((t, i) => (
                            <FadeIn key={t.year} delay={i * 100} Tag="div"
                                className={`about-timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="about-timeline-card">
                                    <span className="about-timeline-year">{t.year}</span>
                                    <h3 className="about-timeline-title">{t.title}</h3>
                                    <p className="about-timeline-desc">{t.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <h2>Join 50+ Healthcare Partners<br />Across Pakistan</h2>
                        <p>Let's discuss how Medquad can support your imaging needs.</p>
                        <div className="pub-cta-btns">
                            <Link to="/contact" className="pub-btn-primary">Contact Us Today →</Link>
                            <Link to="/team" className="pub-btn-outline">Meet Our Team</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
