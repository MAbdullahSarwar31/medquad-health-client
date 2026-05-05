import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI, clientsAPI, usersAPI, inventoryAPI, predictionsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    HiOutlineTicket, HiOutlineDesktopComputer, HiOutlineUserGroup,
    HiOutlineOfficeBuilding, HiOutlineCube, HiOutlineExclamation,
    HiOutlineRefresh, HiOutlineDotsVertical, HiOutlineEye, HiOutlineLightningBolt
} from 'react-icons/hi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentTickets, setRecentTickets] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [equipmentCount, setEquipmentCount] = useState(0);
    const [clientCount, setClientCount] = useState(0);
    const [userCount, setUserCount] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [predictions, setPredictions] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [ticketStats, equipRes, clientRes, userRes, inventoryRes, predictionRes] = await Promise.all([
                ticketsAPI.getStats(),
                equipmentAPI.getAll({ limit: 1 }),
                clientsAPI.getAll({ limit: 1 }),
                usersAPI.getAll({ limit: 1 }),
                inventoryAPI.getAll({ needsReorder: 'true', limit: 1 }),
                predictionsAPI.getAll(),
            ]);
            setStats(ticketStats.data.data);
            setRecentTickets(ticketStats.data.data.recentTickets || []);
            setTrendData(ticketStats.data.data.trendData || []);
            setEquipmentCount(equipRes.data.data.pagination.total);
            setClientCount(clientRes.data.data.pagination.total);
            setUserCount(userRes.data.data.pagination.total);
            setLowStockCount(inventoryRes.data.data.reorderCount || 0);
            setPredictions(predictionRes.data.data.predictions || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const getStatusLabel = (status) => {
        return status?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const getChartData = () => {
        if (!stats?.statusCounts) return [];
        return Object.entries(stats.statusCounts).map(([key, value]) => ({
            name: getStatusLabel(key),
            value: value
        }));
    };

    const pieData = getChartData();

    if (loading) {
        return (
            <div>
                {/* Skeleton page header */}
                <div style={{ marginBottom: 28 }}>
                    <div className="skeleton skeleton-title" style={{ width: 220, marginBottom: 8 }} />
                    <div className="skeleton skeleton-text-sm" style={{ width: 160 }} />
                </div>
                {/* Skeleton KPI grid */}
                <div className="kpi-grid">
                    {[...Array(5)].map((_, i) => (
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
                {/* Skeleton charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div className="skeleton-card"><div className="skeleton skeleton-rect" style={{ height: 280 }} /></div>
                    <div className="skeleton-card"><div className="skeleton skeleton-rect" style={{ height: 280 }} /></div>
                </div>
                {/* Skeleton table */}
                <div className="card">
                    <div className="card-header">
                        <div className="skeleton skeleton-text" style={{ width: 200 }} />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-table-row">
                            <div className="skeleton skeleton-text" style={{ width: 80 }} />
                            <div className="skeleton skeleton-text" style={{ flex: 1 }} />
                            <div className="skeleton skeleton-text" style={{ width: 60 }} />
                            <div className="skeleton skeleton-text" style={{ width: 70 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-header-title">Dashboard <span>Overview</span></h1>
                        <p className="page-header-sub">Welcome back, {user?.name}. Here's what's happening today.</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards — staggered entrance via .kpi-grid */}
            <div className="kpi-grid">
                {/* Tickets */}
                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                            <HiOutlineTicket className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800">{stats?.totalTickets || 0}</div>
                            <div className="text-sm font-semibold text-slate-500">Total Tickets</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-sm font-medium text-amber-600">
                        {stats?.openTickets || 0} open
                    </div>
                </div>

                {/* Equipment */}
                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <HiOutlineDesktopComputer className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800">{equipmentCount}</div>
                            <div className="text-sm font-semibold text-slate-500">Active Equipment</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-sm font-medium text-slate-400">
                        Registered devices
                    </div>
                </div>

                {/* Clients */}
                <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800">{clientCount}</div>
                            <div className="text-sm font-semibold text-slate-500">Client Organizations</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-sm font-medium text-slate-400">
                        {userCount} team member{userCount !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Inventory Alerts */}
                <div className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${lowStockCount > 0 ? 'border-red-500' : 'border-slate-300'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            <HiOutlineCube className="text-2xl" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-800">{lowStockCount}</div>
                            <div className="text-sm font-semibold text-slate-500">Low Stock Alerts</div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-sm font-medium flex items-center gap-1.5">
                        {lowStockCount > 0 ? (
                            <><HiOutlineExclamation className="text-red-500" /><span className="text-red-500">Reorder needed</span></>
                        ) : (
                            <span className="text-emerald-500">Inventory healthy</span>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Predictive Maintenance Widget */}
            {predictions.length > 0 && (() => {
                const critical = predictions.filter(p => p.riskTier === 'critical').length;
                const high = predictions.filter(p => p.riskTier === 'high').length;
                const moderate = predictions.filter(p => p.riskTier === 'moderate').length;
                return (
                    <div style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderLeft: '4px solid #E8192C',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(13,27,62,0.06)'
                    }}>
                        {/* Widget Header */}
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #fff0f1 0%, #ffe4e6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(232,25,44,0.15)' }}>
                                    <HiOutlineLightningBolt style={{ fontSize: '20px', color: '#E8192C' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0D1B3E', marginBottom: '4px', letterSpacing: '-0.2px' }}>
                                        AI Predictive Maintenance Intelligence
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        {critical > 0 && <span style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '20px', padding: '2px 10px' }}>🔴 {critical} Critical</span>}
                                        {high > 0 && <span style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '20px', padding: '2px 10px' }}>🟡 {high} High</span>}
                                        {moderate > 0 && <span style={{ fontSize: '11px', fontWeight: '700', color: '#1A4DB4', background: '#EBF0FA', border: '1px solid #BFDBFE', borderRadius: '20px', padding: '2px 10px' }}>🔵 {moderate} Moderate</span>}
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>• MedQuad AI v2.0</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={fetchDashboardData}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer', transition: 'all 150ms ease' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <HiOutlineRefresh style={{ fontSize: '14px' }} /> Re-run Analysis
                            </button>
                        </div>

                        {/* Prediction Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px', padding: '20px 24px' }}>
                            {predictions.map(pred => {
                                const tier = pred.riskTier || (pred.confidence >= 0.75 ? 'critical' : pred.confidence >= 0.55 ? 'high' : 'moderate');
                                const tierStyles = {
                                    critical: { border: '1px solid #FECACA', bg: '#FFFAFA', badge: '#DC2626', badgeBg: '#FEF2F2', label: 'CRITICAL', dot: '#EF4444' },
                                    high:     { border: '1px solid #FDE68A', bg: '#FFFDF5', badge: '#D97706', badgeBg: '#FFFBEB', label: 'HIGH RISK', dot: '#F59E0B' },
                                    moderate: { border: '1px solid #BFDBFE', bg: '#F8FAFF', badge: '#1A4DB4', badgeBg: '#EBF0FA', label: 'MODERATE', dot: '#3B82F6' },
                                };
                                const s = tierStyles[tier];
                                const confidencePct = Math.round(pred.confidence * 100);
                                const daysLeft = pred.predictedFailureDate
                                    ? Math.max(0, Math.round((new Date(pred.predictedFailureDate) - Date.now()) / (1000 * 60 * 60 * 24)))
                                    : null;
                                const factors = pred.riskFactors?.length > 0 ? pred.riskFactors : null;

                                return (
                                    <div key={pred._id} style={{ background: s.bg, border: s.border, borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, flexShrink: 0, boxShadow: `0 0 6px ${s.dot}` }}></span>
                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: s.badge, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</span>
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0D1B3E', lineHeight: '1.3', marginBottom: '2px' }}>
                                                    {pred.equipmentId?.name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                                                    {pred.equipmentId?.clientId?.orgName || 'Unassigned'} · SN: {pred.equipmentId?.serialNumber}
                                                </div>
                                            </div>
                                            {/* Confidence Meter */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: s.badge, lineHeight: '1' }}>{confidencePct}%</div>
                                                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence</div>
                                                <div style={{ width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${confidencePct}%`, background: s.dot, borderRadius: '4px', transition: 'width 600ms ease' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Failure Type + Countdown */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Failure Type</div>
                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{pred.failureType || 'Component Degradation'}</div>
                                            </div>
                                            {daysLeft !== null && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Est. Failure</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: daysLeft < 30 ? '#DC2626' : '#334155' }}>
                                                        {daysLeft === 0 ? 'Imminent' : `${daysLeft} days`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Risk Factors */}
                                        {factors && (
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Risk Factors Detected</div>
                                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {factors.slice(0, 3).map((f, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px', color: '#475569', fontWeight: '500', lineHeight: '1.4' }}>
                                                            <span style={{ color: s.dot, fontWeight: '900', flexShrink: 0, marginTop: '1px' }}>▸</span>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendation */}
                                        {!factors && pred.recommendations && (
                                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', padding: '8px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: '7px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                                <span style={{ fontWeight: '700', color: '#334155' }}>Recommendation: </span>{pred.recommendations}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                                            <button
                                                style={{ flex: 1, padding: '9px 16px', background: 'linear-gradient(135deg, #E8192C 0%, #C0141F 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(232,25,44,0.30)', transition: 'all 200ms ease' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                onClick={async () => {
                                                    try {
                                                        await predictionsAPI.createTicket(pred._id);
                                                        toast.success('Preventive maintenance ticket created!');
                                                        fetchDashboardData();
                                                    } catch (err) { toast.error('Failed to create ticket'); }
                                                }}
                                            >
                                                Create Preventive Ticket
                                            </button>
                                            <button
                                                style={{ padding: '9px 14px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 150ms ease' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
                                                onClick={async () => {
                                                    try {
                                                        await predictionsAPI.acknowledge(pred._id);
                                                        toast.success('Alert dismissed');
                                                        fetchDashboardData();
                                                    } catch (err) { toast.error('Failed to dismiss'); }
                                                }}
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h2 className="text-base font-bold text-slate-800 mb-6">Ticket Volume (7 Days)</h2>
                    <div className="flex-1 min-h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Donut */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h2 className="text-base font-bold text-slate-800 mb-6">Ticket Status Distribution</h2>
                    <div className="flex-1 min-h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#475569' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Tickets Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="card-header">
                    <div>
                        <h2 className="card-title">Recent Service Tickets</h2>
                        <p className="page-header-sub" style={{ marginTop: 2 }}>Most recent maintenance requests</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/tickets')}
                        className="btn btn-ghost btn-sm"
                    >
                        View All →
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-5 py-3">Ticket ID</th>
                                <th className="px-5 py-3">Equipment & Client</th>
                                <th className="px-5 py-3">Priority</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500 font-medium">
                                        No recent tickets found.
                                    </td>
                                </tr>
                            ) : (
                                recentTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                TCK-{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 text-sm">{ticket.equipment?.name || 'Unknown Equipment'}</span>
                                                <span className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                    <HiOutlineOfficeBuilding className="text-slate-400" />
                                                    {ticket.client?.orgName || ticket.client?.name || 'Unknown Client'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {ticket.priority === 'critical' && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">Critical</span>}
                                            {ticket.priority === 'high' && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 uppercase">High</span>}
                                            {ticket.priority === 'medium' && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">Medium</span>}
                                            {ticket.priority === 'low' && <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 uppercase">Low</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase border bg-slate-50 border-slate-200 text-slate-600">
                                                <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open' ? 'bg-red-500' : ticket.status === 'in-progress' ? 'bg-blue-500' : ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => navigate('/admin/tickets')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details">
                                                    <HiOutlineEye className="text-lg" />
                                                </button>
                                                <div className="relative inline-block outline-none" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenuId(null); }}>
                                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === ticket._id ? null : ticket._id); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors focus:outline-none" title="More Options">
                                                        <HiOutlineDotsVertical className="text-lg" />
                                                    </button>
                                                    <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 transition-all z-20 flex flex-col overflow-hidden ${openMenuId === ticket._id ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                                                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); navigate('/admin/tickets'); }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">View / Edit</button>
                                                        <button onClick={async (e) => { e.stopPropagation(); setOpenMenuId(null); if (window.confirm(`Delete ticket #${ticket.ticketNumber || ticket._id.slice(-6)}?`)) { try { await ticketsAPI.delete(ticket._id); toast.success('Ticket deleted.'); fetchDashboardData(); } catch (err) { toast.error('Delete failed.'); } } }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100">Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
