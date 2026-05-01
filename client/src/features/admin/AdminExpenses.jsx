import { useState, useEffect, useRef } from 'react';
import { expensesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    HiOutlineRefresh, HiOutlineCheck, HiOutlineX,
    HiOutlinePrinter, HiOutlineDocumentText, HiOutlineClock
} from 'react-icons/hi';

// ─── Shared helpers ───────────────────────────────────────────────────────────
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
        travel: 'bg-blue-100 text-blue-700', tools: 'bg-purple-100 text-purple-700',
        supplies: 'bg-emerald-100 text-emerald-700', accommodation: 'bg-amber-100 text-amber-700',
        meals: 'bg-orange-100 text-orange-700', other: 'bg-slate-100 text-slate-600',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[type] || colors.other}`}>{type}</span>;
};

// ─── PDF Print Template (same design as employee side) ────────────────────────
const PrintReceipt = ({ claim }) => {
    if (!claim) return null;
    const amountFormatted = `${claim.currency} ${Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const amountPKR = `PKR ${Number(claim.amountPKR || claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const logoUrl = window.location.origin + '/logo.png';
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '720px', margin: '0 auto' }}>
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
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Employee</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#222' }}>{claim.employeeId?.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{claim.employeeId?.email}</div>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>PKR Equivalent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ background: '#f8fafc' }}>
                        <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>{claim.type}</td>
                        <td style={{ padding: '12px 14px' }}>{claim.description}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>{amountFormatted}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#555' }}>{claim.currency !== 'PKR' ? amountPKR : '—'}</td>
                    </tr>
                    {claim.receiptNote && (
                        <tr><td colSpan="4" style={{ padding: '8px 14px', fontSize: '11px', color: '#888', fontStyle: 'italic', borderTop: '1px dashed #e2e8f0' }}>Note: {claim.receiptNote}</td></tr>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    {claim.status === 'approved' && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>Approved By</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{claim.reviewedBy?.name || 'Admin'}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : ''}</div>
                            {claim.adminNote && <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>"{claim.adminNote}"</div>}
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', padding: '10px 24px', border: `2px solid ${claim.status === 'approved' ? '#16a34a' : '#dc2626'}`, color: claim.status === 'approved' ? '#16a34a' : '#dc2626', borderRadius: '6px', letterSpacing: '2px', textTransform: 'uppercase', transform: 'rotate(-5deg)', opacity: 0.8 }}>
                    {claim.status}
                </div>
            </div>
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
                This is a system-generated expense receipt from Medquad Health Solutions · Claim # {claim.claimNumber}
            </div>
        </div>
    );
};

// ─── Admin Review Modal ───────────────────────────────────────────────────────
const ReviewModal = ({ claim, onClose, onDone }) => {
    const [action, setAction] = useState('approved');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (action === 'rejected' && !note.trim()) {
            toast.error('A note is required when rejecting a claim.');
            return;
        }
        setLoading(true);
        try {
            await expensesAPI.updateStatus(claim._id, { status: action, adminNote: note });
            toast.success(`Claim ${action}!`);
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update claim.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <h2 className="font-bold text-slate-800">Review Expense Claim</h2>
                    <button onClick={onClose}><HiOutlineX className="text-xl text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-slate-50 rounded-md p-4 space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Employee</span><span className="font-semibold">{claim.employeeId?.name}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Type</span><TypeLabel type={claim.type} /></div>
                        <div className="flex justify-between"><span className="text-slate-500">Amount</span>
                            <span className="font-bold">{claim.currency} {Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                {claim.currency !== 'PKR' && <span className="text-slate-400 ml-1 text-xs">(≈ PKR {Number(claim.amountPKR).toLocaleString()})</span>}
                            </span>
                        </div>
                        <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{new Date(claim.expenseDate).toLocaleDateString()}</span></div>
                        <div className="pt-1 border-t border-slate-200"><span className="text-slate-500">Description: </span><span>{claim.description}</span></div>
                        {claim.receiptNote && <div><span className="text-slate-500">Note: </span><span className="italic">{claim.receiptNote}</span></div>}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Decision</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAction('approved')}
                                className={`flex-1 py-2 rounded-md font-semibold text-sm border transition-colors ${action === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >Approve</button>
                            <button
                                onClick={() => setAction('rejected')}
                                className={`flex-1 py-2 rounded-md font-semibold text-sm border transition-colors ${action === 'rejected' ? 'bg-red-600 text-white border-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >Reject</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                            Note {action === 'rejected' && <span className="text-red-500">*</span>}
                            {action === 'approved' && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                        </label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder={action === 'rejected' ? 'Reason for rejection (required)' : 'Optional approval note...'}
                            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>
                <div className="flex gap-3 px-5 pb-5">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-md font-semibold text-white transition-colors disabled:opacity-50
                            ${action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {loading ? 'Saving...' : action === 'approved' ? 'Confirm Approve' : 'Confirm Reject'}
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-md text-slate-600 font-semibold hover:bg-slate-50">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main AdminExpenses component ──────────────────────────────────────────────
const AdminExpenses = () => {
    const printRef = useRef();
    const [claims, setClaims] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [reviewTarget, setReviewTarget] = useState(null);
    const [printClaim, setPrintClaim] = useState(null);

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

    useEffect(() => { fetchClaims(); }, [statusFilter]);

    const handlePrint = (claim) => {
        setPrintClaim(claim);
        setTimeout(() => {
            const content = printRef.current?.innerHTML;
            if (!content) return;
            const w = window.open('', '_blank', 'width=800,height=900');
            w.document.write(`<html><head><title>Expense Receipt — ${claim.claimNumber}</title>
                <style>body{margin:0;font-family:Arial,sans-serif;}@page{margin:20mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}</style>
                </head><body>${content}</body></html>`);
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
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Expense Claims</h1>
                    <p className="text-slate-500 text-sm">Review and approve employee expense claims.</p>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500">
                    <div className="text-2xl font-bold text-amber-600">{summary.pendingCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Pending Review</div>
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
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Total Paid Out</div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex gap-3 flex-wrap">
                {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors
                            ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {s || 'All'}
                        {s === 'pending' && (summary.pendingCount ?? 0) > 0 && (
                            <span className="ml-1.5 bg-amber-200 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {summary.pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-800">All Claims</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{claims.length} claim{claims.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-4 py-3 whitespace-nowrap">Claim #</th>
                                <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                <th className="px-4 py-3 whitespace-nowrap">Type</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 whitespace-nowrap text-right">Amount</th>
                                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 whitespace-nowrap text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {claims.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                                        <HiOutlineDocumentText className="text-5xl mx-auto mb-3" />
                                        <p className="font-semibold">No expense claims found</p>
                                    </td>
                                </tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim._id} className={`hover:bg-slate-50 transition-colors ${claim.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{claim.claimNumber}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="font-semibold text-slate-800 text-sm">{claim.employeeId?.name}</p>
                                            <p className="text-xs text-slate-400">{claim.employeeId?.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(claim.expenseDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap"><TypeLabel type={claim.type} /></td>
                                        <td className="px-4 py-3 text-sm text-slate-700 max-w-[200px]">
                                            <p className="truncate">{claim.description}</p>
                                            {claim.adminNote && <p className="text-xs text-slate-400 italic truncate">{claim.adminNote}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <p className="font-bold text-sm text-slate-800">
                                                {claim.currency} {Number(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {claim.currency !== 'PKR' && (
                                                <p className="text-xs text-slate-400">≈ PKR {Number(claim.amountPKR).toLocaleString()}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={claim.status} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                {claim.status === 'pending' && (
                                                    <button
                                                        onClick={() => setReviewTarget(claim)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                {(claim.status === 'approved' || claim.status === 'rejected') && (
                                                    <button
                                                        onClick={() => handlePrint(claim)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors"
                                                    >
                                                        <HiOutlinePrinter className="text-sm" /> Print
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {reviewTarget && (
                <ReviewModal
                    claim={reviewTarget}
                    onClose={() => setReviewTarget(null)}
                    onDone={() => { setReviewTarget(null); fetchClaims(); }}
                />
            )}

            {/* Hidden print ref */}
            <div ref={printRef} style={{ display: 'none' }}>
                <PrintReceipt claim={printClaim} />
            </div>
        </div>
    );
};

export default AdminExpenses;
