import React, { useState, useEffect } from 'react';
import { equipmentAPI, clientsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    MdSearch, MdFilterList,
    MdAdd, MdMoreVert, MdClose, MdPrecisionManufacturing,
    MdDateRange, MdSecurityUpdateGood, MdFileUpload, MdDelete
} from 'react-icons/md';

const AdminEquipment = () => {
    // State
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Dropdown Data
    const [clients, setClients] = useState([]);

    // Drawer/Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editDevice, setEditDevice] = useState(null); // null = add mode
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '', category: '', manufacturer: '', model: '',
        serialNumber: '', status: 'operational', clientId: '',
        installDate: '', warrantyExpiration: '', imageUrl: ''
    });

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchEquipment = async (page = 1, search = '', status = '', category = '') => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (status) params.status = status;
            if (category) params.category = category;

            const res = await equipmentAPI.getAll(params);
            setEquipment(res.data.data.equipment);
            setPagination(res.data.data.pagination);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch equipment:', err);
            setError('Failed to load equipment list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const cliRes = await clientsAPI.getAll();
                setClients(cliRes.data?.data?.clients || []);
            } catch (err) {
                console.error('Failed to load clients for dropdown', err);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEquipment(1, searchTerm, statusFilter, categoryFilter);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter, categoryFilter]);

    // Handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchEquipment(newPage, searchTerm, statusFilter, categoryFilter);
        }
    };

    const EMPTY_DEVICE = { name: '', category: '', manufacturer: '', model: '', serialNumber: '', status: 'operational', clientId: '', installDate: '', warrantyExpiration: '', imageUrl: '' };

    const openAddModal = () => { setEditDevice(null); setNewDevice(EMPTY_DEVICE); setIsAddModalOpen(true); };

    const openEditModal = (item) => {
        setEditDevice(item);
        setNewDevice({
            name: item.name || '', category: item.category || '', manufacturer: item.manufacturer || '',
            model: item.model || '', serialNumber: item.serialNumber || '', status: item.status || 'operational',
            clientId: item.clientId?._id || item.clientId || '',
            installDate: item.installDate ? item.installDate.substring(0, 10) : '',
            warrantyExpiration: item.warrantyExpiration ? item.warrantyExpiration.substring(0, 10) : '',
            imageUrl: item.imageUrl || ''
        });
        setOpenMenuId(null);
        setIsAddModalOpen(true);
    };

    const closeModal = () => { setIsAddModalOpen(false); setTimeout(() => { setEditDevice(null); setNewDevice(EMPTY_DEVICE); }, 300); };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading(editDevice ? 'Updating device...' : 'Adding equipment...');
        try {
            if (editDevice) {
                await equipmentAPI.update(editDevice._id, newDevice);
                toast.success('Device updated successfully!', { id: toastId });
            } else {
                await equipmentAPI.create(newDevice);
                toast.success('Equipment added successfully!', { id: toastId });
            }
            closeModal();
            fetchEquipment(1, searchTerm, statusFilter, categoryFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (item) => { setDeleteTarget(item); setOpenMenuId(null); setIsDeleteModalOpen(true); };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await equipmentAPI.delete(deleteTarget._id);
            toast.success(`"${deleteTarget.name}" removed successfully.`);
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            fetchEquipment(1, searchTerm, statusFilter, categoryFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewDevice({ ...newDevice, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // UI Helpers
    const getStatusIndicator = (status) => {
        const s = status?.toLowerCase();
        let bg = 'bg-slate-100 text-slate-600';
        let dot = 'bg-slate-400';

        if (s === 'operational') {
            bg = 'bg-green-50 text-green-700 border-green-200';
            dot = 'bg-green-500';
        } else if (s === 'under maintenance') {
            bg = 'bg-amber-50 text-amber-700 border-amber-200';
            dot = 'bg-amber-500';
        } else if (s === 'out of service') {
            bg = 'bg-red-50 text-red-700 border-red-200';
            dot = 'bg-red-500';
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${dot}`}></span>
                {status}
            </span>
        );
    };

    const getFallbackImage = (category) => {
        const c = category?.toLowerCase() || '';
        if (c.includes('mri')) return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=400&auto=format&fit=crop';
        if (c.includes('ct') || c.includes('scanner')) return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop';
        if (c.includes('x-ray')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=400&auto=format&fit=crop';
        return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=400&auto=format&fit=crop'; // Generic medical tech
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display">Equipment Inventory</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Manage and track all medical imaging devices</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20"
                >
                    <MdAdd className="text-xl" />
                    <span>Add Device</span>
                </button>
            </div>

            {/* Controls section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search by name, model, serial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <MdFilterList className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Categories</option>
                                <option value="MRI">MRI</option>
                                <option value="CT Scanner">CT Scanner</option>
                                <option value="X-ray">X-ray</option>
                                <option value="Ultrasound">Ultrasound</option>
                            </select>
                        </div>
                        <div className="relative">
                            <MdFilterList className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="operational">Operational</option>
                                <option value="under maintenance">Under Maint.</option>
                                <option value="out of service">Out of Service</option>
                            </select>
                        </div>
                    </div>
                </div>


            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                    <MdClose className="text-lg" /> {error}
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="relative min-h-[400px]">
                {loading && equipment.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#3B82F6] animate-spin"></div>
                        <p className="text-sm font-medium">Loading equipment repository...</p>
                    </div>
                ) : equipment.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                            <MdPrecisionManufacturing className="text-4xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Equipment Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">We couldn't find any medical imaging devices matching your current filters. Try relaxing your search criteria or adding a new device.</p>
                        <button
                            onClick={(e) => { setSearchTerm(''); setStatusFilter(''); setCategoryFilter(''); }}
                            className="mt-6 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    // GRID VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-[fadeIn_0.3s_ease-out]">
                        {equipment.map(item => (
                            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer" key={item._id}>
                                <div className="h-48 bg-slate-100 relative overflow-hidden border-b border-slate-100">
                                    <img src={item.imageUrl || getFallbackImage(item.category)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide text-slate-700 shadow-sm border border-white/20">
                                        {item.category}
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h3 className="font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                        <div className="relative inline-block outline-none" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenuId(null); }}>
                                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item._id + '-grid' ? null : item._id + '-grid'); }} className="p-1 -mt-1 -mr-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors shrink-0 focus:outline-none">
                                                <MdMoreVert className="text-lg" />
                                            </button>
                                            <div className={`absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-slate-100 transition-all z-20 flex flex-col overflow-hidden ${openMenuId === item._id + '-grid' ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-1 pointer-events-none'}`}>
                                                <button onClick={e => { e.stopPropagation(); openEditModal(item); }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Edit Device</button>
                                                <button onClick={e => { e.stopPropagation(); openDeleteModal(item); }} className="text-left w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-100">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono mb-4 text-ellipsis overflow-hidden">SN: {item.serialNumber}</p>

                                    <div className="space-y-2 mt-auto mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <MdPrecisionManufacturing className="text-slate-400 shrink-0" />
                                            <span className="truncate">{item.clientId?.orgName || <span className="italic text-slate-400">Unassigned</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <MdSecurityUpdateGood className="text-slate-400 shrink-0" />
                                            <span>Warranty: {item.warrantyExpiration ? new Date(item.warrantyExpiration).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        {getStatusIndicator(item.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && equipment.length > 0 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-medium text-slate-500">
                            Showing <span className="font-bold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-slate-800">{pagination.total}</span> results
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >Prev</button>
                            <span className="px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 rounded-xl">{pagination.page} / {pagination.pages}</span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><MdPrecisionManufacturing className="text-2xl" /></div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Device?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-1">You are about to permanently delete:</p>
                            <p className="font-bold text-slate-800 mb-0.5">{deleteTarget?.name}</p>
                            <p className="text-xs text-slate-400 mb-2">Serial: {deleteTarget?.serialNumber}</p>
                            <p className="text-xs text-red-500 font-semibold mb-6">This action cannot be undone.</p>
                            <div className="flex items-center gap-3 w-full">
                                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Delete Device'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD / EDIT EQUIPMENT MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 font-display">{editDevice ? 'Edit Device' : 'Add New Equipment'}</h2>
                            <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><MdClose className="text-xl" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto no-scrollbar">
                            <form id="add-equipment-form" onSubmit={handleAddSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Equipment Name <span className="text-red-500">*</span></label>
                                        <input required type="text" value={newDevice.name} onChange={e => setNewDevice({ ...newDevice, name: e.target.value })} placeholder="e.g. MAGNETOM Vida 3T MRI" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Category <span className="text-red-500">*</span></label>
                                        <select required value={newDevice.category} onChange={e => setNewDevice({ ...newDevice, category: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none">
                                            <option value="">Select Category...</option>
                                            <option value="MRI">MRI</option>
                                            <option value="CT Scanner">CT Scanner</option>
                                            <option value="X-ray">X-ray</option>
                                            <option value="Ultrasound">Ultrasound</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Manufacturer <span className="text-red-500">*</span></label>
                                        <input required type="text" value={newDevice.manufacturer} onChange={e => setNewDevice({ ...newDevice, manufacturer: e.target.value })} placeholder="e.g. Siemens Healthineers" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Model <span className="text-red-500">*</span></label>
                                        <input required type="text" value={newDevice.model} onChange={e => setNewDevice({ ...newDevice, model: e.target.value })} placeholder="e.g. Vida 3T" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700">Serial Number <span className="text-red-500">*</span></label>
                                        <input required type="text" value={newDevice.serialNumber} onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })} placeholder="e.g. SN-8493021" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono" />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Device Image <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        {newDevice.imageUrl ? (
                                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 group">
                                                <img src={newDevice.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <button type="button" onClick={() => setNewDevice({ ...newDevice, imageUrl: '' })} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500 text-white border border-white/20 rounded-lg font-semibold transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md">
                                                        <MdDelete className="text-lg" />
                                                        <span>Remove Image</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all flex flex-col items-center justify-center relative cursor-pointer group">
                                                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-110 group-hover:shadow-md transition-all mb-3 border border-slate-100">
                                                    <MdFileUpload className="text-2xl" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Click or drag image to upload</p>
                                                <p className="text-xs text-slate-500 mt-1 font-medium">PNG, JPG up to 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
                                        <label className="block text-sm font-bold text-slate-700">Client Assignment <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <select value={newDevice.clientId} onChange={e => setNewDevice({ ...newDevice, clientId: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none lg:max-w-md">
                                            <option value="">Leave Unassigned</option>
                                            {clients.map(c => <option key={c._id} value={c._id}>{c.orgName}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Installation Date <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input type="date" value={newDevice.installDate} onChange={e => setNewDevice({ ...newDevice, installDate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Warranty Expiry <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input type="date" value={newDevice.warrantyExpiration} onChange={e => setNewDevice({ ...newDevice, warrantyExpiration: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                            <button type="submit" form="add-equipment-form" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#3B82F6] hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 disabled:opacity-70">
                                {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{editDevice ? 'Saving...' : 'Saving...'}</> : (editDevice ? 'Save Changes' : 'Save Device')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEquipment;
