import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import useSEO from '../../hooks/useSEO';
import ScrollFloat from '../../components/animations/ScrollFloat';
import FadeIn from '../../components/animations/FadeIn';
import CountUp from '../../components/animations/CountUp';

const PROJECTS = [
    {
        id: 1,
        client: 'Advance Diagnostic Centre',
        location: 'Islamabad, ICT',
        type: 'MRI System',
        scope: 'Supply, installation and commissioning of a refurbished 1.5T MRI system. Full site preparation coordination, RF shielding, and technical staff training.',
        tags: ['MRI Installation', 'Staff Training', 'Site Prep'],
        result: 'System operational within 3 weeks of delivery.',
    },
    {
        id: 2,
        client: 'Abdullah Hospital',
        location: 'Lala Musa, Punjab',
        type: 'MRI System',
        scope: 'Preventive maintenance contract and emergency repair support for a 1.5T MRI scanner. Replaced gradient coil assembly and recalibrated magnet shimming.',
        tags: ['Preventive Maintenance', 'Emergency Repair', 'Calibration'],
        result: '99% uptime maintained throughout the contract period.',
    },
    {
        id: 3,
        client: 'Bahawalpur MRI Centre',
        location: 'Bahawalpur, Punjab',
        type: 'MRI System',
        scope: 'Turnkey supply and installation of a refurbished MRI system for a newly established diagnostic centre. Included civil works coordination, equipment delivery, and operator training.',
        tags: ['Turnkey Installation', 'MRI Supply', 'Training'],
        result: 'Centre became operational within 4 weeks, serving 30+ patients per day.',
    },
    {
        id: 4,
        client: 'Rahim X-Ray',
        location: 'Rahim Yar Khan, Punjab',
        type: 'CT Scanner',
        scope: 'Supply and commissioning of a refurbished 64-slice CT scanner. Provided comprehensive service contract including quarterly preventive maintenance visits.',
        tags: ['CT Scanner', 'Installation', 'Service Contract'],
        result: 'Scan capacity increased by 150% compared to the previous system.',
    },
    {
        id: 5,
        client: 'German Diagnostics',
        location: 'Rahim Yar Khan, Punjab',
        type: 'Spare Parts & Service',
        scope: 'Ongoing spare parts supply and corrective maintenance for existing MRI and CT infrastructure. Rapid parts sourcing from global suppliers reduced downtime significantly.',
        tags: ['Spare Parts', 'Corrective Maintenance', 'MRI & CT'],
        result: 'Average repair turnaround reduced from 14 days to under 3 days.',
    },
    {
        id: 6,
        client: 'LifeLine Diagnostic Centre',
        location: 'D.G. Khan, Punjab',
        type: 'MRI System',
        scope: 'Full supply, installation, and annual maintenance contract for a 1.5T refurbished MRI system. Remote monitoring setup included for proactive fault detection.',
        tags: ['MRI Installation', 'Annual Contract', 'Remote Monitoring'],
        result: 'First MRI facility established in the D.G. Khan region.',
    },
];

const STATS = [
    { value: '6+', label: 'Major Projects' },
    { value: '50+', label: 'Hospitals Served' },
    { value: '500+', label: 'Equipment Units' },
    { value: '4', label: 'Provinces Covered' },
];

export default function ProjectsPage() {
    useSEO(
        'Projects — Delivering Results Across Pakistan',
        'See how Medquad Health Solutions has installed, serviced and maintained MRI and CT equipment at hospitals in Islamabad, Bahawalpur, Rahim Yar Khan, D.G. Khan and more.'
    );
    return (
        <div>
            {/* Video Hero */}
            <section className="pub-page-hero pub-page-hero--video">
                <video
                    className="pub-page-hero-video"
                    src="/projects.mp4.mp4"
                    autoPlay loop muted playsInline preload="auto"
                />
                <div className="pub-page-hero-overlay" />
                <div className="pub-page-hero-content">
                    <span className="pub-page-hero-tag">Our Projects</span>
                    <h1>Delivering Results<br /><span className="hero-accent">Across Pakistan</span></h1>
                    <p>
                        From Islamabad to D.G. Khan — our engineers have installed, serviced, and
                        maintained imaging equipment at leading hospitals and diagnostic centres nationwide.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="projects-stats-bar">
                <div className="pub-container projects-stats-inner">
                    {STATS.map(s => (
                        <div key={s.label} className="projects-stat">
                            <span className="projects-stat-value">
                                <CountUp value={s.value} duration={2000} />
                            </span>
                            <span className="projects-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Projects grid */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">Case Studies</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Featured <span>Projects</span>
                        </ScrollFloat>
                        <ScrollFloat Tag="p" className="pub-section-sub" delay={150}>
                            Each engagement is backed by our commitment to quality installation,
                            reliable parts, and ongoing technical support.
                        </ScrollFloat>
                    </div>

                    <div className="projects-grid">
                        {PROJECTS.map((p, i) => (
                            <FadeIn key={p.id} delay={i * 90} className="project-card">
                                <div className="project-card-top">
                                    <span className="project-number">0{i + 1}</span>
                                    <span className="project-type-badge">{p.type}</span>
                                </div>
                                <h3 className="project-client">{p.client}</h3>
                                <p className="project-location">{p.location}</p>
                                <p className="project-scope">{p.scope}</p>
                                <div className="project-tags">
                                    {p.tags.map(t => (
                                        <span key={t} className="project-tag">{t}</span>
                                    ))}
                                </div>
                                <div className="project-outcome">
                                    <span className="project-outcome-label">Result</span>
                                    <p className="project-outcome-text">{p.result}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Regional coverage */}
            <section className="pub-section pub-section--gray">
                <div className="pub-container">
                    <div className="pub-section-header pub-section-header--center">
                        <ScrollFloat Tag="span" className="pub-section-tag">Coverage</ScrollFloat>
                        <ScrollFloat Tag="h2" className="pub-section-title" delay={80}>
                            Serving Healthcare<br /><span>Across Provinces</span>
                        </ScrollFloat>
                        <ScrollFloat Tag="p" className="pub-section-sub" delay={140}>
                            From the capital to southern Punjab, we bring reliable imaging technology to every region.
                        </ScrollFloat>
                    </div>
                    <div className="pub-grid-3">
                        {[
                            { region: 'Islamabad Capital Territory', cities: 'Islamabad', count: '1 Project' },
                            { region: 'Punjab — Central', cities: 'Lala Musa · Bahawalpur', count: '2 Projects' },
                            { region: 'Punjab — South', cities: 'Rahim Yar Khan · D.G. Khan', count: '3 Projects' },
                        ].map((r, i) => (
                            <FadeIn key={r.region} delay={i * 100} className="region-card">
                                <div className="region-card-count">{r.count}</div>
                                <h3 className="region-card-title">{r.region}</h3>
                                <p className="region-card-cities">{r.cities}</p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <h2>Ready to Start Your Project?</h2>
                        <p>Whether it's a new installation or an ongoing service contract —
                            our team is ready to support your facility.</p>
                        <div className="pub-cta-btns">
                            <Link to="/contact" className="pub-btn-primary">Discuss Your Project →</Link>
                            <Link to="/services" className="pub-btn-outline">View Our Services</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
