/* ── Simple "Coming Soon" placeholder for modules not yet built ── */
export default function ComingSoon({ title = 'Module' }) {
    return (
        <div className="page-loader" style={{ minHeight: '60vh' }}>
            <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'var(--brand-red-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
            }}>
                🚧
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 800,
                    color: 'var(--brand-navy)',
                    marginBottom: 8,
                }}>
                    {title}
                </p>
                <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)' }}>
                    This module is being built — coming next step.
                </p>
            </div>
        </div>
    );
}
