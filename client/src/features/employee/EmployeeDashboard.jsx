import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI } from '../../services/api';
import {
    MdConfirmationNumber, MdWarning, MdSchedule,
    MdCheckCircle, MdInventory, MdAttachMoney,
    MdArrowForward, MdBusiness, MdDirectionsCar, MdBuild
} from 'react-icons/md';

/* ── Shared badge helpers (design system aligned) ── */
const PRIORITY_MAP = {
    critical: 'badge badge-critical',
    high:     'badge badge-high',
    medium:   'badge badge-info',
    low:      'badge badge-gray',
};

const STATUS_COLORS = {
    open:          '#EF4444',
    assigned:      '#F59E0B',
    'in-progress': '#3B82F6',
    'on-hold':     '#6B7280',
    resolved:      '#22C55E',
    closed:        '#94A3B8',
};

const PriorityBadge = ({ priority }) => (
    <span className={PRIORITY_MAP[priority] || PRIORITY_MAP.low}>
        {priority || 'N/A'}
    </span>
);

const StatusBadge = ({ status }) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.closed;
    const label = status?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
    return (
        <span className="badge" style={{
            background: color + '18',
            color: color,
            border: `1px solid ${color}30`,
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color, display: 'inline-block', flexShrink: 0
            }} />
            {label}
        </span>
    );
};

/* ── Dashboard skeleton ── */
function DashboardSkeleton() {
    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 8 }} />
                <div className="skeleton skeleton-text-sm" style={{ width: 260 }} />
            </div>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-card">
                        <div className="skeleton-stat-card">
                            <div className="skeleton skeleton-icon" />
                            <div className="skeleton-stat-info">
                                <div className="skeleton skeleton-title" style={{ width: '50%' }} />
                                <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid-2-1" style={{ gap: 20 }}>
                <div className="card">
                    <div className="card-header"><div className="skeleton skeleton-text" style={{ width: 160 }} /></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-table-row">
                            <div className="skeleton skeleton-text" style={{ width: 70 }} />
                            <div className="skeleton skeleton-text" style={{ flex: 1 }} />
                            <div className="skeleton skeleton-text" style={{ width: 60 }} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="skeleton-card"><div className="skeleton skeleton-rect" style={{ height: 160 }} /></div>
                    <div className="skeleton-card"><div className="skeleton skeleton-rect" style={{ height: 120 }} /></div>
                </div>
            </div>
        </div>
    );
}

const EmployeeDashboard = () => {
    const { user }    = useAuth();
    const navigate    = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ticketsAPI.getAll({ limit: 100 })
            .then(res => setTickets(res.data?.data?.tickets || []))
            .catch(err => console.error('Failed to fetch tickets:', err))
            .finally(() => setLoading(false));
    }, []);

    const totalTickets = tickets.length;
    const openTickets  = tickets.filter(t => t.status === 'open').length;
    const inProgress   = tickets.filter(t => t.status === 'in-progress').length;
    const resolved     = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const critical     = tickets.filter(t => t.priority === 'critical').length;
    const high         = tickets.filter(t => t.priority === 'high').length;
    const medium       = tickets.filter(t => t.priority === 'medium').length;
    const low          = tickets.filter(t => t.priority === 'low').length;
    
    // Sort by AI Priority Score or fallback to standard priority mapping
    const prioritizedQueue = [...tickets]
        .filter(t => t.status !== 'resolved' && t.status !== 'closed')
        .sort((a, b) => {
            const getScore = (t) => t.aiPriorityScore || (t.priority === 'critical' ? 4 : t.priority === 'high' ? 3 : t.priority === 'medium' ? 2 : 1);
            return getScore(b) - getScore(a) || new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, 8);

    const resolvedPct = totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0;

    if (loading) return <DashboardSkeleton />;

    const kpiCards = [
        {
            icon: <MdConfirmationNumber />,
            iconClass: 'stat-icon-blue',
            value: totalTickets,
            label: 'Total Assigned',
            sub: 'All time',
        },
        {
            icon: <MdWarning />,
            iconClass: 'stat-icon-red',
            value: openTickets,
            label: 'Open',
            sub: `${inProgress} in progress`,
        },
        {
            icon: <MdSchedule />,
            iconClass: 'stat-icon-warn',
            value: inProgress,
            label: 'In Progress',
            sub: 'Active work',
        },
        {
            icon: <MdCheckCircle />,
            iconClass: 'stat-icon-green',
            value: resolved,
            label: 'Resolved',
            sub: `${resolvedPct}% resolution rate`,
        },
    ];

    const priorityRows = [
        { label: 'Critical', count: critical, color: '#EF4444' },
        { label: 'High',     count: high,     color: '#F59E0B' },
        { label: 'Medium',   count: medium,   color: '#3B82F6' },
        { label: 'Low',      count: low,       color: '#94A3B8' },
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-header-title">My <span>Dashboard</span></h1>
                        <p className="page-header-sub">
                            Welcome, <strong>{user?.name}</strong>.{' '}
                            {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} assigned to you.
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <button
                            onClick={() => navigate('/employee/tickets')}
                            className="btn btn-primary"
                        >
                            <MdConfirmationNumber />
                            My Tickets
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards — staggered via .kpi-grid */}
            <div className="kpi-grid">
                {kpiCards.map((card, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon ${card.iconClass}`}>{card.icon}</div>
                        <div className="stat-info">
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-change" style={{ color: 'var(--gray-500)', fontWeight: 400 }}>
                                {card.sub}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid-2-1" style={{ gap: 20 }}>

                {/* Prioritized Task Queue */}
                <div className="card">
                    <div className="card-header border-b border-slate-100 pb-4 mb-2">
                        <div>
                            <h2 className="card-title text-xl font-bold flex items-center gap-2">
                                <MdWarning className="text-amber-500" />
                                Prioritized Task Queue
                            </h2>
                            <p className="page-header-sub" style={{ marginTop: 2 }}>
                                {prioritizedQueue.length} active tickets sorted by AI urgency
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/employee/tickets')}
                            className="btn btn-ghost btn-sm"
                        >
                            View All <MdArrowForward />
                        </button>
                    </div>

                    {prioritizedQueue.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><MdConfirmationNumber /></div>
                            <h3 className="empty-state-title">No tickets assigned</h3>
                            <p className="empty-state-desc">
                                You have no tickets assigned yet. Check back later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 p-4">
                            {prioritizedQueue.map((ticket, idx) => {
                                // Mock drive time & parts based on ID for consistency
                                const driveMins = 15 + (ticket._id.charCodeAt(ticket._id.length-1) % 45);
                                const partsAvailable = (ticket._id.charCodeAt(ticket._id.length-2) % 10) > 2;

                                return (
                                <div
                                    key={ticket._id}
                                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-blue-300 transition-all group cursor-pointer"
                                    onClick={() => navigate('/employee/tickets')}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm
                                                ${idx === 0 ? 'bg-red-500' : idx < 3 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-base">{ticket.equipmentId?.name || 'Unknown Equipment'}</h3>
                                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <MdBusiness /> {ticket.clientId?.orgName || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge status={ticket.status} />
                                            {ticket.aiPriorityScore && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                                    AI Urgency: {ticket.aiPriorityScore}/5
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-3 border border-slate-100">
                                        <span className="font-semibold text-slate-900">Fault Category:</span> {ticket.aiCategory || ticket.equipmentId?.category || 'General'}
                                        <div className="mt-1 text-slate-600 line-clamp-1">{ticket.description}</div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-semibold">
                                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                                            <MdDirectionsCar className="text-sm text-slate-400" />
                                            Est. Drive: {driveMins} mins
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${partsAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <MdBuild className="text-sm" />
                                            {partsAvailable ? 'Parts Available' : 'Parts Required'}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Priority breakdown */}
                    <div className="card card-body" style={{ padding: 20 }}>
                        <h2 className="card-title" style={{ marginBottom: 16 }}>Priority Breakdown</h2>
                        {totalTickets === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', padding: '16px 0' }}>No tickets yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {priorityRows.map(row => (
                                    <div key={row.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                                            <span style={{ fontWeight: 600, color: row.color }}>{row.label}</span>
                                            <span style={{ fontWeight: 700, color: 'var(--gray-700)' }}>{row.count}</span>
                                        </div>
                                        <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                background: row.color,
                                                width: `${totalTickets > 0 ? (row.count / totalTickets) * 100 : 0}%`,
                                                transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="card card-body" style={{ padding: 20 }}>
                        <h2 className="card-title" style={{ marginBottom: 12 }}>Quick Actions</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { icon: <MdConfirmationNumber />, label: 'My Tickets', sub: 'View and update all tickets', path: '/employee/tickets', color: 'var(--brand-blue)' },
                                { icon: <MdInventory />,          label: 'Inventory',   sub: 'View parts and supplies',    path: '/employee/inventory', color: 'var(--gray-700)' },
                                { icon: <MdAttachMoney />,        label: 'My Expenses', sub: 'Submit expense claims',       path: '/employee/expenses',  color: '#16A34A' },
                            ].map(action => (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 12px',
                                        border: '1px solid var(--gray-200)',
                                        borderRadius: 10, background: 'none',
                                        cursor: 'pointer', textAlign: 'left',
                                        fontFamily: 'var(--font-family)',
                                        transition: 'background 150ms ease, border-color 150ms ease, transform 150ms ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--gray-50)';
                                        e.currentTarget.style.transform = 'translateX(3px)';
                                        e.currentTarget.style.borderColor = 'var(--gray-300)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                        e.currentTarget.style.borderColor = 'var(--gray-200)';
                                    }}
                                >
                                    <div style={{
                                        width: 34, height: 34, background: action.color,
                                        color: 'white', borderRadius: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, flexShrink: 0,
                                    }}>
                                        {action.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{action.label}</p>
                                        <p style={{ fontSize: 11, color: 'var(--gray-500)', margin: 0 }}>{action.sub}</p>
                                    </div>
                                    <MdArrowForward style={{ marginLeft: 'auto', color: 'var(--gray-400)', fontSize: 16 }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
