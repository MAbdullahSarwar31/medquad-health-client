import React, { useState, useEffect } from 'react';
import { ticketsAPI, usersAPI, clientsAPI, equipmentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import './AdminTickets.css';
import {
    MdSearch, MdFilterList, MdMoreVert, MdClose,
    MdConfirmationNumber, MdPerson, MdPrecisionManufacturing,
    MdTimeline, MdErrorOutline, MdCheckCircleOutline, MdOutlineAccessTime
} from 'react-icons/md';

const AdminTickets = () => {
    // State
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Dropdown data
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);
    const [equipment, setEquipment] = useState([]);

    // Selection state for detail view
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);

    // Modal states
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteStatus, setNoteStatus] = useState('');

    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [newTicketData, setNewTicketData] = useState({ clientId: '', equipmentId: '', priority: 'medium', description: '' });

    // Edit ticket modal
    const [isEditTicketModalOpen, setIsEditTicketModalOpen] = useState(false);
    const [editTicketData, setEditTicketData] = useState({ priority: '', status: '', description: '' });
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data
    const fetchTickets = async (page = 1, search = '', status = '') => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (status) params.status = status;

            const response = await ticketsAPI.getAll(params);
            setTickets(response.data.data.tickets);
            setPagination(response.data.data.pagination);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
            setError('Failed to load tickets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [empRes, cliRes, eqRes] = await Promise.all([
                    usersAPI.getAll({ role: 'employee' }),
                    clientsAPI.getAll(),
                    equipmentAPI.getAll()
                ]);
                setEmployees(empRes.data?.data?.users || []);
                setClients(cliRes.data?.data?.clients || []);
                setEquipment(eqRes.data?.data?.equipment || []);
            } catch (err) {
                console.error('Failed to load dropdown data:', err);
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        // Debounce search
        const delayDebounceFn = setTimeout(() => {
            fetchTickets(1, searchTerm, statusFilter);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter]);

    // Handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchTickets(newPage, searchTerm, statusFilter);
        }
    };

    const handleRowClick = async (ticket) => {
        try {
            // Fetch full ticket details including history logs when opened
            const response = await ticketsAPI.getById(ticket._id);
            setSelectedTicket(response.data.data.ticket);
            setIsDrawerOpen(true);
        } catch (err) {
            console.error('Failed to fetch ticket details:', err);
            // fallback to summary object
            setSelectedTicket(ticket);
            setIsDrawerOpen(true);
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setIsDetailMenuOpen(false);
        setTimeout(() => setSelectedTicket(null), 300); // Wait for transition
    };

    // Action Handlers
    const handleAssignEmployee = async (employeeId) => {
        if (!selectedTicket) return;

        // Show loading toast
        const toastId = toast.loading('Assigning employee...');

        try {
            await ticketsAPI.update(selectedTicket._id, { assignedEmployee: employeeId });
            const detailRes = await ticketsAPI.getById(selectedTicket._id);
            setSelectedTicket(detailRes.data.data.ticket);
            fetchTickets(pagination.page, searchTerm, statusFilter);

            toast.success('Employee assigned successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to assign employee', { id: toastId });
        }
    };

    const handleMarkResolved = async () => {
        if (!selectedTicket) return;

        const toastId = toast.loading('Marking ticket as resolved...');
        try {
            await ticketsAPI.update(selectedTicket._id, { status: 'resolved' });
            const detailRes = await ticketsAPI.getById(selectedTicket._id);
            setSelectedTicket(detailRes.data.data.ticket);
            fetchTickets(pagination.page, searchTerm, statusFilter);

            toast.success('Ticket resolved successfully!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to mark resolved', { id: toastId });
        }
    };

    const handleAddNoteSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTicket || !noteText) return;

        const toastId = toast.loading('Adding update note...');
        try {
            await ticketsAPI.addUpdate(selectedTicket._id, { message: noteText, status: noteStatus || selectedTicket.status });
            const detailRes = await ticketsAPI.getById(selectedTicket._id);
            setSelectedTicket(detailRes.data.data.ticket);
            fetchTickets(pagination.page, searchTerm, statusFilter);
            setIsNoteModalOpen(false);
            setNoteText('');
            setNoteStatus('');

            toast.success('Update note added', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to add note', { id: toastId });
        }
    };

    const handleNewTicketSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Creating new ticket...');
        try {
            await ticketsAPI.create(newTicketData);
            setIsNewTicketModalOpen(false);
            setNewTicketData({ clientId: '', equipmentId: '', priority: 'medium', description: '' });
            fetchTickets(1, searchTerm, statusFilter);
            toast.success('Ticket created successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to create ticket', { id: toastId });
        }
    };

    // Edit Ticket
    const openEditTicketModal = (ticket) => {
        setEditTicketData({
            priority: ticket.priority || 'medium',
            status: ticket.status || 'open',
            description: ticket.description || ''
        });
        setDeleteTarget(ticket); // reuse deleteTarget to hold the ticket ref for editing
        setIsDetailMenuOpen(false);
        setIsEditTicketModalOpen(true);
    };

    const handleEditTicketSubmit = async (e) => {
        e.preventDefault();
        if (!deleteTarget) return;
        setIsEditSubmitting(true);
        const toastId = toast.loading('Updating ticket...');
        try {
            await ticketsAPI.update(deleteTarget._id, editTicketData);
            toast.success('Ticket updated!', { id: toastId });
            setIsEditTicketModalOpen(false);
            // refresh detail drawer if open
            if (selectedTicket && selectedTicket._id === deleteTarget._id) {
                const detailRes = await ticketsAPI.getById(deleteTarget._id);
                setSelectedTicket(detailRes.data.data.ticket);
            }
            fetchTickets(pagination.page, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.', { id: toastId });
        } finally {
            setIsEditSubmitting(false);
        }
    };

    // Delete Ticket
    const openDeleteTicketModal = (ticket) => {
        setDeleteTarget(ticket);
        setIsDetailMenuOpen(false);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTicket = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await ticketsAPI.delete(deleteTarget._id);
            toast.success(`Ticket #${deleteTarget.ticketNumber} deleted.`);
            setIsDeleteModalOpen(false);
            if (selectedTicket && selectedTicket._id === deleteTarget._id) {
                closeDrawer();
            }
            setDeleteTarget(null);
            fetchTickets(1, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally {
            setIsDeleting(false);
        }
    };

    // UI Helpers
    const getPriorityBadge = (priority) => {
        const p = priority?.toLowerCase();
        if (p === 'critical') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">Critical</span>;
        if (p === 'high') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">High</span>;
        if (p === 'medium') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#3B82F6]">Medium</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Low</span>;
    };

    const getStatusIndicator = (status) => {
        const s = status?.toLowerCase();
        let sClass = 'bg-slate-50 text-slate-600 border-slate-200';
        let dotClass = 'bg-slate-400';

        if (s === 'open') {
            sClass = 'bg-slate-50 text-slate-600 border-slate-200';
            dotClass = 'bg-slate-400';
        }
        if (s === 'in-progress' || s === 'assigned') {
            sClass = 'bg-orange-50 text-[#F4A225] border-orange-200';
            dotClass = 'bg-[#F4A225]';
        }
        if (s === 'resolved' || s === 'closed') {
            sClass = 'bg-green-50 text-[#2D9B6F] border-green-200';
            dotClass = 'bg-[#2D9B6F]';
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sClass}`}>
                <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6 text-slate-700 p-6 bg-[#F8FAFC]">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Service Tickets</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and track maintenance requests</p>
                </div>
                <div>
                    <button
                        className="bg-[#E63946] hover:bg-red-700 text-white rounded-xl px-5 py-2.5 font-semibold shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-2"
                        onClick={() => setIsNewTicketModalOpen(true)}
                    >
                        + New Ticket
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 min-w-[250px]">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <input
                        type="text"
                        placeholder="Search tickets by ID or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-shadow text-sm"
                    />
                </div>
                <div className="relative">
                    <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-shadow appearance-none text-sm bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                {error && <div className="p-4 m-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Ticket ID</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Priority</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Client / Hospital</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Equipment</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Created</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Assigned To</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && tickets.length === 0 ? (
                                // Skeleton loading state
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded-full w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4 flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-slate-200"></div><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                    </tr>
                                ))
                            ) : tickets.length === 0 ? (
                                // Empty state
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <MdConfirmationNumber className="text-4xl text-slate-300 mb-2" />
                                            <p className="text-sm mt-2">No tickets found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr
                                        key={ticket._id}
                                        onClick={() => handleRowClick(ticket)}
                                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">#{ticket.ticketNumber}</td>
                                        <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-[#1E3A5F]">{ticket.clientId?.orgName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{ticket.equipmentId?.name}</td>
                                        <td className="px-6 py-4">{getStatusIndicator(ticket.status)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {ticket.assignedEmployee ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">
                                                        {ticket.assignedEmployee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-slate-700 font-medium">{ticket.assignedEmployee.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && tickets.length > 0 && (
                    <div className="mt-auto px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-slate-700">{pagination.total}</span> results
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-600 font-medium px-2">Page {pagination.page} of {pagination.pages}</span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DETAIL DRAWER OVERLAY */}
            <div
                className={`fixed inset-x-0 bottom-0 top-[64px] z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeDrawer}
            >
                <div
                    className={`absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 transform flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {selectedTicket ? (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-slate-800">#{selectedTicket.ticketNumber}</span>
                                    {getPriorityBadge(selectedTicket.priority)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative inline-block outline-none" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDetailMenuOpen(false); }}>
                                        <button onClick={(e) => { e.stopPropagation(); setIsDetailMenuOpen(!isDetailMenuOpen); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors focus:outline-none"><MdMoreVert className="text-xl" /></button>
                                        <div className={`absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-slate-100 transition-all z-20 flex flex-col overflow-hidden ${isDetailMenuOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-1 pointer-events-none'}`}>
                                            <button onClick={(e) => { e.stopPropagation(); openEditTicketModal(selectedTicket); }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Edit Ticket</button>
                                            <button onClick={(e) => { e.stopPropagation(); openDeleteTicketModal(selectedTicket); }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-100">Delete</button>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" onClick={closeDrawer}><MdClose className="text-xl" /></button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                                {/* Status & Desc */}
                                <div>
                                    <div className="mb-4">{getStatusIndicator(selectedTicket.status)}</div>
                                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                                            <MdPerson className="text-lg text-[#3B82F6]" /> Client Info
                                        </div>
                                        <div className="text-slate-800 font-semibold">{selectedTicket.clientId?.orgName}</div>
                                        <div className="text-slate-500 text-sm">{selectedTicket.clientId?.contactPerson}</div>
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                                            <MdPrecisionManufacturing className="text-lg text-[#3B82F6]" /> Equipment
                                        </div>
                                        <div className="text-slate-800 font-semibold truncate" title={selectedTicket.equipmentId?.name}>{selectedTicket.equipmentId?.name}</div>
                                        <div className="text-slate-500 text-sm">Model: {selectedTicket.equipmentId?.model}</div>
                                        <div className="text-slate-500 text-sm">SN: {selectedTicket.equipmentId?.serialNumber}</div>
                                    </div>
                                </div>

                                {/* Assignment */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Assigned Employee</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none shadow-sm font-medium"
                                        value={selectedTicket.assignedEmployee?._id || ''}
                                        onChange={(e) => handleAssignEmployee(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6 font-display">
                                        <MdTimeline className="text-[#3B82F6]" /> Update History
                                    </h4>
                                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                                        {selectedTicket.updates && selectedTicket.updates.length > 0 ? (
                                            selectedTicket.updates.map((update, idx) => (
                                                <div className="relative pl-6" key={idx}>
                                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-[#3B82F6] shadow-sm"></div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                                                    {update.updatedBy?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-semibold text-slate-800 text-sm">{update.updatedBy?.name}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-400 font-medium tracking-wide">
                                                                {new Date(update.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                        <div className="inline-flex">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                                                {update.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                            {update.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="pl-6 text-sm text-slate-400 italic">No updates recorded yet.</p>
                                        )}
                                        {/* Initial Request entry at the bottom */}
                                        <div className="relative pl-6">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-100 border-4 border-slate-300"></div>
                                            <div className="flex flex-col gap-2 opacity-80">
                                                <div className="flex justify-between items-start flex-wrap gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">
                                                            {(selectedTicket.createdBy?.name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-600 text-sm">{selectedTicket.createdBy?.name || 'Client User'}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium tracking-wide">
                                                        {new Date(selectedTicket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                                    Ticket opened.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                                    onClick={() => setIsNoteModalOpen(true)}
                                >
                                    Add Update Note
                                </button>
                                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                                    <button
                                        className="px-5 py-2.5 rounded-xl font-semibold bg-[#2D9B6F] text-white hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                                        onClick={handleMarkResolved}
                                    >
                                        <MdCheckCircleOutline className="text-xl" /> Mark as Resolved
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#3B82F6] animate-spin"></div>
                            <p className="text-sm font-medium">Loading details...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW TICKET MODAL */}
            {isNewTicketModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Create New Ticket</h2>
                            <button onClick={() => setIsNewTicketModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <MdClose className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleNewTicketSubmit} className="flex flex-col">
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client Hospital</label>
                                    <select
                                        required
                                        value={newTicketData.clientId}
                                        onChange={(e) => setNewTicketData({ ...newTicketData, clientId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none"
                                    >
                                        <option value="">Select a client...</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.orgName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Equipment</label>
                                    <select
                                        required
                                        value={newTicketData.equipmentId}
                                        onChange={(e) => setNewTicketData({ ...newTicketData, equipmentId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none"
                                    >
                                        <option value="">Select equipment...</option>
                                        {equipment.filter(eq => !newTicketData.clientId || eq.clientId?._id === newTicketData.clientId || eq.clientId === newTicketData.clientId).map(eq => (
                                            <option key={eq._id} value={eq._id}>{eq.name} ({eq.serialNumber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                                    <select
                                        required
                                        value={newTicketData.priority}
                                        onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={newTicketData.description}
                                        onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 resize-none outline-none"
                                        placeholder="Describe the issue in detail..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTicketModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl font-semibold bg-[#E63946] text-white hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                                >
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD NOTE MODAL */}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Add Update Note</h2>
                            <button onClick={() => setIsNoteModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <MdClose className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleAddNoteSubmit} className="flex flex-col">
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Update Message</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 resize-none outline-none"
                                        placeholder="Enter your progress update here..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Change Status (Optional)</label>
                                    <select
                                        value={noteStatus}
                                        onChange={(e) => setNoteStatus(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none"
                                    >
                                        <option value="">Keep current status</option>
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
                                <button
                                    type="button"
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl font-semibold bg-[#E63946] text-white hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                                >
                                    Add Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT TICKET MODAL */}
            {isEditTicketModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Edit Ticket</h2>
                            <button onClick={() => setIsEditTicketModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><MdClose className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleEditTicketSubmit} className="flex flex-col">
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                                    <select value={editTicketData.priority} onChange={e => setEditTicketData(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                                    <select value={editTicketData.status} onChange={e => setEditTicketData(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 outline-none">
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                                    <textarea rows="4" value={editTicketData.description} onChange={e => setEditTicketData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all text-sm text-slate-700 resize-none outline-none" placeholder="Update the issue description..."></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/80">
                                <button type="button" onClick={() => setIsEditTicketModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button type="submit" disabled={isEditSubmitting} className="px-5 py-2.5 rounded-xl font-semibold bg-[#3B82F6] text-white hover:bg-blue-600 active:scale-95 transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-60">
                                    {isEditSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Saving...</> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE TICKET CONFIRMATION */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><MdConfirmationNumber className="text-2xl" /></div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Ticket?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-1">You are about to permanently delete:</p>
                            <p className="font-bold text-slate-800 mb-0.5">#{deleteTarget?.ticketNumber}</p>
                            <p className="text-xs text-slate-400 mb-2 max-w-[280px] truncate">{deleteTarget?.description}</p>
                            <p className="text-xs text-red-500 font-semibold mb-6">This action cannot be undone.</p>
                            <div className="flex items-center gap-3 w-full">
                                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={confirmDeleteTicket} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Delete Ticket'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTickets;
