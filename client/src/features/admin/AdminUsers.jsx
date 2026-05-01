import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    MdSearch, MdFilterList, MdAdd, MdMoreVert, MdClose,
    MdPerson, MdVpnKey, MdOutlineAdminPanelSettings,
    MdEngineering, MdBusiness
} from 'react-icons/md';

const EMPTY_USER = { name: '', email: '', password: '', role: 'employee', phone: '', isActive: true };

const AdminUsers = () => {
    // Data state
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState(EMPTY_USER);

    // Action menu
    const [openMenuId, setOpenMenuId] = useState(null);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Fetch ───────────────────────────────────────────────────────────
    const fetchUsers = async (page = 1, search = '', role = '') => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (role) params.role = role;
            const res = await usersAPI.getAll(params);
            setUsers(res.data?.data?.users || []);
            setPagination(res.data?.data?.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
            setError(null);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load user directory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => fetchUsers(1, searchTerm, roleFilter), 500);
        return () => clearTimeout(t);
    }, [searchTerm, roleFilter]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) fetchUsers(newPage, searchTerm, roleFilter);
    };

    // ─── Drawer ──────────────────────────────────────────────────────────
    const openAddDrawer = () => {
        setEditUser(null);
        setForm(EMPTY_USER);
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (user) => {
        setEditUser(user);
        setForm({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'employee', phone: user.phone || '', isActive: user.isActive !== false });
        setOpenMenuId(null);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => { setEditUser(null); setForm(EMPTY_USER); }, 300);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading(editUser ? 'Updating user...' : 'Registering new user account...');
        try {
            if (editUser) {
                const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone, isActive: form.isActive };
                await usersAPI.update(editUser._id, payload);
                toast.success('User updated successfully!', { id: toastId });
            } else {
                await usersAPI.create(form);
                toast.success('User account registered successfully!', { id: toastId });
            }
            closeDrawer();
            fetchUsers(1, searchTerm, roleFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Delete ──────────────────────────────────────────────────────────
    const openDeleteModal = (user) => {
        setDeleteTarget(user);
        setOpenMenuId(null);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await usersAPI.delete(deleteTarget._id);
            toast.success(`User "${deleteTarget.name}" deleted.`);
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
            fetchUsers(1, searchTerm, roleFilter);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        } finally {
            setIsDeleting(false);
        }
    };

    // ─── UI Helpers ──────────────────────────────────────────────────────
    const getRoleBadge = (role) => {
        const r = role?.toLowerCase();
        if (r === 'admin') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200"><MdOutlineAdminPanelSettings className="text-sm" /> Admin</span>;
        if (r === 'employee') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200"><MdEngineering className="text-sm" /> Employee</span>;
        if (r === 'client') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200"><MdBusiness className="text-sm" /> Client</span>;
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-200">{role}</span>;
    };

    const getStatusBadge = (isActive) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {isActive ? 'Active' : 'Suspended'}
        </span>
    );

    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">User Management</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage system access, roles, and employee accounts</p>
                </div>
                <button onClick={openAddDrawer} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20">
                    <MdAdd className="text-xl" /><span>Add User</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <MdFilterList className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full sm:w-auto pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                            <option value="">All Roles</option>
                            <option value="admin">Administrators</option>
                            <option value="employee">Employee</option>
                            <option value="client">Clients</option>
                        </select>
                    </div>
                </div>
                <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">{loading ? 'Loading...' : `${pagination.total} user${pagination.total !== 1 ? 's' : ''}`}</span>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                    <MdClose className="text-lg" /> {error}
                </div>
            )}

            {/* Table */}
            <div className="relative min-h-[400px]">
                {loading && users.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#3B82F6] animate-spin"></div>
                        <p className="text-sm font-medium">Loading user directory...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><MdPerson className="text-5xl" /></div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Users Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">No user accounts match your current filters.</p>
                        <button onClick={() => { setSearchTerm(''); setRoleFilter(''); }} className="mt-6 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">Clear all filters</button>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                        <th className="px-6 py-4">User Profile</th>
                                        <th className="px-6 py-4">System Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined / Last Login</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(user => (
                                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                                        {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-bold text-lg">{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</span>}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{user?.name || 'Unknown User'}</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">{user?.email || 'No email'}</div>
                                                        {user?.phone && <div className="text-xs text-slate-400 mt-0.5">{user.phone}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getRoleBadge(user?.role)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(user?.isActive)}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                                                <div className="text-xs text-slate-400 font-medium mt-0.5">{user?.lastLogin ? `Active ${new Date(user.lastLogin).toLocaleDateString()}` : 'Never logged in'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-block outline-none" tabIndex={-1} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpenMenuId(null); }}>
                                                    <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === user._id ? null : user._id); }} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors focus:outline-none">
                                                        <MdMoreVert className="text-xl" />
                                                    </button>
                                                    <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-slate-100 transition-all z-20 flex flex-col overflow-hidden ${openMenuId === user._id ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible translate-x-1 pointer-events-none'}`}>
                                                        <button onClick={e => { e.stopPropagation(); openEditDrawer(user); }} className="flex items-center gap-2 text-left w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Edit User</button>
                                                        <button onClick={e => { e.stopPropagation(); openDeleteModal(user); }} className="flex items-center gap-2 text-left w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-slate-100">Delete</button>
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
                {!loading && users.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-sm font-medium text-slate-500">
                            Showing <span className="font-bold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-bold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-slate-800">{pagination.total}</span> users
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
            <div className={`fixed top-[64px] right-0 h-[calc(100vh-64px)] w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 font-display">{editUser ? 'Edit User' : 'Register New User'}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">{editUser ? `Editing: ${editUser.name}` : 'Create an account and assign roles.'}</p>
                    </div>
                    <button onClick={closeDrawer} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><MdClose className="text-xl" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><MdPerson className="text-blue-500 text-lg" /> Profile Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                    <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@medquad.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">Phone Number</label>
                                    <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92-321-0000000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><MdVpnKey className="text-emerald-500 text-lg" /> Authentication</h3>
                            <div className="space-y-4">
                                {!editUser && (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">Temporary Password <span className="text-red-500">*</span></label>
                                        <input required={!editUser} type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" minLength="8" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                        <p className="text-xs text-slate-500">User should change this after first login.</p>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">System Role <span className="text-red-500">*</span></label>
                                    <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                                        <option value="employee">Employee</option>
                                        <option value="admin">System Administrator</option>
                                        <option value="client">Client User</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">Account is Active</span>
                                        <span className="text-xs text-slate-500">Allow this user to log in immediately.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="h-4"></div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                    <button disabled={isSubmitting} type="button" onClick={closeDrawer} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50">Cancel</button>
                    <button disabled={isSubmitting} type="submit" form="user-form" className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[#3B82F6] hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSubmitting ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>{editUser ? 'Saving...' : 'Registering...'}</> : (editUser ? 'Save Changes' : 'Create User')}
                    </button>
                </div>
            </div>

            {/* ════ DELETE MODAL ════ */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><MdPerson className="text-3xl" /></div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete User?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-1">You are about to permanently delete:</p>
                            <p className="font-bold text-slate-800 mb-0.5">{deleteTarget?.name}</p>
                            <p className="text-xs text-slate-400 mb-6">{deleteTarget?.email}</p>
                            <p className="text-xs text-red-500 font-semibold mb-6">This action cannot be undone.</p>
                            <div className="flex items-center gap-3 w-full">
                                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Delete User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;