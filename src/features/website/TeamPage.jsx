import { Link } from 'react-router-dom';
import '../../components/PublicLayout.css';
import './Website.css';
import './LanyardTeam.css';
import useSEO from '../../hooks/useSEO';

const TEAM = [
    { name: 'M. Waleed Nawaz', title: 'Chief Executive Officer', edu: 'BS Electronics', exp: '12 Years', initial: 'W', dept: 'Leadership', image: '/M. Waleed Nawaz.jpeg' },
    { name: 'Rashid Mahmood', title: 'Project Manager', edu: 'MSc Physics', exp: '20 Years', initial: 'R', dept: 'Management', image: '/Rashid Mahmood.jpeg' },
    { name: 'M. Adeel Sarwar', title: 'Senior Service Engineer', edu: 'B-Tech Electronics', exp: '8 Years', initial: 'AS', dept: 'Engineering', image: '/M. Adeel Sarwar.png' },
    { name: 'Umair Razzaq', title: 'IT Manager', edu: 'MS Computer Science', exp: '8 Years', initial: 'U', dept: 'Technology' },
    { name: 'Abrar Ahmed', title: 'Lab Engineer', edu: 'MSc Electronics', exp: '6 Years', initial: 'Ab', dept: 'Engineering' },
    { name: 'Muhammad Taha', title: 'Lab Engineer', edu: 'MS Electronics', exp: '9 Years', initial: 'MT', dept: 'Engineering', image: '/Muhammad Taha.jpeg' },
    { name: 'M. Abdullah Sarwar', title: 'Lead Full-Stack Developer', edu: 'BS Software Engineering', exp: '3 Years', initial: 'AS', dept: 'Technology', image: '/M. Abdullah Sarwar.jpg' },
    { name: 'Abdullah Muzaffar', title: 'Accounts Manager', edu: 'MBA', exp: '5 Years', initial: 'AM', dept: 'Finance', image: '/Abdullah Muzaffar.jpeg' },
    { name: 'Muhammad Jahanzaib', title: 'Service Engineer', edu: 'Associate Engineer', exp: '2 Years', initial: 'J', dept: 'Engineering', image: '/Muhammad Jahanzaib.jpeg' },
    { name: 'Faheem Abbass', title: 'Service Engineer', edu: 'BS Electrical', exp: '11 Years', initial: 'FA', dept: 'Engineering' },
];

const AVATAR_COLORS = [
    'linear-gradient(135deg,#0D1B3E,#1A3A7A)',   // Waleed
    'linear-gradient(135deg,#C41222,#E8192C)',   // Rashid
    'linear-gradient(135deg,#1A4DB4,#2962D9)',   // Adeel
    'linear-gradient(135deg,#16437E,#1A4DB4)',   // Umair
    'linear-gradient(135deg,#92100D,#C41222)',   // Abrar
    'linear-gradient(135deg,#166534,#22A055)',   // Muhammad Taha
    'linear-gradient(135deg,#1A4DB4,#0D1B3E)',   // Abdullah Sarwar
    'linear-gradient(135deg,#0D1B3E,#16437E)',   // Abdullah Muzaffar
    'linear-gradient(135deg,#C41222,#92100D)',   // Jahanzaib
    'linear-gradient(135deg,#7C3AED,#9655F9)',   // Faheem Abbass
];

const CORD_COLORS = [
    '#0D1B3E', '#E8192C', '#1A4DB4', '#16437E',
    '#C41222', '#166534', '#1A4DB4', '#0D1B3E', '#C41222', '#7C3AED',
];

const DEPT_META = {
    Leadership: { bg: 'rgba(232,25,44,0.13)', color: '#D01020' },
    Management: { bg: 'rgba(26,77,180,0.13)', color: '#1A4DB4' },
    Engineering: { bg: 'rgba(37,99,235,0.13)', color: '#2563EB' },
    Technology: { bg: 'rgba(26,77,180,0.13)', color: '#1A4DB4' },
    Finance: { bg: 'rgba(22,103,52,0.13)', color: '#16803A' },
};

function LanyardItem({ member, index }) {
    const isLow = index % 2 === 1;
    const d = DEPT_META[member.dept];
    const cordColor = CORD_COLORS[index] || '#1A4DB4';

    return (
        <div className={`lc-item${isLow ? ' lc-item--low' : ''}`}>
            <div
                className="lc-unit"
                style={{ '--sway-delay': `${(index * 0.7).toFixed(1)}s` }}
            >
                {/* Cord */}
                <div className="lc-cord" style={{ background: `linear-gradient(to bottom, ${cordColor}, ${cordColor}55)` }} />

                {/* Flip card */}
                <div
                    className="lc-card"
                    title="Hover to reveal details"
                >
                    <div className="lc-card-inner">

                        {/* ── FRONT ── */}
                        <div className="lc-front">
                            <div className="lc-clip-hole" />
                            <div
                                className="lc-dept-pill"
                                style={{ background: d.bg, color: d.color, border: `1px solid ${d.color}33` }}
                            >
                                {member.dept}
                            </div>
                            <div className="lc-avatar-ring" style={!member.image ? { background: AVATAR_COLORS[index] } : {}}>
                                {member.image ? (
                                    <img src={member.image} alt={member.name} className="lc-avatar-img" />
                                ) : (
                                    <span className="lc-initials">{member.initial}</span>
                                )}
                            </div>
                            <h3 className="lc-name">{member.name}</h3>
                            <p className="lc-role">{member.title}</p>
                            <img src="/logo.png" alt="Medquad Health Solutions" className="lc-card-logo" />
                        </div>

                        {/* ── BACK ── */}
                        <div className="lc-back">
                            <div className="lc-clip-hole" />
                            <div className="lc-back-avatar-sm" style={!member.image ? { background: AVATAR_COLORS[index] } : {}}>
                                {member.image ? (
                                    <img src={member.image} alt={member.name} className="lc-avatar-img" />
                                ) : (
                                    member.initial
                                )}
                            </div>
                            <h3 className="lc-back-name">{member.name}</h3>
                            <div className="lc-back-rule" />
                            <p className="lc-back-role">{member.title}</p>

                            <div className="lc-spec-row">
                                <span className="lc-spec-label">Education</span>
                                <span className="lc-spec-val">{member.edu}</span>
                            </div>
                            <div className="lc-spec-row">
                                <span className="lc-spec-label">Experience</span>
                                <span className="lc-spec-val lc-spec-exp">{member.exp}</span>
                            </div>
                            <div className="lc-spec-row">
                                <span className="lc-spec-label">Department</span>
                                <span className="lc-spec-val" style={{ color: d.color }}>{member.dept}</span>
                            </div>

                            <div className="lc-back-brand">MEDQUAD HEALTH SOLUTIONS</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TeamPage() {
    useSEO(
        'Our Team — 10 Certified Imaging Specialists',
        'Meet the Medquad Health Solutions team — 10 certified biomedical engineers, service engineers, and specialists keeping medical imaging equipment operational nationwide.'
    );
    return (
        <div className="team-page">

            {/* ── Hero ── */}
            <section className="pub-page-hero">
                <span className="pub-page-hero-tag">Our Team</span>
                <h1>The Experts Behind<br /><span className="hero-accent">Every Repair</span></h1>
                <p>10 certified professionals driving Pakistan's medical imaging technology forward.</p>
            </section>

            {/* ── Lanyards ── */}
            <section className="lanyards-section">

                {/* Clean background - no particles */}

                {/* Top rail bar */}
                <div className="lanyards-rail-bar">
                    <span className="lanyards-rail-text">MEDQUAD HEALTH SOLUTIONS — TEAM CREDENTIALS</span>
                </div>

                <div className="pub-container">
                    <div className="lanyards-grid">
                        {TEAM.map((m, i) => (
                            <LanyardItem key={m.name} member={m} index={i} />
                        ))}
                    </div>
                </div>

                <p className="lanyards-hint-global">Hover over any badge to reveal credentials</p>
            </section>

            {/* ── CTA ── */}
            <section className="pub-section">
                <div className="pub-container">
                    <div className="pub-cta-banner">
                        <h2>Want to Join Our Team?</h2>
                        <p>We're always looking for talented engineers &amp; specialists passionate about healthcare technology.</p>
                        <div className="pub-cta-btns">
                            <a href="mailto:info@medquadhealth.com" className="pub-btn-primary">Send Your CV →</a>
                            <Link to="/contact" className="pub-btn-outline">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
