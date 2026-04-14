import { useState, useEffect } from 'react';
import { inventoryAPI } from '../../services/api';
import { HiOutlineCube, HiOutlineRefresh, HiOutlineSearch, HiOutlineExclamation } from 'react-icons/hi';
import { MdOutlineCategory, MdLocationOn } from 'react-icons/md';

const getCategoryColor = (cat) => {
    const map = {
        tubes: 'bg-blue-100 text-blue-700',
        coils: 'bg-purple-100 text-purple-700',
        sensors: 'bg-emerald-100 text-emerald-700',
        motors: 'bg-amber-100 text-amber-700',
        boards: 'bg-cyan-100 text-cyan-700',
        cables: 'bg-slate-100 text-slate-600',
        filters: 'bg-rose-100 text-rose-700',
        misc: 'bg-gray-100 text-gray-600',
    };
    return map[cat?.toLowerCase()] || map.misc;
};

const EmployeeInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [reorderFilter, setReorderFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1, limit: 20 });
    const [reorderCount, setReorderCount] = useState(0);

    const fetchItems = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (categoryFilter) params.category = categoryFilter;
            if (reorderFilter) params.needsReorder = reorderFilter;
            const res = await inventoryAPI.getAll(params);
            setItems(res.data?.data?.items || []);
            setReorderCount(res.data?.data?.reorderCount || 0);
            setPagination(res.data?.data?.pagination || { page: 1, total: 0, pages: 1, limit: 20 });
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(1); }, [search, categoryFilter, reorderFilter]);

    const totalItems = pagination.total;
    const inStockItems = items.filter(i => i.quantityOnHand > (i.reorderThreshold || 0)).length;
    const lowStockItems = items.filter(i => i.quantityOnHand > 0 && i.quantityOnHand <= (i.reorderThreshold || 0)).length;
    const outOfStock = items.filter(i => i.quantityOnHand === 0).length;

    const CATEGORIES = ['tubes', 'coils', 'sensors', 'motors', 'boards', 'cables', 'filters', 'misc'];

    if (loading && items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading inventory...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Inventory</h1>
                    <p className="text-slate-500 text-sm">View parts, components, and supplies.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Total Items</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
                    <div className="text-2xl font-bold text-emerald-600">{inStockItems}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">In Stock</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500">
                    <div className="text-2xl font-bold text-amber-600">{reorderCount}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Low / Reorder</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Out of Stock</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by part name, number, or supplier..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                </select>
                <select
                    value={reorderFilter}
                    onChange={e => setReorderFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Stock Levels</option>
                    <option value="true">Low Stock / Needs Reorder</option>
                </select>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Parts & Supplies</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{items.length} items on this page</p>
                    </div>
                    {reorderCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs font-bold">
                            <HiOutlineExclamation className="text-base" />
                            {reorderCount} item{reorderCount !== 1 ? 's' : ''} need reorder
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-4 py-3 whitespace-nowrap">Part Name</th>
                                <th className="px-4 py-3 whitespace-nowrap">Part No.</th>
                                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center">Qty</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center">Reorder At</th>
                                <th className="px-4 py-3 whitespace-nowrap">Unit Cost</th>
                                <th className="px-4 py-3 whitespace-nowrap">Supplier</th>
                                <th className="px-4 py-3 whitespace-nowrap">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                                        <HiOutlineCube className="text-5xl mx-auto mb-3" />
                                        <p className="font-semibold">No inventory items found</p>
                                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map(item => {
                                    const needsReorder = item.quantityOnHand <= (item.reorderThreshold || 0);
                                    const isOut = item.quantityOnHand === 0;
                                    return (
                                        <tr key={item._id} className={`hover:bg-slate-50 transition-colors ${needsReorder ? 'bg-amber-50/30' : ''}`}>

                                            {/* Part Name */}
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{item.partName}</p>
                                            </td>

                                            {/* Part Number */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {item.partNumber || '—'}
                                                </span>
                                            </td>

                                            {/* Category */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold capitalize ${getCategoryColor(item.category)}`}>
                                                    <MdOutlineCategory className="text-xs shrink-0" />
                                                    {item.category || 'misc'}
                                                </span>
                                            </td>

                                            {/* Qty on Hand — number + badge stacked */}
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className={`text-base font-bold leading-none ${isOut ? 'text-red-600' : needsReorder ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {item.quantityOnHand}
                                                </div>
                                                {isOut ? (
                                                    <span className="mt-1 inline-block text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">OUT</span>
                                                ) : needsReorder ? (
                                                    <span className="mt-1 inline-block text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">LOW</span>
                                                ) : null}
                                            </td>

                                            {/* Reorder Threshold */}
                                            <td className="px-4 py-3 text-center text-sm text-slate-600 whitespace-nowrap">
                                                {item.reorderThreshold ?? '—'}
                                            </td>

                                            {/* Unit Cost */}
                                            <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">
                                                {item.unitCost != null ? `$${item.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                            </td>

                                            {/* Supplier */}
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-[140px]">
                                                <p className="truncate">{item.supplier || '—'}</p>
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                                                    <MdLocationOn className="text-slate-400 shrink-0" />
                                                    {item.location || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>


                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                            Page {pagination.page} of {pagination.pages} · {pagination.total} total items
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchItems(pagination.page - 1)}
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => fetchItems(pagination.page + 1)}
                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeInventory;
