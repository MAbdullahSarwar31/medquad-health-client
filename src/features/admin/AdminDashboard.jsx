import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI, clientsAPI, usersAPI, inventoryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    HiOutlineTicket, HiOutlineDesktopComputer, HiOutlineUserGroup,
    HiOutlineOfficeBuilding, HiOutlineCube, HiOutlineExclamation,
    HiOutlineRefresh, HiOutlineDotsVertical, HiOutlineEye
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
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [ticketStats, equipRes, clientRes, userRes, inventoryRes] = await Promise.all([
                ticketsAPI.getStats(),
                equipmentAPI.getAll({ limit: 1 }),
                clientsAPI.getAll({ limit: 1 }),
                usersAPI.getAll({ limit: 1 }),
                inventoryAPI.getAll({ needsReorder: 'true', limit: 1 }),
            ]);
            setStats(ticketStats.data.data);
            setRecentTickets(ticketStats.data.data.recentTickets || []);
            setTrendData(ticketStats.data.data.trendData || []);
            setEquipmentCount(equipRes.data.data.pagination.total);
            setClientCount(clientRes.data.data.pagination.total);
            setUserCount(userRes.data.data.pagination.total);
            setLowStockCount(inventoryRes.data.data.reorderCount || 0);
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#3B82F6] animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm font-medium">Welcome back, {user?.name}.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Recent Service Tickets</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Most recent maintenance requests</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/tickets')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
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
