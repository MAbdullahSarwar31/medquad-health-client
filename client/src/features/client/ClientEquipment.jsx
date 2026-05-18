import { useState, useEffect } from 'react';
import { equipmentAPI, equipmentRequestsAPI } from '../../services/api';
import { HiOutlineDesktopComputer, HiOutlineRefresh, HiOutlineSearch, HiPlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

const getStatusObj = (status) => {
    if (status === 'operational') return { label: 'Operational', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
    if (status === 'under maintenance') return { label: 'Maintenance', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' };
    return { label: 'Out of Service', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
};

const ClientEquipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ requestType: 'add', name: '', category: '', manufacturer: '', model: '', serialNumber: '', equipmentId: '', clientNotes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const res = await equipmentAPI.getAll({ limit: 100 });
            setEquipment(res.data?.data?.equipment || []);
        } catch (err) {
            console.error('Failed to fetch equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEquipment(); }, []);

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await equipmentRequestsAPI.create({
                requestType: requestForm.requestType,
                equipmentDetails: requestForm.requestType === 'add' ? requestForm : undefined,
                equipmentId: requestForm.requestType === 'remove' ? requestForm.equipmentId : undefined,
                clientNotes: requestForm.clientNotes
            });
            toast.success(`Equipment ${requestForm.requestType} request submitted successfully.`);
            setIsRequestModalOpen(false);
            setRequestForm({ requestType: 'add', name: '', category: '', manufacturer: '', model: '', serialNumber: '', equipmentId: '', clientNotes: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = equipment.filter(e => {
        const matchSearch = !search
            || e.name?.toLowerCase().includes(search.toLowerCase())
            || e.serialNumber?.toLowerCase().includes(search.toLowerCase())
            || e.model?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalEquipment = equipment.length;
    const operationalCount = equipment.filter(e => e.status === 'operational').length;
    const maintenanceCount = equipment.filter(e => e.status === 'under maintenance').length;
    const outOfServiceCount = equipment.filter(e => e.status === 'out of service').length;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading equipment...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Equipment</h1>
                    <p className="text-slate-500 text-sm">All medical devices registered to your organization.</p>
                </div>
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20"
                >
                    <HiPlus className="text-xl" />
                    <span>Request Update</span>
                </button>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Devices', value: totalEquipment, border: 'border-blue-500', color: 'text-blue-600' },
                    { label: 'Operational', value: operationalCount, border: 'border-emerald-500', color: 'text-emerald-600' },
                    { label: 'Maintenance', value: maintenanceCount, border: 'border-amber-500', color: 'text-amber-600' },
                    { label: 'Out of Service', value: outOfServiceCount, border: 'border-red-500', color: 'text-red-600' },
                ].map(card => (
                    <div key={card.label} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${card.border}`}>
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, model, serial..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="operational">Operational</option>
                    <option value="under maintenance">Under Maintenance</option>
                    <option value="out of service">Out of Service</option>
                </select>
            </div>

            {/* Equipment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-3 bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                        <HiOutlineDesktopComputer className="text-5xl mx-auto mb-3" />
                        <p className="font-semibold">No equipment found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    filtered.map(item => {
                        const statusObj = getStatusObj(item.status);
                        const isExpired = item.warrantyExpiration && new Date(item.warrantyExpiration) < new Date();
                        const expiresIn = item.warrantyExpiration
                            ? Math.ceil((new Date(item.warrantyExpiration) - new Date()) / (1000 * 60 * 60 * 24))
                            : null;
                        const isOpen = selectedItem?._id === item._id;

                        return (
                            <div
                                key={item._id}
                                onClick={() => setSelectedItem(isOpen ? null : item)}
                                className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer select-none
                                    ${isOpen ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}
                            >
                                {/* Colored top accent bar */}
                                <div className={`h-1 rounded-t-lg ${statusObj.dot}`} />

                                <div className="p-4">
                                    {/* Device name row */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${statusObj.cls}`}>
                                            <HiOutlineDesktopComputer className="text-lg" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm leading-snug truncate">{item.name}</p>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{item.model}</p>
                                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase ${statusObj.cls}`}>
                                                {statusObj.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Key-value detail rows */}
                                    <div className="border-t border-slate-100 pt-3 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium w-20 shrink-0">Category</span>
                                            <span className="font-semibold text-slate-700 text-right">{item.category || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium w-20 shrink-0">Serial No.</span>
                                            <span className="font-mono font-semibold text-slate-700 text-right">{item.serialNumber}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-medium w-20 shrink-0">Warranty</span>
                                            {item.warrantyExpiration ? (
                                                <span className={`font-semibold text-right ${isExpired ? 'text-red-600' : expiresIn !== null && expiresIn < 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {isExpired
                                                        ? 'Expired'
                                                        : expiresIn !== null && expiresIn < 90
                                                            ? `${expiresIn}d left`
                                                            : new Date(item.warrantyExpiration).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-semibold text-right">N/A</span>
                                            )}
                                        </div>

                                        {/* Expanded extra fields */}
                                        {isOpen && (
                                            <>
                                                {item.location && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 font-medium w-20 shrink-0">Location</span>
                                                        <span className="font-semibold text-slate-700 text-right">{item.location}</span>
                                                    </div>
                                                )}
                                                {item.manufacturer && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 font-medium w-20 shrink-0">Manufacturer</span>
                                                        <span className="font-semibold text-slate-700 text-right">{item.manufacturer}</span>
                                                    </div>
                                                )}
                                                {item.installationDate && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 font-medium w-20 shrink-0">Installed</span>
                                                        <span className="font-semibold text-slate-700 text-right">{new Date(item.installationDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {item.warrantyExpiration && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 font-medium w-20 shrink-0">Expiry Date</span>
                                                        <span className={`font-semibold text-right ${isExpired ? 'text-red-600' : 'text-slate-700'}`}>
                                                            {new Date(item.warrantyExpiration).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Expand/collapse hint */}
                                    <p className="text-xs text-slate-300 mt-3 text-center">
                                        {isOpen ? 'Click to collapse ▲' : 'Click for details ▼'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {filtered.length > 0 && (
                <p className="text-xs text-slate-400 mt-4 text-center">
                    Showing {filtered.length} of {totalEquipment} devices
                </p>
            )}

            {/* Request Equipment Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">Request Equipment Change</h2>
                            <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Request Type</label>
                                <select value={requestForm.requestType} onChange={e => setRequestForm({...requestForm, requestType: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="add">Add New Equipment</option>
                                    <option value="remove">Remove Equipment</option>
                                </select>
                            </div>

                            {requestForm.requestType === 'add' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Name / Model <span className="text-red-500">*</span></label>
                                        <input required type="text" placeholder="e.g. GE Optima CT" value={requestForm.name} onChange={e => setRequestForm({...requestForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Manufacturer</label>
                                            <input type="text" value={requestForm.manufacturer} onChange={e => setRequestForm({...requestForm, manufacturer: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                            <input type="text" value={requestForm.category} onChange={e => setRequestForm({...requestForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Select Equipment <span className="text-red-500">*</span></label>
                                    <select required value={requestForm.equipmentId} onChange={e => setRequestForm({...requestForm, equipmentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Select...</option>
                                        {equipment.map(eq => <option key={eq._id} value={eq._id}>{eq.name} ({eq.serialNumber})</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Additional Notes</label>
                                <textarea placeholder="Reason for request, exact specs, etc." value={requestForm.clientNotes} onChange={e => setRequestForm({...requestForm, clientNotes: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-70 transition-colors shadow-md shadow-blue-500/20">
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientEquipment;
