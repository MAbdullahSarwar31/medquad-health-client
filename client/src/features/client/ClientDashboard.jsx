import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI } from '../../services/api';
import {
    MdBuild, MdConfirmationNumber, MdCheckCircle,
    MdSchedule, MdArrowForward, MdReceipt, MdWarning
} from 'react-icons/md';
import { FiCheckSquare } from 'react-icons/fi';
import './ClientDashboard.css';

/* ── Shared status/priority helpers ── */
const STATUS_COLORS = {
    open:          '#EF4444',
    assigned:      '#F59E0B',
    'in-progress': '#3B82F6',
    'on-hold':     '#6B7280',
    resolved:      '#22C55E',
    closed:        '#94A3B8',
};

const PRIORITY_MAP = {
    critical: 'badge badge-critical',
    high:     'badge badge-high',
    medium:   'badge badge-info',
    low:      'badge badge-gray',
};

const StatusBadge = ({ status }) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.closed;
    const label = status?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
    return (
        <span className="badge" style={{
            background: color + '18', color,
            border: `1px solid ${color}30`,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            {label}
        </span>
    );
};

const PriorityBadge = ({ priority }) => (
    <span className={PRIORITY_MAP[priority] || PRIORITY_MAP.low}>{priority || 'N/A'}</span>
);

/* ── Equipment status helpers ── */
const EQ_STATUS = {
    operational:       { dot: '#22C55E', label: 'OK',    bg: '#F0FDF4', color: '#166534' },
    'under maintenance': { dot: '#F59E0B', label: 'Maint.', bg: '#FFFBEB', color: '#92400E' },
    'out of service':  { dot: '#EF4444', label: 'Down', bg: '#FEF2F2', color: '#991B1B' },
};

/* ── Skeleton ── */
function DashboardSkeleton() {
    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <div className="skeleton skeleton-title" style={{ width: 220, marginBottom: 8 }} />
                <div className="skeleton skeleton-text-sm" style={{ width: 280 }} />
            </div>
            <div className="kpi-grid">
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {[0, 1].map(i => (
                    <div key={i} className="card">
                        <div className="card-header"><div className="skeleton skeleton-text" style={{ width: 140 }} /></div>
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="skeleton-table-row">
                                <div className="skeleton skeleton-text" style={{ flex: 1 }} />
                                <div className="skeleton skeleton-text" style={{ width: 60 }} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="card">
                <div className="card-header"><div className="skeleton skeleton-text" style={{ width: 120 }} /></div>
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-rect" style={{ height: 80 }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const ClientDashboard = () => {
    const { user }   = useAuth();
    const navigate   = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [tickets,   setTickets]   = useState([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            equipmentAPI.getAll({ limit: 50 }),
            ticketsAPI.getAll({ limit: 50 }),
        ])
            .then(([eqRes, ticketRes]) => {
                setEquipment(eqRes.data?.data?.equipment || []);
                setTickets(ticketRes.data?.data?.tickets || []);
            })
            .catch(err => console.error('Failed to load client data:', err))
            .finally(() => setLoading(false));
    }, []);

    const totalEquipment    = equipment.length;
    const openTickets       = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
    const resolvedTickets   = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const operationalCount  = equipment.filter(e => e.status === 'operational').length;
    const maintenanceCount  = equipment.filter(e => e.status === 'under maintenance').length;
    const outOfServiceCount = equipment.filter(e => e.status === 'out of service').length;
    const lastServiceDate   = tickets
        .filter(t => t.status === 'resolved' || t.status === 'closed')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.updatedAt;
    const recentTickets = [...tickets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (loading) return <DashboardSkeleton />;

    const kpiCards = [
        {
            icon: <MdBuild />, iconClass: 'stat-icon-blue',
            value: totalEquipment, label: 'Total Equipment',
            sub: `${operationalCount} operational · ${maintenanceCount > 0 ? maintenanceCount + ' maint.' : ''}`,
        },
        {
            icon: <MdWarning />, iconClass: 'stat-icon-red',
            value: openTickets, label: 'Open Tickets',
            sub: `${inProgressTickets} in progress`,
        },
        {
            icon: <MdCheckCircle />, iconClass: 'stat-icon-green',
            value: resolvedTickets, label: 'Resolved Tickets',
            sub: 'All time',
        },
        {
            icon: <MdSchedule />, iconClass: 'stat-icon-navy',
            value: lastServiceDate
                ? new Date(lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'N/A',
            label: 'Last Service',
            sub: 'Most recent resolution',
            small: true,
        },
    ];

    const quickActions = [
        { icon: <MdConfirmationNumber />, label: 'Request Service', sub: 'Submit a new service ticket', path: '/client/tickets?new=1', color: 'var(--brand-red)' },
        { icon: <MdBuild />,             label: 'View Equipment',  sub: 'Check status & warranty info', path: '/client/equipment',    color: 'var(--brand-navy)' },
        { icon: <MdReceipt />,           label: 'My Invoices',     sub: 'View billing & invoices',       path: '/client/invoices',      color: '#16A34A' },
    ];

    return (
        <div className="cd-root">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-header-title">Client <span>Dashboard</span></h1>
                        <p className="page-header-sub">
                            Welcome back, <strong>{user?.name}</strong>. Here's your service overview.
                        </p>
                    </div>
                    <div className="page-header-actions">
                        <button onClick={() => navigate('/client/tickets?new=1')} className="btn btn-primary">
                            + New Ticket
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
                {kpiCards.map((card, i) => (
                    <div key={i} className="stat-card">
                        <div className={`stat-icon ${card.iconClass}`}>{card.icon}</div>
                        <div className="stat-info">
                            <div className="client-kpi-value" style={card.small ? { fontSize: 20, color: 'var(--brand-navy)' } : {}}>
                                {card.value}
                            </div>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-change" style={{ color: 'var(--gray-500)', fontWeight: 500 }}>{card.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Equipment Health */}
            <div className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Equipment Health</h2>
                            <p className="page-header-sub" style={{ marginTop: 2 }}>{totalEquipment} registered devices</p>
                        </div>
                        <button onClick={() => navigate('/client/equipment')} className="btn btn-ghost btn-sm">
                            View All <MdArrowForward />
                        </button>
                    </div>

                    {/* Health bar */}
                    {totalEquipment > 0 && (
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div className="eq-health-bar-container">
                                {operationalCount  > 0 && <div className="eq-health-segment" style={{ background: '#22C55E', width: `${(operationalCount  / totalEquipment) * 100}%` }} />}
                                {maintenanceCount  > 0 && <div className="eq-health-segment" style={{ background: '#F59E0B', width: `${(maintenanceCount  / totalEquipment) * 100}%` }} />}
                                {outOfServiceCount > 0 && <div className="eq-health-segment" style={{ background: '#EF4444', width: `${(outOfServiceCount / totalEquipment) * 100}%` }} />}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                                <div className="eq-legend-pill">
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                                    <span style={{ color: '#166534' }}>{operationalCount} Operational</span>
                                </div>
                                {maintenanceCount > 0 && (
                                    <div className="eq-legend-pill">
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                                        <span style={{ color: '#92400E' }}>{maintenanceCount} Maintenance</span>
                                    </div>
                                )}
                                {outOfServiceCount > 0 && (
                                    <div className="eq-legend-pill">
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                                        <span style={{ color: '#991B1B' }}>{outOfServiceCount} Down</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {equipment.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 20px' }}>
                            <div className="empty-state-icon"><MdBuild /></div>
                            <h3 className="empty-state-title">No equipment registered</h3>
                        </div>
                    ) : (
                        <div className="eq-items-grid">
                            {equipment.slice(0, 5).map(item => {
                            const s   = item.status;
                            const cfg = EQ_STATUS[s] || EQ_STATUS['out of service'];
                            return (
                                <div
                                    key={item._id}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '11px 20px', borderTop: '1px solid var(--gray-100)',
                                        transition: 'background 150ms ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>{item.name}</p>
                                            <p style={{ fontSize: 11, color: 'var(--gray-500)', margin: 0 }}>{item.category} · SN: {item.serialNumber}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                </div>

            {/* Ticket Status Board (Kanban) */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Active Service Board</h2>
                    <button onClick={() => navigate('/client/tickets')} className="btn btn-ghost btn-sm">
                        View All History <MdArrowForward />
                    </button>
                </div>
                <div style={{ padding: '16px' }}>
                    <div className="service-board">
                    {/* Open Column */}
                    <div className="kanban-column">
                        <div className="kanban-header">
                            <h3 className="kanban-title">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Open
                            </h3>
                            <span className="kanban-count">{tickets.filter(t => t.status === 'open').length}</span>
                        </div>
                        <div className="kanban-body">
                            {tickets.filter(t => t.status === 'open').length === 0 ? (
                                <div className="kanban-empty">
                                    <FiCheckSquare className="kanban-empty-icon" />
                                    <p style={{ margin: 0 }}>No open tickets</p>
                                </div>
                            ) : tickets.filter(t => t.status === 'open').map(t => (
                                <div key={t._id} onClick={() => navigate('/client/tickets')} className="kanban-card">
                                    <div className="kanban-card-accent" style={{ background: '#ef4444' }} />
                                    <div className="kanban-card-top">
                                        <span className="kanban-ticket-id">#{t.ticketNumber || t._id.slice(-6).toUpperCase()}</span>
                                        <PriorityBadge priority={t.priority} />
                                    </div>
                                    <h4 className="kanban-ticket-title">{t.equipmentId?.name}</h4>
                                    <p style={{ fontSize: 12, color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                                        {t.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* In Progress Column */}
                    <div className="kanban-column">
                        <div className="kanban-header">
                            <h3 className="kanban-title">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> In Progress
                            </h3>
                            <span className="kanban-count">{tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').length}</span>
                        </div>
                        <div className="kanban-body">
                            {tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').length === 0 ? (
                                <div className="kanban-empty">
                                    <FiCheckSquare className="kanban-empty-icon" />
                                    <p style={{ margin: 0 }}>No tickets in progress</p>
                                </div>
                            ) : tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').map(t => (
                                <div key={t._id} onClick={() => navigate('/client/tickets')} className="kanban-card">
                                    <div className="kanban-card-accent" style={{ background: '#3b82f6' }} />
                                    <div className="kanban-card-top">
                                        <span className="kanban-ticket-id">#{t.ticketNumber || t._id.slice(-6).toUpperCase()}</span>
                                        <PriorityBadge priority={t.priority} />
                                    </div>
                                    <h4 className="kanban-ticket-title">{t.equipmentId?.name}</h4>
                                    <p style={{ fontSize: 12, color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, marginBottom: 8 }}>
                                        {t.description}
                                    </p>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                                        Team Assigned
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resolved Column */}
                    <div className="kanban-column">
                        <div className="kanban-header">
                            <h3 className="kanban-title">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Resolved
                            </h3>
                            <span className="kanban-count">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</span>
                        </div>
                        <div className="kanban-body">
                            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length === 0 ? (
                                <div className="kanban-empty">
                                    <FiCheckSquare className="kanban-empty-icon" />
                                    <p style={{ margin: 0 }}>No resolved tickets yet</p>
                                </div>
                            ) : tickets.filter(t => t.status === 'resolved' || t.status === 'closed').slice(0,10).map(t => (
                                <div key={t._id} onClick={() => navigate('/client/tickets')} className="kanban-card" style={{ opacity: 0.85 }}>
                                    <div className="kanban-card-accent" style={{ background: '#10b981' }} />
                                    <div className="kanban-card-top">
                                        <span className="kanban-ticket-id">#{t.ticketNumber || t._id.slice(-6).toUpperCase()}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: 4 }}>
                                            {new Date(t.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="kanban-ticket-title" style={{ textDecoration: 'line-through', color: 'var(--gray-500)', margin: 0 }}>
                                        {t.equipmentId?.name}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Quick Actions</h2>
                </div>
                <div className="quick-actions-grid">
                    {quickActions.map(action => (
                        <button
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            className="qa-btn"
                            style={{ borderLeftColor: action.color }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div className="qa-icon-wrap" style={{ background: action.color }}>
                                    {action.icon}
                                </div>
                                <div className="qa-content">
                                    <h3 className="qa-title">{action.label}</h3>
                                    <p className="qa-sub">{action.sub}</p>
                                </div>
                            </div>
                            <MdArrowForward className="qa-arrow" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
