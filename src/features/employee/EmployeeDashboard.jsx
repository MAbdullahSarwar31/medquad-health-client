import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI } from '../../services/api';
import {
    HiOutlineTicket, HiOutlineRefresh, HiOutlineClock,
    HiOutlineCheckCircle, HiOutlineExclamationCircle,
    HiOutlineOfficeBuilding, HiOutlineArrowRight
} from 'react-icons/hi';

const PriorityBadge = ({ priority }) => {
    const map = {
        critical: 'bg-red-100 text-red-700',
        high: 'bg-amber-100 text-amber-700',
        medium: 'bg-blue-100 text-blue-700',
        low: 'bg-slate-100 text-slate-600',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${map[priority] || map.low}`}>{priority || 'N/A'}</span>;
};

const StatusBadge = ({ status }) => {
    const dot = status === 'open' ? 'bg-red-500' : status === 'in-progress' ? 'bg-blue-500' : status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400';
    const label = status?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase border bg-slate-50 border-slate-200 text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
};

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await ticketsAPI.getAll({ limit: 100 });
            setTickets(res.data?.data?.tickets || []);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    const critical = tickets.filter(t => t.priority === 'critical').length;
    const high = tickets.filter(t => t.priority === 'high').length;
    const medium = tickets.filter(t => t.priority === 'medium').length;
    const low = tickets.filter(t => t.priority === 'low').length;

    const recentTickets = [...tickets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Dashboard</h1>
                    <p className="text-slate-500 text-sm">Welcome, <strong>{user?.name}</strong>. {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} assigned to you.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/employee/tickets')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        <HiOutlineTicket className="text-lg" /> My Tickets
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <HiOutlineTicket className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{totalTickets}</div>
                            <div className="text-xs font-semibold text-slate-500">Total Assigned</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">All time</div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <HiOutlineExclamationCircle className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{openTickets}</div>
                            <div className="text-xs font-semibold text-slate-500">Open</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">{inProgress} in progress</div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-amber-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <HiOutlineClock className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{inProgress}</div>
                            <div className="text-xs font-semibold text-slate-500">In Progress</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">Active work</div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-emerald-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <HiOutlineCheckCircle className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{resolved}</div>
                            <div className="text-xs font-semibold text-slate-500">Resolved</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                        {totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0}% rate
                    </div>
                </div>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Tickets — 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Recent Tickets</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Latest {recentTickets.length} of {totalTickets}</p>
                        </div>
                        <button
                            onClick={() => navigate('/employee/tickets')}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            View All <HiOutlineArrowRight />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentTickets.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                <HiOutlineTicket className="text-4xl mx-auto mb-2" />
                                <p>No tickets assigned yet.</p>
                            </div>
                        ) : (
                            recentTickets.map(ticket => (
                                <div key={ticket._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                                            </span>
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {ticket.equipmentId?.name || 'Unknown Equipment'}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <HiOutlineOfficeBuilding className="shrink-0" />
                                            {ticket.clientId?.orgName || 'N/A'} · {new Date(ticket.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">

                    {/* Priority Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h2 className="text-base font-bold text-slate-800 mb-4">Priority Breakdown</h2>
                        {totalTickets === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No tickets yet</p>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { label: 'Critical', count: critical, bar: 'bg-red-500', text: 'text-red-600' },
                                    { label: 'High', count: high, bar: 'bg-amber-500', text: 'text-amber-600' },
                                    { label: 'Medium', count: medium, bar: 'bg-blue-500', text: 'text-blue-600' },
                                    { label: 'Low', count: low, bar: 'bg-slate-400', text: 'text-slate-500' },
                                ].map(row => (
                                    <div key={row.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={`font-semibold ${row.text}`}>{row.label}</span>
                                            <span className="font-bold text-slate-700">{row.count}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${row.bar}`}
                                                style={{ width: `${totalTickets > 0 ? (row.count / totalTickets) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                        <h2 className="text-base font-bold text-slate-800 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/employee/tickets')}
                                className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center shrink-0">
                                    <HiOutlineTicket className="text-sm" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">My Tickets</p>
                                    <p className="text-xs text-slate-500">View and update all tickets</p>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/employee/inventory')}
                                className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="w-8 h-8 bg-slate-600 text-white rounded flex items-center justify-center shrink-0">
                                    <HiOutlineClock className="text-sm" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Inventory</p>
                                    <p className="text-xs text-slate-500">View parts and supplies</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
