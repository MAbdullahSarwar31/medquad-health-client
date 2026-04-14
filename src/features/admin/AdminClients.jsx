import React, { useState, useEffect } from 'react';
import { clientsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    MdSearch, MdFilterList, MdAdd, MdMoreVert, MdClose,
    MdEmail, MdPhone, MdLocationOn, MdEventNote, MdEdit, MdDelete
} from 'react-icons/md';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

const EMPTY_CLIENT = {
    orgName: '', contactPerson: '', email: '', phone: '',
    contractStatus: 'active', contractExpiry: '', notes: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'Pakistan' }
};

const AdminClients = () => {
    // Data state
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [form, setForm] = useState(EMPTY_CLIENT);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────────────────
    const fetchClients = async (page = 1, search = '', status = '') => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (status) params.contractStatus = status;
            const res = await clientsAPI.getAll(params);
            setClients(res.data?.data?.clients || []);
            setPagination(res.data?.data?.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
            setError('Failed to load client organizations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => fetchClients(1, searchTerm, statusFilter), 500);
        return () => clearTimeout(t);
    }, [searchTerm, statusFilter]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) fetchClients(newPage, searchTerm, statusFilter);
    };

    // ─── Drawer ───────────────────────────────────────────────────────────
    const openAddDrawer = () => {
        setEditClient(null);
        setForm(EMPTY_CLIENT);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (client) => {
        setEditClient(client);
        setForm({
            orgName: client.orgName || '',
            contactPerson: client.contactPerson || '',
            email: client.email || '',
            phone: client.phone || '',
            contractStatus: client.contractStatus || 'active',
            contractExpiry: client.contractExpiry ? client.contractExpiry.substring(0, 10) : '',
            notes: client.notes || '',
            address: {
                street: client.address?.street || '',
                city: client.address?.city || '',
                state: client.address?.state || '',
                zipCode: client.address?.zipCode || '',
                country: client.address?.country || 'Pakistan',
            }
        });
        setOpenMenuId(null);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => { setEditClient(null); setForm(EMPTY_CLIENT); }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading(editClient ? 'Updating client...' : 'Registering client organization...');
        try {
            if (editClient) {
                await clientsAPI.update(editClient._id, form);
                toast.success('Client updated successfully!', { id: toastId });
            } else {
                await clientsAPI.create(form);
                toast.success('Organization registered successfully!', { id: toastId });
            }
            closeDrawer();
            fetchClients(1, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────
    const openDeleteModal = (client) => {
        setDeleteTarget(client);
        setOpenMenuId(null);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await clientsAPI.delete(deleteTarget._id);
            toast.success(`"${deleteTarget.orgName}" removed successfully.`);
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            fetchClients(1, searchTerm, statusFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─── UI Helpers ───────────────────────────────────────────────────────
    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        const map = {
            active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            expired: 'bg-red-50 text-red-700 border-red-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200',
        };
        const cls = map[s] || 'bg-slate-100 text-slate-600 border-slate-200';
        const dotColor = s === 'active' ? 'bg-emerald-500' : s === 'pending' ? 'bg-amber-500' : 'bg-red-500';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                {status}
            </span>
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Client Organizations</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage hospitals, clinics, and service contracts</p>
                </div>
                <button onClick={openAddDrawer} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20">
                    <MdAdd className="text-xl" /><span>Add Client</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                        <input type="text" placeholder="Search organization or contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <MdFilterList className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                            <option value="">All Contracts</option>
                            <option value="active">Active Contracts</option>
                            <option value="pending">Pending</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <span className="text-sm font-semibold text-slate-400">{loading ? 'Loading...' : `${pagination.total} client${pagination.total !== 1 ? 's' : ''}`}</span>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                    <MdClose className="text-lg" /> {error}
                </div>
            )}

            {/* Table */}
            <div className="relative min-h-[400px]">
                {loading && clients.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#3B82F6] animate-spin"></div>
                        <p className="text-sm font-medium">Loading organizations...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><HiOutlineOfficeBuilding className="text-4xl" /></div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Clients Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">No client organizations match your filters.</p>
                        <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="mt-6 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">Clear all filters</button>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="px-6 py-4">Organization</th>
                                        <th className="px-6 py-4">Primary Contact</th>
                                        <th className="px-6 py-4">Contract Status</th>
                                        <th className="px-6 py-4">Expiry Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {clients.map(client => (
                                        <tr key={client._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                        <span className="font-bold text-lg">{client?.orgName ? client.orgName.charAt(0).toUpperCase() : '?'}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{client?.orgName || 'Unknown Organization'}</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                            <MdLocationOn className="text-slate-400" />
                                                            {client?.address?.city || 'No city'}, {client?.address?.country || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{client?.contactPerson || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">{client?.email || 'N/A'}</div>
                                                {client?.phone && <div className="text-xs text-slate-400 mt-0.5">{client.phone}</div>}
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(client?.contractStatus)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <MdEventNote className="text-slate-400 text-lg" />
                                                    {client.contractExpiry ? new Date(client.contractExpiry).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-block outline-none" tabIndex={-1} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenuId(null); }}>
                                                    <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === client._id ? null : client._id); }} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors focus:outline-none">
                                                        <MdMoreVert className="text-xl" />
                                                    </button>
                                                    <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100 transition-all z-20 flex flex-col overflow-hidden ${openMenuId === client._id ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible translate-x-1 pointer-events-none'}`}>
                                                        <button onClick={e => { e.stopPropagation(); openEditDrawer(client); }} className="flex items-center gap-2 text-left w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                                            <MdEdit className="text-base" /> Edit Client
                                                        </button>
                                                        <button onClick={e => { e.stopPropagation(); openDeleteModal(client); }} className="flex items-center gap-2 text-left w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-100">
                                                            <MdDelete className="text-base" /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {!loading && clients.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-medium text-slate-500">
                            Showing <span className="font-bold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-slate-800">{pagination.total}</span> clients
                        </span>
                        <div className="flex items-center gap-2">
                            <button disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>
                            <span className="px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 rounded-xl">{pagination.page} / {pagination.pages}</span>
                            <button disabled={pagination.page === pagination.pages} onClick={() => handlePageChange(pagination.page + 1)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ════ ADD / EDIT DRAWER ════ */}
            <div className={`fixed inset-x-0 bottom-0 top-[64px] bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={closeDrawer} />
            <div className={`fixed top-[64px] right-0 h-[calc(100vh-64px)] w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-display">{editClient ? 'Edit Client' : 'Register New Client'}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">{editClient ? `Editing: ${editClient.orgName}` : 'Add a new hospital or clinic to the network.'}</p>
                    </div>
                    <button onClick={closeDrawer} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><MdClose className="text-xl" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Organization */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><HiOutlineOfficeBuilding className="text-blue-500 text-lg" /> Organization Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Organization Name <span className="text-red-500">*</span></label>
                                    <input required type="text" value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} placeholder="e.g. City General Hospital" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Primary Contact Person <span className="text-red-500">*</span></label>
                                    <input required type="text" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Dr. Sarah Jenkins" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Email <span className="text-red-500">*</span></label>
                                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@hospital.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Phone <span className="text-red-500">*</span></label>
                                        <input required type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92-321-0000000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><MdLocationOn className="text-emerald-500 text-lg" /> Location</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Street Address</label>
                                    <input type="text" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} placeholder="123 Medical Parkway" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">City</label>
                                        <input type="text" value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="e.g. Lahore" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">State/Province</label>
                                        <input type="text" value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} placeholder="e.g. Punjab" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Country</label>
                                        <input type="text" value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} placeholder="Pakistan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">ZIP Code</label>
                                        <input type="text" value={form.address.zipCode} onChange={e => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })} placeholder="54000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contract */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><MdEventNote className="text-amber-500 text-lg" /> Contract Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Contract Status <span className="text-red-500">*</span></label>
                                    <select required value={form.contractStatus} onChange={e => setForm({ ...form, contractStatus: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none">
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Contract Expiry <span className="text-red-500">*</span></label>
                                    <input required type="date" value={form.contractExpiry} onChange={e => setForm({ ...form, contractExpiry: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Internal Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special SLAs or access requirements..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"></textarea>
                        </div>
                        <div className="h-4"></div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                    <button disabled={isSubmitting} type="button" onClick={closeDrawer} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50">Cancel</button>
                    <button disabled={isSubmitting} type="submit" form="client-form" className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[#3B82F6] hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSubmitting ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>{editClient ? 'Saving...' : 'Registering...'}</> : (editClient ? 'Save Changes' : 'Register Client')}
                    </button>
                </div>
            </div>

            {/* ════ DELETE MODAL ════ */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><HiOutlineOfficeBuilding className="text-2xl" /></div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Client?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-1">You are about to permanently delete:</p>
                            <p className="font-bold text-slate-800 mb-0.5">{deleteTarget?.orgName}</p>
                            <p className="text-xs text-slate-400 mb-6">{deleteTarget?.email}</p>
                            <p className="text-xs text-red-500 font-semibold mb-6">This action cannot be undone. All associated data may be affected.</p>
                            <div className="flex items-center gap-3 w-full">
                                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Delete Client'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClients;
