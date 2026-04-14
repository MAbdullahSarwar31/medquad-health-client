import { useState, useEffect } from 'react';
import { ticketsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    HiOutlineTicket, HiOutlineRefresh, HiOutlineSearch,
    HiOutlineOfficeBuilding, HiOutlineChevronDown
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

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'];

const EmployeeTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

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

    const handleStatusChange = async (ticketId, newStatus) => {
        setUpdatingId(ticketId);
        try {
            await ticketsAPI.update(ticketId, { status: newStatus });
            toast.success(`Ticket status updated to "${newStatus}"`);
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = tickets.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !search
            || t.description?.toLowerCase().includes(q)
            || t.equipmentId?.name?.toLowerCase().includes(q)
            || t.clientId?.orgName?.toLowerCase().includes(q);
        const matchStatus = !statusFilter || t.status === statusFilter;
        const matchPriority = !priorityFilter || t.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    const sorted = [...filtered].sort((a, b) => {
        // Surface critical/high open tickets first
        const urgencyScore = (t) => {
            if (t.status === 'resolved' || t.status === 'closed') return 10;
            const p = { critical: 0, high: 1, medium: 2, low: 3 };
            return p[t.priority] ?? 4;
        };
        return urgencyScore(a) - urgencyScore(b) || new Date(b.createdAt) - new Date(a.createdAt);
    });

    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading tickets...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Tickets</h1>
                    <p className="text-slate-500 text-sm">All tickets assigned to you. Update status as you work.</p>
                </div>
            </div>

            {/* KPI summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-slate-800">{openCount}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Open</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-slate-800">{inProgressCount}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">In Progress</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
                    <div className="text-2xl font-bold text-slate-800">{resolvedCount}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Resolved</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by equipment, client, or description..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Ticket list — card style */}
            <div className="space-y-3">
                {sorted.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                        <HiOutlineTicket className="text-5xl mx-auto mb-3" />
                        <p className="font-semibold">No tickets found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    sorted.map(ticket => {
                        const isExpanded = expandedId === ticket._id;
                        return (
                            <div
                                key={ticket._id}
                                className={`bg-white rounded-lg border shadow-sm transition-all ${isExpanded ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}
                            >
                                {/* Ticket row */}
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                                >
                                    {/* Priority indicator */}
                                    <div className={`w-1 self-stretch rounded-full shrink-0 ${ticket.priority === 'critical' ? 'bg-red-500' :
                                            ticket.priority === 'high' ? 'bg-amber-500' :
                                                ticket.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300'
                                        }`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                                            </span>
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>
                                        <p className="font-semibold text-slate-800 text-sm truncate">
                                            {ticket.equipmentId?.name || 'Unknown Equipment'}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                            <HiOutlineOfficeBuilding className="shrink-0" />
                                            {ticket.clientId?.orgName || 'N/A'} · {new Date(ticket.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusBadge status={ticket.status} />
                                        <HiOutlineChevronDown className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded panel */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Issue Description</p>
                                                <p className="text-sm text-slate-700 bg-slate-50 rounded-md p-3 leading-relaxed">
                                                    {ticket.description || 'No description provided.'}
                                                </p>
                                                {ticket.updatedAt && (
                                                    <p className="text-xs text-slate-400 mt-2">Last updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Update Status</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {STATUS_OPTIONS.map(s => {
                                                        const isActive = ticket.status === s;
                                                        const colorMap = {
                                                            'open': 'border-red-300 bg-red-50 text-red-700',
                                                            'in-progress': 'border-blue-300 bg-blue-50 text-blue-700',
                                                            'resolved': 'border-emerald-300 bg-emerald-50 text-emerald-700',
                                                            'closed': 'border-slate-300 bg-slate-50 text-slate-600',
                                                        };
                                                        const label = s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                        return (
                                                            <button
                                                                key={s}
                                                                onClick={() => !isActive && handleStatusChange(ticket._id, s)}
                                                                disabled={isActive || updatingId === ticket._id}
                                                                className={`py-2 px-3 rounded-md border text-xs font-bold uppercase transition-all
                                                                    ${isActive
                                                                        ? `${colorMap[s]} ring-2 ring-offset-1 ring-current cursor-default`
                                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'}
                                                                    ${updatingId === ticket._id ? 'opacity-50 cursor-wait' : ''}`}
                                                            >
                                                                {updatingId === ticket._id ? '...' : label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {sorted.length > 0 && (
                <p className="text-xs text-slate-400 mt-4 text-center">
                    Showing {sorted.length} of {tickets.length} tickets · Sorted by urgency
                </p>
            )}
        </div>
    );
};

export default EmployeeTickets;
