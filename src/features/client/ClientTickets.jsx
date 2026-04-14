import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { HiOutlineTicket, HiOutlineRefresh, HiOutlinePlus, HiOutlineSearch, HiX } from 'react-icons/hi';

const PriorityBadge = ({ priority }) => {
    const map = { critical: 'bg-red-100 text-red-700', high: 'bg-amber-100 text-amber-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${map[priority] || map.low}`}>{priority || 'N/A'}</span>;
};

const StatusBadge = ({ status }) => {
    const dotColor = status === 'open' ? 'bg-red-500' : status === 'in-progress' ? 'bg-blue-500' : status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400';
    const label = status?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase border bg-slate-50 border-slate-200 text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {label}
        </span>
    );
};

const ClientTickets = () => {
    const { user } = useAuth();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const openNew = queryParams.get('new') === '1';

    const [tickets, setTickets] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    // New ticket form
    const [showForm, setShowForm] = useState(openNew);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ equipmentId: '', priority: 'medium', description: '' });

    // Ticket detail
    const [selectedTicket, setSelectedTicket] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketRes, eqRes] = await Promise.all([
                ticketsAPI.getAll({ limit: 100 }),
                equipmentAPI.getAll({ limit: 100 }),
            ]);
            setTickets(ticketRes.data?.data?.tickets || []);
            setEquipment(eqRes.data?.data?.equipment || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.equipmentId) { toast.error('Please select equipment.'); return; }
        if (!form.description.trim()) { toast.error('Please describe the issue.'); return; }
        setSubmitting(true);
        try {
            await ticketsAPI.create({ ...form, clientId: user?._id });
            toast.success('Service ticket submitted successfully!');
            setForm({ equipmentId: '', priority: 'medium', description: '' });
            setShowForm(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = tickets.filter(t => {
        const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.equipmentId?.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || t.status === statusFilter;
        const matchPriority = !priorityFilter || t.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
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
                    <p className="text-slate-500 text-sm">View and manage your service requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        <HiOutlinePlus className="text-lg" /> New Ticket
                    </button>
                </div>
            </div>

            {/* KPI cards */}
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

            {/* New Ticket Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-slate-800">Submit a Service Request</h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                            <HiX className="text-xl" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Equipment *</label>
                                <select
                                    value={form.equipmentId}
                                    onChange={e => setForm(p => ({ ...p, equipmentId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select equipment...</option>
                                    {equipment.map(e => (
                                        <option key={e._id} value={e._id}>{e.name} ({e.serialNumber})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Priority *</label>
                                <select
                                    value={form.priority}
                                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="low">Low — Not urgent</option>
                                    <option value="medium">Medium — Standard request</option>
                                    <option value="high">High — Affects operations</option>
                                    <option value="critical">Critical — System down</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Description *</label>
                            <textarea
                                rows={4}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Describe the issue in detail — symptoms, when it started, error messages..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search description or equipment..."
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

            {/* Tickets List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Service Tickets</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-5 py-3">Ticket #</th>
                                <th className="px-5 py-3">Equipment</th>
                                <th className="px-5 py-3">Description</th>
                                <th className="px-5 py-3">Priority</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Submitted</th>
                                <th className="px-5 py-3">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                                        <HiOutlineTicket className="text-4xl mx-auto mb-3" />
                                        <p className="font-semibold">No tickets found</p>
                                        <p className="text-sm mt-1">Try adjusting your search, or submit a new service request.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered
                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                    .map(ticket => (
                                        <tr
                                            key={ticket._id}
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''}`}
                                            onClick={() => setSelectedTicket(selectedTicket?._id === ticket._id ? null : ticket)}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">{ticket.equipmentId?.name || 'N/A'}</td>
                                            <td className="px-5 py-4 text-sm text-slate-600 max-w-xs">
                                                <p className="truncate">{ticket.description || 'No description'}</p>
                                                {selectedTicket?._id === ticket._id && (
                                                    <p className="mt-2 text-xs text-slate-500 whitespace-normal">{ticket.description}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4"><PriorityBadge priority={ticket.priority} /></td>
                                            <td className="px-5 py-4"><StatusBadge status={ticket.status} /></td>
                                            <td className="px-5 py-4 text-xs text-slate-500">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-5 py-4 text-xs text-slate-500">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}</td>
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

export default ClientTickets;
