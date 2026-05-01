import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI, equipmentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { HiOutlineTicket, HiOutlinePlus, HiOutlineSearch, HiX, HiOutlineSparkles, HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi';

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

    // Wizard state
    const [showForm, setShowForm] = useState(openNew);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ equipmentId: '', priority: 'medium', description: '' });
    
    // AI Analysis state
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

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

    const resetForm = () => {
        setForm({ equipmentId: '', priority: 'medium', description: '' });
        setStep(1);
        setAiAnalysis(null);
        setShowForm(false);
    };

    const handleNextStep = async () => {
        if (step === 1 && !form.equipmentId) {
            toast.error('Please select an equipment to service.');
            return;
        }
        if (step === 2) {
            if (!form.description || form.description.trim().length < 10) {
                toast.error('Please provide a detailed description (min 10 characters).');
                return;
            }
            
            // Trigger AI analysis in background as we move to step 3
            setAnalyzing(true);
            setStep(3);
            
            try {
                const res = await ticketsAPI.analyze({ description: form.description });
                const analysis = res.data.data.analysis;
                setAiAnalysis(analysis);
                
                if (analysis) {
                    // Pre-fill suggested priority
                    let suggestedPriority = 'medium';
                    if (analysis.priorityScore >= 4) suggestedPriority = 'critical';
                    else if (analysis.priorityScore === 3) suggestedPriority = 'high';
                    else if (analysis.priorityScore === 2) suggestedPriority = 'medium';
                    else suggestedPriority = 'low';
                    
                    setForm(prev => ({ ...prev, priority: suggestedPriority }));
                }
            } catch (err) {
                console.error("AI Analysis failed", err);
            } finally {
                setAnalyzing(false);
            }
            return;
        }
        setStep(s => s + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await ticketsAPI.create({ ...form, clientId: user?._id });
            toast.success('Service ticket submitted successfully!');
            resetForm();
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

    const selectedEquipmentObj = equipment.find(e => e._id === form.equipmentId);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Tickets</h1>
                    <p className="text-slate-500 text-sm">View and manage your service requests.</p>
                </div>
                {!showForm && (
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowForm(true)} className="btn btn-primary bg-[#E63946] hover:bg-red-700 border-none shadow-sm gap-2">
                            <HiOutlinePlus className="text-lg" /> New Request
                        </button>
                    </div>
                )}
            </div>

            {/* KPI cards */}
            {!showForm && (
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
            )}

            {/* Ticket Wizard */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8 animate-fade-in">
                    {/* Wizard Header / Progress */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">New Service Ticket</h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-200">
                            <HiX className="text-xl" />
                        </button>
                    </div>
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s ? 'bg-blue-600 text-white shadow-md' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {step > s ? <HiCheck /> : s}
                                </div>
                                <span className={`text-xs font-semibold hidden sm:inline-block ${step >= s ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {s === 1 ? 'Equipment' : s === 2 ? 'Details' : s === 3 ? 'AI Review' : 'Confirm'}
                                </span>
                                {s < 4 && <div className={`w-8 sm:w-12 h-1 rounded-full mx-1 ${step > s ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Step 1: Equipment Selection */}
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Select Equipment</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {equipment.map(e => (
                                        <div 
                                            key={e._id} 
                                            onClick={() => setForm(p => ({ ...p, equipmentId: e._id }))}
                                            className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${form.equipmentId === e._id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                    <span className="text-xs font-bold text-slate-500">{e.category?.substring(0,3)}</span>
                                                </div>
                                                <span className={`w-3 h-3 rounded-full ${e.status === 'operational' ? 'bg-emerald-500' : e.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            </div>
                                            <h4 className="font-bold text-slate-800">{e.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 font-mono">{e.serialNumber}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Describe the Problem */}
                        {step === 2 && (
                            <div className="animate-fade-in max-w-2xl mx-auto">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Describe the Problem</h3>
                                <p className="text-sm text-slate-500 mb-4">Please provide as much detail as possible. This helps our AI route your ticket to the correct specialist.</p>
                                
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="font-bold text-blue-700 text-sm">EQ</span>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Selected Equipment</div>
                                        <div className="font-bold text-slate-800">{selectedEquipmentObj?.name} <span className="font-normal text-slate-500">({selectedEquipmentObj?.model})</span></div>
                                    </div>
                                    <button onClick={() => setStep(1)} className="ml-auto text-sm text-blue-600 hover:underline font-medium">Change</button>
                                </div>

                                <textarea
                                    rows={6}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="E.g., The bore of our 3T MRI is making a loud clicking noise and the gradient shim is failing..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                                    required
                                />
                                <div className="text-right text-xs text-slate-400 mt-2">
                                    {form.description.length} / 500 characters
                                </div>
                            </div>
                        )}

                        {/* Step 3: AI Review */}
                        {step === 3 && (
                            <div className="animate-fade-in max-w-2xl mx-auto">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Review AI Suggestions</h3>
                                
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-indigo-50/50 rounded-xl border border-indigo-100 border-dashed">
                                        <HiOutlineSparkles className="text-4xl text-indigo-400 mb-4 animate-pulse" />
                                        <p className="font-semibold text-slate-700">MHS Assistant is analyzing your request...</p>
                                        <p className="text-sm text-slate-500 mt-1">Categorizing fault and estimating priority.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 relative overflow-hidden">
                                            <HiOutlineSparkles className="absolute top-4 right-4 text-4xl text-indigo-200" />
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs">AI</span>
                                                Analysis Complete
                                            </h4>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/60 rounded-lg p-3">
                                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Detected Category</div>
                                                    <div className="font-semibold text-indigo-900">{aiAnalysis?.category || 'General'}</div>
                                                </div>
                                                <div className="bg-white/60 rounded-lg p-3">
                                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Suggested Technician</div>
                                                    <div className="font-semibold text-indigo-900">{aiAnalysis?.suggestedSpecialty || 'Available Technician'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-6 border border-slate-200">
                                            <label className="block font-bold text-slate-800 mb-3">Set Priority</label>
                                            <p className="text-sm text-slate-500 mb-4">AI suggests <span className="font-bold">{form.priority}</span> priority based on your description. You can override this if needed.</p>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {['low', 'medium', 'high', 'critical'].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                                                        className={`p-3 rounded-lg border-2 text-center text-sm font-bold uppercase transition-colors ${form.priority === p ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-200'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Confirm & Submit */}
                        {step === 4 && (
                            <div className="animate-fade-in max-w-2xl mx-auto">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Confirm Request</h3>
                                
                                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
                                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                                        <div className="font-bold text-slate-800">Equipment</div>
                                        <button onClick={() => setStep(1)} className="text-xs font-bold text-blue-600 hover:underline">EDIT</button>
                                    </div>
                                    <div className="p-4 text-sm text-slate-700">
                                        {selectedEquipmentObj?.name} ({selectedEquipmentObj?.serialNumber})
                                    </div>

                                    <div className="flex items-center justify-between p-4 border-y border-slate-200 bg-white mt-2">
                                        <div className="font-bold text-slate-800">Description</div>
                                        <button onClick={() => setStep(2)} className="text-xs font-bold text-blue-600 hover:underline">EDIT</button>
                                    </div>
                                    <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap">
                                        {form.description}
                                    </div>

                                    <div className="flex items-center justify-between p-4 border-y border-slate-200 bg-white mt-2">
                                        <div className="font-bold text-slate-800">Priority</div>
                                        <button onClick={() => setStep(3)} className="text-xs font-bold text-blue-600 hover:underline">EDIT</button>
                                    </div>
                                    <div className="p-4">
                                        <PriorityBadge priority={form.priority} />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
                                    <HiCheck className="text-xl shrink-0 mt-0.5 text-blue-600" />
                                    <p>By submitting this ticket, a technician will be dispatched according to the assigned priority level SLA.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wizard Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <button
                            onClick={() => step > 1 ? setStep(s => s - 1) : resetForm()}
                            className="btn btn-ghost text-slate-500 font-medium flex items-center gap-2"
                        >
                            {step > 1 ? <><HiArrowLeft /> Back</> : 'Cancel'}
                        </button>
                        
                        {step < 4 ? (
                            <button
                                onClick={handleNextStep}
                                disabled={analyzing}
                                className="btn btn-primary gap-2 px-6"
                            >
                                Next <HiArrowRight />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="btn btn-primary gap-2 px-8 bg-emerald-600 hover:bg-emerald-700 border-none"
                            >
                                {submitting ? 'Submitting...' : <><HiCheck className="text-lg" /> Submit Ticket</>}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filters */}
            {!showForm && (
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
            )}

            {/* Tickets List */}
            {!showForm && (
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
            )}
        </div>
    );
};

export default ClientTickets;
