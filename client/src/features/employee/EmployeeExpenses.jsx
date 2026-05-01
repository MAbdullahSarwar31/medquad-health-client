import { useState, useEffect, useRef } from 'react';
import { expensesAPI, ticketsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
    HiOutlinePlus, HiOutlineRefresh, HiOutlineX, HiOutlinePrinter,
    HiOutlineCurrencyDollar, HiOutlineDocumentText, HiOutlineCheck,
    HiOutlineExclamationCircle, HiOutlineClock
} from 'react-icons/hi';

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED'];
const TYPES = ['travel', 'tools', 'supplies', 'accommodation', 'meals', 'other'];

const DEFAULT_RATES = { PKR: 1, USD: 278, EUR: 302, GBP: 354, AED: 75.7 };

const EMPTY_FORM = {
    type: 'travel', description: '', amount: '', currency: 'PKR',
    exchangeRate: 1, expenseDate: new Date().toISOString().split('T')[0],
    receiptNote: '', ticketId: '',
};

// ─── Helper components ────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${map[status] || map.pending}`}>
            {status === 'approved' && <HiOutlineCheck className="text-xs" />}
            {status === 'rejected' && <HiOutlineX className="text-xs" />}
            {status === 'pending' && <HiOutlineClock className="text-xs" />}
            {status}
        </span>
    );
};

const TypeLabel = ({ type }) => {
    const colors = {
        travel: 'bg-blue-100 text-blue-700',
        tools: 'bg-purple-100 text-purple-700',
        supplies: 'bg-emerald-100 text-emerald-700',
        accommodation: 'bg-amber-100 text-amber-700',
        meals: 'bg-orange-100 text-orange-700',
        other: 'bg-slate-100 text-slate-600',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[type] || colors.other}`}>{type}</span>
    );
};

// ─── PDF Print Template ────────────────────────────────────────────────────────
const PrintReceipt = ({ claim, user }) => {
    if (!claim) return null;
    const amountFormatted = `${claim.currency} ${Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const amountPKR = `PKR ${Number(claim.amountPKR || claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const logoUrl = window.location.origin + '/logo.png';
    return (
        <div className="print-receipt" style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '720px', margin: '0 auto' }}>
            {/* Letterhead */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #E63946', paddingBottom: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={logoUrl} alt="Medquad Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
                    <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medical Equipment Services & Management</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '4px', lineHeight: '1.5' }}>Plot 207, Service Road East, I-10/3, Islamabad, Pakistan<br />info@medquadhealth.com<br />+92 322 5014415</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '1px' }}>EXPENSE RECEIPT</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#E63946', marginTop: '4px', fontWeight: 'bold' }}>#{claim.claimNumber}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                        Generated: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Employee & Claim Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Employee Details</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#222' }}>{claim.employeeId?.name || user?.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{claim.employeeId?.email || user?.email}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>Employee</div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Claim Details</div>
                    <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.8' }}>
                        <div><strong>Date of Expense:</strong> {new Date(claim.expenseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div><strong>Submitted:</strong> {new Date(claim.createdAt).toLocaleDateString()}</div>
                        {claim.ticketId && <div><strong>Ticket:</strong> {claim.ticketId?.ticketNumber}</div>}
                    </div>
                </div>
            </div>

            {/* Expense Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600' }}>PKR Equivalent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ background: '#f8fafc' }}>
                        <td style={{ padding: '12px 14px', textTransform: 'capitalize', verticalAlign: 'top' }}>{claim.type}</td>
                        <td style={{ padding: '12px 14px', color: '#333', verticalAlign: 'top' }}>{claim.description}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>{amountFormatted}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#555', verticalAlign: 'top' }}>{claim.currency !== 'PKR' ? amountPKR : '—'}</td>
                    </tr>
                    {claim.receiptNote && (
                        <tr>
                            <td colSpan="4" style={{ padding: '8px 14px', fontSize: '11px', color: '#888', fontStyle: 'italic', borderTop: '1px dashed #e2e8f0' }}>
                                Note: {claim.receiptNote}
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ borderTop: '2px solid #0f172a' }}>
                        <td colSpan="2" style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0f172a' }}>TOTAL</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{amountFormatted}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{claim.currency !== 'PKR' ? amountPKR : amountFormatted}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    {claim.status === 'approved' && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>Approved By</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#222' }}>{claim.reviewedBy?.name || 'Admin'}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : ''}</div>
                            {claim.adminNote && <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontStyle: 'italic' }}>"{claim.adminNote}"</div>}
                        </div>
                    )}
                </div>
                <div style={{
                    fontSize: '20px', fontWeight: 'bold', padding: '10px 24px',
                    border: `2px solid ${claim.status === 'approved' ? '#16a34a' : claim.status === 'rejected' ? '#dc2626' : '#d97706'}`,
                    color: claim.status === 'approved' ? '#16a34a' : claim.status === 'rejected' ? '#dc2626' : '#d97706',
                    borderRadius: '6px', letterSpacing: '2px', textTransform: 'uppercase',
                    transform: 'rotate(-5deg)', opacity: 0.8,
                }}>
                    {claim.status}
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
                This is a system-generated expense receipt from Medquad Health Solutions. Claim # {claim.claimNumber}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeExpenses = () => {
    const { user } = useAuth();
    const printRef = useRef();
    const [claims, setClaims] = useState([]);
    const [summary, setSummary] = useState({});
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [printClaim, setPrintClaim] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const res = await expensesAPI.getAll(statusFilter ? { status: statusFilter } : {});
            setClaims(res.data?.data?.claims || []);
            setSummary(res.data?.data?.summary || {});
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = async () => {
        try {
            const res = await ticketsAPI.getAll({ limit: 100 });
            setTickets(res.data?.data?.tickets || []);
        } catch { /* silent */ }
    };

    useEffect(() => { fetchClaims(); }, [statusFilter]);
    useEffect(() => { fetchTickets(); }, []);

    // Auto-fill exchange rate when currency changes
    const handleCurrencyChange = (currency) => {
        setForm(f => ({ ...f, currency, exchangeRate: DEFAULT_RATES[currency] || 1 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.description.trim() || !form.amount || !form.expenseDate) {
            toast.error('Please fill in all required fields.');
            return;
        }
        setSubmitting(true);
        try {
            await expensesAPI.create({
                ...form,
                amount: parseFloat(form.amount),
                exchangeRate: parseFloat(form.exchangeRate),
                ticketId: form.ticketId || undefined,
            });
            toast.success('Expense claim submitted!');
            setShowForm(false);
            setForm(EMPTY_FORM);
            fetchClaims();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit claim.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = (claim) => {
        setPrintClaim(claim);
        setTimeout(() => {
            const content = printRef.current?.innerHTML;
            if (!content) return;
            const w = window.open('', '_blank', 'width=800,height=900');
            w.document.write(`
                <html><head>
                <title>Expense Receipt — ${claim.claimNumber}</title>
                <style>
                    body { margin: 0; font-family: Arial, sans-serif; }
                    @page { margin: 20mm; }
                    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                </style>
                </head><body>${content}</body></html>
            `);
            w.document.close();
            w.focus();
            w.print();
        }, 100);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading expense claims...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Expenses</h1>
                    <p className="text-slate-500 text-sm">Submit and track your expense claims.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        <HiOutlinePlus className="text-lg" /> Submit Claim
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500">
                    <div className="text-2xl font-bold text-amber-600">{summary.pendingCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Pending</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-emerald-500">
                    <div className="text-2xl font-bold text-emerald-600">{summary.approvedCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Approved</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{summary.rejectedCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Rejected</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="text-lg font-bold text-blue-600">
                        PKR {(summary.totalApprovedPKR ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Total Approved</div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex gap-3 flex-wrap">
                {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors
                            ${statusFilter === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-800">Expense Claims</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{claims.length} claim{claims.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-4 py-3 whitespace-nowrap">Claim #</th>
                                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 whitespace-nowrap">Admin Note</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {claims.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                                        <HiOutlineDocumentText className="text-5xl mx-auto mb-3" />
                                        <p className="font-semibold">No expense claims yet</p>
                                        <p className="text-sm mt-1">Click "Submit Claim" to add your first expense.</p>
                                    </td>
                                </tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {claim.claimNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(claim.expenseDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <TypeLabel type={claim.type} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 max-w-[220px]">
                                            <p className="truncate">{claim.description}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <p className="font-bold text-sm text-slate-800">
                                                {claim.currency} {Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {claim.currency !== 'PKR' && (
                                                <p className="text-xs text-slate-400">
                                                    ≈ PKR {Number(claim.amountPKR).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <StatusBadge status={claim.status} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px]">
                                            <p className="truncate">{claim.adminNote || '—'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            {claim.status === 'approved' && (
                                                <button
                                                    onClick={() => handlePrint(claim)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors"
                                                >
                                                    <HiOutlinePrinter /> Print
                                                </button>
                                            )}
                                            {claim.status === 'pending' && (
                                                <span className="text-xs text-slate-400 italic">Awaiting review</span>
                                            )}
                                            {claim.status === 'rejected' && (
                                                <span className="text-xs text-red-500 font-medium">Rejected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Submit Claim Side Drawer ───────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Overlay */}
                    <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />

                    {/* Drawer panel */}
                    <div className="w-full max-w-md bg-white shadow-xl flex flex-col overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Submit Expense Claim</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <HiOutlineX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
                            {/* Type */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Expense Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                                    required
                                >
                                    {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Expense Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.expenseDate}
                                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Amount + Currency */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Amount & Currency <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            min="0.01"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <select
                                        value={form.currency}
                                        onChange={e => handleCurrencyChange(e.target.value)}
                                        className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                                    >
                                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                {form.currency !== 'PKR' && form.amount && (
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        ≈ PKR {(parseFloat(form.amount || 0) * parseFloat(form.exchangeRate || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        <span className="ml-1 text-slate-400">@ {form.exchangeRate} per {form.currency}</span>
                                    </p>
                                )}
                            </div>

                            {/* Exchange Rate (shown only for non-PKR) */}
                            {form.currency !== 'PKR' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                        Exchange Rate (1 {form.currency} = ? PKR)
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.exchangeRate}
                                        onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Pre-filled with approximate rate. Update if needed.</p>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the expense in detail..."
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    required
                                />
                            </div>

                            {/* Linked Ticket (optional) */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Linked Ticket (optional)
                                </label>
                                <select
                                    value={form.ticketId}
                                    onChange={e => setForm(f => ({ ...f, ticketId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None</option>
                                    {tickets.map(t => (
                                        <option key={t._id} value={t._id}>
                                            #{t.ticketNumber} — {t.equipmentId?.name || 'Equipment'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Receipt Note */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Receipt / Additional Note
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Receipt available on request"
                                    value={form.receiptNote}
                                    onChange={e => setForm(f => ({ ...f, receiptNote: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Claim'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-md font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden print receipt */}
            <div ref={printRef} style={{ display: 'none' }}>
                <PrintReceipt claim={printClaim} user={user} />
            </div>
        </div>
    );
};

export default EmployeeExpenses;
