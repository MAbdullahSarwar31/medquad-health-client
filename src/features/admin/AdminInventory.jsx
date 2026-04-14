import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    MdSearch, MdFilterList, MdAdd, MdMoreVert, MdClose,
    MdInventory2, MdWarning, MdCheckCircle, MdEdit, MdDelete,
    MdOutlineCategory, MdOutlineStore, MdLocationOn
} from 'react-icons/md';
import { HiOutlineCube, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi';

const CATEGORIES = ['tubes', 'coils', 'sensors', 'motors', 'boards', 'cables', 'filters', 'misc'];

const getCategoryColor = (cat) => {
    const map = {
        tubes: 'bg-blue-50 text-blue-700 border-blue-200',
        coils: 'bg-purple-50 text-purple-700 border-purple-200',
        sensors: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        motors: 'bg-amber-50 text-amber-700 border-amber-200',
        boards: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        cables: 'bg-slate-50 text-slate-700 border-slate-200',
        filters: 'bg-rose-50 text-rose-700 border-rose-200',
        misc: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return map[cat] || map.misc;
};

const EMPTY_FORM = {
    partName: '',
    partNumber: '',
    description: '',
    category: 'misc',
    quantityOnHand: 0,
    reorderThreshold: 5,
    unitCost: 0,
    supplier: '',
    location: 'Warehouse A',
};

const AdminInventory = () => {
    // Data state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
    const [reorderCount, setReorderCount] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [reorderFilter, setReorderFilter] = useState('');

    // Drawer / Modal state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editItem, setEditItem] = useState(null); // null = create mode, object = edit mode
    const [form, setForm] = useState(EMPTY_FORM);

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // open action menu per row
    const [openMenuId, setOpenMenuId] = useState(null);

    // ─── Fetch ──────────────────────────────────────────────────────────
    const fetchItems = async (page = 1, search = '', category = '', needsReorder = '') => {
        try {
            setLoading(true);
            const params = { page, limit: 15 };
            if (search) params.search = search;
            if (category) params.category = category;
            if (needsReorder) params.needsReorder = needsReorder;

            const res = await inventoryAPI.getAll(params);
            setItems(res.data?.data?.items || []);
            setReorderCount(res.data?.data?.reorderCount || 0);
            setPagination(res.data?.data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load inventory. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => fetchItems(1, searchTerm, categoryFilter, reorderFilter), 400);
        return () => clearTimeout(t);
    }, [searchTerm, categoryFilter, reorderFilter]);

    // ─── Handlers ───────────────────────────────────────────────────────
    const openAddDrawer = () => {
        setEditItem(null);
        setForm(EMPTY_FORM);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (item) => {
        setEditItem(item);
        setForm({
            partName: item.partName || '',
            partNumber: item.partNumber || '',
            description: item.description || '',
            category: item.category || 'misc',
            quantityOnHand: item.quantityOnHand ?? 0,
            reorderThreshold: item.reorderThreshold ?? 5,
            unitCost: item.unitCost ?? 0,
            supplier: item.supplier || '',
            location: item.location || 'Warehouse A',
        });
        setOpenMenuId(null);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => { setEditItem(null); setForm(EMPTY_FORM); }, 300);
    };

    const handleFormChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading(editItem ? 'Updating item...' : 'Adding item...');
        try {
            if (editItem) {
                await inventoryAPI.update(editItem._id, form);
                toast.success('Inventory item updated!', { id: toastId });
            } else {
                await inventoryAPI.create(form);
                toast.success('Inventory item added!', { id: toastId });
            }
            closeDrawer();
            fetchItems(1, searchTerm, categoryFilter, reorderFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (item) => {
        setDeleteTarget(item);
        setOpenMenuId(null);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await inventoryAPI.delete(deleteTarget._id);
            toast.success(`"${deleteTarget.partName}" deleted.`);
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            fetchItems(1, searchTerm, categoryFilter, reorderFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">
                        Inventory Management
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Track parts, supplies, and reorder alerts
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openAddDrawer}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        <MdAdd className="text-xl" />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>

            {/* ── Alert Banner ── */}
            {reorderCount > 0 && (
                <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 shadow-sm">
                    <HiOutlineExclamation className="text-2xl text-amber-500 shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold text-sm">{reorderCount} item{reorderCount > 1 ? 's' : ''} require immediate reorder</p>
                        <p className="text-xs font-medium text-amber-700 mt-0.5">Stock has fallen below reorder threshold.</p>
                    </div>
                    <button
                        onClick={() => setReorderFilter(reorderFilter ? '' : 'true')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${reorderFilter === 'true' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    >
                        {reorderFilter === 'true' ? 'Clear Filter' : 'View Only'}
                    </button>
                </div>
            )}

            {/* ── Filters ── */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                    {/* Search */}
                    <div className="relative flex-1">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search parts, part numbers..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                        />
                    </div>
                    {/* Category Filter */}
                    <div className="relative">
                        <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="text-sm font-semibold text-slate-400 whitespace-nowrap">
                    {loading ? 'Loading...' : `${pagination.total} item${pagination.total !== 1 ? 's' : ''}`}
                </div>
            </div>

            {/* ── Error State ── */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
                    <HiOutlineExclamation className="text-xl shrink-0" />
                    <p className="font-semibold text-sm">{error}</p>
                </div>
            )}

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-6 py-4">Part Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-center">In Stock</th>
                                <th className="px-6 py-4 text-center">Threshold</th>
                                <th className="px-6 py-4">Unit Cost</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 rounded-lg"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                                <MdInventory2 className="text-3xl text-slate-400" />
                                            </div>
                                            <p className="font-bold text-slate-600">No inventory items found</p>
                                            <p className="text-sm text-slate-400">Add your first part or adjust your filters.</p>
                                            <button
                                                onClick={openAddDrawer}
                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-colors"
                                            >
                                                <MdAdd /> Add Item
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors group">
                                        {/* Part Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{item.partName}</span>
                                                <span className="font-mono text-xs text-slate-400 mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded w-fit">{item.partNumber}</span>
                                                {item.description && (
                                                    <span className="text-xs text-slate-500 mt-1 max-w-xs truncate">{item.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Category */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getCategoryColor(item.category)}`}>
                                                <MdOutlineCategory className="text-sm" />
                                                {item.category}
                                            </span>
                                        </td>
                                        {/* Qty */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-black ${item.needsReorder ? 'text-red-600' : 'text-slate-800'}`}>
                                                {item.quantityOnHand}
                                            </span>
                                        </td>
                                        {/* Threshold */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-semibold text-slate-500">{item.reorderThreshold}</span>
                                        </td>
                                        {/* Unit Cost */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {item.unitCost > 0 ? `$${item.unitCost.toFixed(2)}` : <span className="text-slate-400">—</span>}
                                            </span>
                                        </td>
                                        {/* Supplier */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">
                                                    {item.supplier || <span className="text-slate-400 font-normal">—</span>}
                                                </span>
                                                {item.location && (
                                                    <span className="flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                                                        <MdLocationOn className="text-sm" />{item.location}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {item.needsReorder ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-red-50 text-red-700 border-red-200">
                                                    <MdWarning className="text-sm" /> Reorder
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    <MdCheckCircle className="text-sm" /> In Stock
                                                </span>
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4 text-center">
                                            <div
                                                className="relative inline-block outline-none"
                                                tabIndex={-1}
                                                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenuId(null); }}
                                            >
                                                <button
                                                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === item._id ? null : item._id); }}
                                                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors focus:outline-none"
                                                >
                                                    <MdMoreVert className="text-xl" />
                                                </button>
                                                <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100 transition-all z-20 flex flex-col overflow-hidden ${openMenuId === item._id ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible translate-x-1 pointer-events-none'}`}>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); openEditDrawer(item); }}
                                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                    >
                                                        <MdEdit className="text-base" /> Edit Item
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); openDeleteModal(item); }}
                                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-100"
                                                    >
                                                        <MdDelete className="text-base" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <span className="text-sm font-medium text-slate-500">
                            Page {pagination.page} of {pagination.pages} · {pagination.total} items
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchItems(pagination.page - 1, searchTerm, categoryFilter, reorderFilter)}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => fetchItems(pagination.page + 1, searchTerm, categoryFilter, reorderFilter)}
                                disabled={pagination.page >= pagination.pages}
                                className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════
                ADD / EDIT DRAWER
            ══════════════════════════════════════════════ */}
            {/* Backdrop */}
            <div
                className={`fixed inset-x-0 bottom-0 top-[64px] bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={closeDrawer}
            />
            {/* Drawer Panel */}
            <div className={`fixed top-[64px] right-0 h-[calc(100vh-64px)] w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <MdInventory2 className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-800">
                                {editItem ? 'Edit Item' : 'Add Inventory Item'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {editItem ? `Editing: ${editItem.partName}` : 'Enter part details below'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Drawer Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {/* Part Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Part Name *</label>
                        <input
                            type="text"
                            name="partName"
                            value={form.partName}
                            onChange={handleFormChange}
                            required
                            placeholder="e.g. MRI Gradient Coil"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Part Number */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Part Number *</label>
                        <input
                            type="text"
                            name="partNumber"
                            value={form.partNumber}
                            onChange={handleFormChange}
                            required
                            placeholder="e.g. MRI-GC-7T-2024"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleFormChange}
                            rows={2}
                            placeholder="Brief description of this part..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Category *</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Qty + Threshold Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Qty on Hand *</label>
                            <input
                                type="number"
                                name="quantityOnHand"
                                value={form.quantityOnHand}
                                onChange={handleFormChange}
                                min={0}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Reorder Threshold *</label>
                            <input
                                type="number"
                                name="reorderThreshold"
                                value={form.reorderThreshold}
                                onChange={handleFormChange}
                                min={0}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                            />
                        </div>
                    </div>

                    {/* Unit Cost */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Unit Cost ($)</label>
                        <input
                            type="number"
                            name="unitCost"
                            value={form.unitCost}
                            onChange={handleFormChange}
                            min={0}
                            step="0.01"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Supplier</label>
                        <div className="relative">
                            <MdOutlineStore className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                type="text"
                                name="supplier"
                                value={form.supplier}
                                onChange={handleFormChange}
                                placeholder="Supplier name"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Storage Location</label>
                        <div className="relative">
                            <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                            <input
                                type="text"
                                name="location"
                                value={form.location}
                                onChange={handleFormChange}
                                placeholder="e.g. Warehouse A, Shelf B3"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                            />
                        </div>
                    </div>

                    {/* Reorder Warning Preview */}
                    {form.quantityOnHand <= form.reorderThreshold && (
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <MdWarning className="text-amber-500 text-xl shrink-0" />
                            <p className="text-xs font-semibold text-amber-700">
                                Quantity is at or below reorder threshold. This item will be flagged for reorder.
                            </p>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="shrink-0 px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={closeDrawer}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{editItem ? 'Saving...' : 'Adding...'}</>
                        ) : (
                            <>{editItem ? <MdEdit /> : <MdAdd />}{editItem ? 'Save Changes' : 'Add Item'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                DELETE CONFIRM MODAL
            ══════════════════════════════════════════════ */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <MdDelete className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Item?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-1">
                                You are about to permanently delete:
                            </p>
                            <p className="font-bold text-slate-800 mb-1">{deleteTarget?.partName}</p>
                            <p className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded mb-6">{deleteTarget?.partNumber}</p>
                            <p className="text-xs text-red-500 font-semibold mb-6">This action cannot be undone.</p>
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <MdDelete />
                                    )}
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
