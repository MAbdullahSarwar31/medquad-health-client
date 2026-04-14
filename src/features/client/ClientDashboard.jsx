import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI } from '../../services/api';
import {
    HiOutlineDesktopComputer, HiOutlineTicket, HiOutlineRefresh,
    HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationCircle,
    HiOutlineArrowRight
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
    const dotColor = status === 'open' ? 'bg-red-500' : status === 'in-progress' ? 'bg-blue-500' : status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400';
    const label = status?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase border bg-slate-50 border-slate-200 text-slate-600">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {label}
        </span>
    );
};

const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eqRes, ticketRes] = await Promise.all([
                equipmentAPI.getAll({ limit: 50 }),
                ticketsAPI.getAll({ limit: 50 }),
            ]);
            setEquipment(eqRes.data?.data?.equipment || []);
            setTickets(ticketRes.data?.data?.tickets || []);
        } catch (err) {
            console.error('Failed to load client data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const totalEquipment = equipment.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const lastServiceDate = tickets
        .filter(t => t.status === 'resolved' || t.status === 'closed')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.updatedAt;

    const operationalCount = equipment.filter(e => e.status === 'operational').length;
    const maintenanceCount = equipment.filter(e => e.status === 'under maintenance').length;
    const outOfServiceCount = equipment.filter(e => e.status === 'out of service').length;

    const recentTickets = [...tickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

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
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Client Dashboard</h1>
                    <p className="text-slate-500 text-sm">Welcome back, <strong>{user?.name}</strong>. Here's your service overview.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/client/tickets?new=1')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        + New Ticket
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <HiOutlineDesktopComputer className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{totalEquipment}</div>
                            <div className="text-xs font-semibold text-slate-500">Total Equipment</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-3 text-xs font-medium">
                        <span className="text-emerald-600">{operationalCount} OK</span>
                        {maintenanceCount > 0 && <span className="text-amber-600">{maintenanceCount} Maint.</span>}
                        {outOfServiceCount > 0 && <span className="text-red-600">{outOfServiceCount} Down</span>}
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <HiOutlineExclamationCircle className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{openTickets}</div>
                            <div className="text-xs font-semibold text-slate-500">Open Tickets</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-amber-600">
                        {inProgressTickets} in progress
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-emerald-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <HiOutlineCheckCircle className="text-xl" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{resolvedTickets}</div>
                            <div className="text-xs font-semibold text-slate-500">Resolved Tickets</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-400">
                        All time
                    </div>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-slate-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <HiOutlineClock className="text-xl" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-slate-800 leading-tight">
                                {lastServiceDate ? new Date(lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">Last Service</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-400">
                        Most recent resolution
                    </div>
                </div>
            </div>

            {/* Two-column row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Equipment Health */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Equipment Health</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{totalEquipment} registered devices</p>
                        </div>
                        <button onClick={() => navigate('/client/equipment')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <HiOutlineArrowRight />
                        </button>
                    </div>

                    {/* Health bar */}
                    {totalEquipment > 0 && (
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex rounded-full overflow-hidden h-2 mb-3">
                                {operationalCount > 0 && <div className="bg-emerald-500" style={{ width: `${(operationalCount / totalEquipment) * 100}%` }} />}
                                {maintenanceCount > 0 && <div className="bg-amber-400" style={{ width: `${(maintenanceCount / totalEquipment) * 100}%` }} />}
                                {outOfServiceCount > 0 && <div className="bg-red-500" style={{ width: `${(outOfServiceCount / totalEquipment) * 100}%` }} />}
                            </div>
                            <div className="flex gap-4 text-xs font-medium text-slate-600">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {operationalCount} Operational</span>
                                {maintenanceCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {maintenanceCount} Maintenance</span>}
                                {outOfServiceCount > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {outOfServiceCount} Down</span>}
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-slate-100">
                        {equipment.slice(0, 5).map(item => {
                            const s = item.status;
                            const dotCls = s === 'operational' ? 'bg-emerald-500' : s === 'under maintenance' ? 'bg-amber-400' : 'bg-red-500';
                            return (
                                <div key={item._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.category} · SN: {item.serialNumber}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s === 'operational' ? 'bg-emerald-100 text-emerald-700' : s === 'under maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {s === 'operational' ? 'OK' : s === 'under maintenance' ? 'Maint.' : 'Down'}
                                    </span>
                                </div>
                            );
                        })}
                        {equipment.length === 0 && (
                            <div className="px-5 py-8 text-center text-slate-400 text-sm">No equipment registered.</div>
                        )}
                    </div>
                </div>

                {/* Recent Tickets */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Recent Tickets</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{tickets.length} total</p>
                        </div>
                        <button onClick={() => navigate('/client/tickets')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <HiOutlineArrowRight />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentTickets.map(ticket => (
                            <div key={ticket._id} className="flex items-start justify-between px-5 py-3 hover:bg-slate-50 transition-colors gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {ticket.description?.substring(0, 60) || 'No description'}
                                        {ticket.description?.length > 60 ? '...' : ''}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {ticket.equipmentId?.name || 'Unknown Equipment'} · {new Date(ticket.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <StatusBadge status={ticket.status} />
                                    <PriorityBadge priority={ticket.priority} />
                                </div>
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <div className="px-5 py-8 text-center text-slate-400 text-sm">No tickets yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/client/tickets?new=1')}
                        className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center shrink-0">
                            <HiOutlineTicket className="text-xl" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Request Service</p>
                            <p className="text-xs text-slate-500">Submit a new service ticket</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/client/equipment')}
                        className="flex items-center gap-3 p-4 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-slate-700 text-white rounded-md flex items-center justify-center shrink-0">
                            <HiOutlineDesktopComputer className="text-xl" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">View Equipment</p>
                            <p className="text-xs text-slate-500">Check status & warranty info</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/client/tickets')}
                        className="flex items-center gap-3 p-4 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-md flex items-center justify-center shrink-0">
                            <HiOutlineCheckCircle className="text-xl" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Track Tickets</p>
                            <p className="text-xs text-slate-500">Monitor all service requests</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
