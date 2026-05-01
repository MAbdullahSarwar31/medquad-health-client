import { useState, useEffect, useRef } from 'react';
import { invoicesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    HiOutlineRefresh, HiOutlinePrinter, 
    HiOutlineDocumentText, HiOutlineClock,
    HiOutlineCheck, HiOutlineExclamationCircle
} from 'react-icons/hi';

// ─── Shared Helpers ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        draft: 'bg-slate-100 text-slate-700',
        sent: 'bg-blue-100 text-blue-700',
        paid: 'bg-emerald-100 text-emerald-700',
        overdue: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-500 line-through',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${map[status]}`}>
            {status}
        </span>
    );
};

// ─── PDF Print Template ──────────────────────────────────────────────────────
const PrintInvoice = ({ invoice }) => {
    if (!invoice) return null;
    const formatMoney = (amount) => `${invoice.currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const logoUrl = window.location.origin + '/logo.png';

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '720px', margin: '0 auto', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #E63946', paddingBottom: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={logoUrl} alt="Medquad Logo" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
                    <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medical Equipment Services & Management</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '4px', lineHeight: '1.5' }}>Plot 207, Service Road East, I-10/3, Islamabad, Pakistan<br />info@medquadhealth.com<br />+92 322 5014415</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '2px' }}>INVOICE</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 'bold', color: '#E63946', marginTop: '8px' }}>#{invoice.invoiceNumber}</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '36px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bill To:</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#222' }}>{invoice.clientId?.orgName}</div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Attn: {invoice.clientId?.contactPerson || 'Management'}</div>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '2px' }}>{invoice.clientId?.email}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <table style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px 0', color: '#666', fontWeight: 'bold' }}>Issue Date:</td>
                                <td style={{ padding: '4px 0', textAlign: 'right' }}>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px 0', color: '#666', fontWeight: 'bold' }}>Due Date:</td>
                                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold', color: invoice.status === 'overdue' ? '#dc2626' : 'inherit' }}>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </td>
                            </tr>
                            {invoice.ticketId && (
                                <tr>
                                    <td style={{ padding: '4px 0', color: '#666', fontWeight: 'bold' }}>Ref Ticket:</td>
                                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{invoice.ticketId.ticketNumber}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '600', width: '50%' }}>Description</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600' }}>Qty</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '600' }}>Unit Price</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '600' }}>Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                            <td style={{ padding: '14px', color: '#333' }}>{item.description}</td>
                            <td style={{ padding: '14px', textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                            <td style={{ padding: '14px', textAlign: 'right', color: '#555' }}>{formatMoney(item.unitPrice)}</td>
                            <td style={{ padding: '14px', textAlign: 'right', fontWeight: 'bold', color: '#222' }}>{formatMoney(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', color: '#555', fontSize: '14px' }}>
                        <span>Subtotal:</span>
                        <span>{formatMoney(invoice.subtotal)}</span>
                    </div>
                    {invoice.taxRate > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', color: '#555', fontSize: '14px' }}>
                            <span>Tax ({invoice.taxRate}%):</span>
                            <span>{formatMoney(invoice.taxAmount)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 'bold', fontSize: '18px', color: '#0f172a', marginTop: '8px' }}>
                        <span>Total Due:</span>
                        <span>{formatMoney(invoice.totalAmount)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, paddingRight: '40px' }}>
                    {invoice.notes && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
                            <div style={{ fontSize: '13px', color: '#555', fontStyle: 'italic', background: '#f8fafc', padding: '12px', borderLeft: '3px solid #cbd5e1' }}>
                                {invoice.notes}
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    {(invoice.status === 'paid' || invoice.status === 'overdue' || invoice.status === 'sent') && (
                        <div style={{
                            fontSize: '28px', fontWeight: 'bold', padding: '12px 32px',
                            border: `3px solid ${invoice.status === 'paid' ? '#16a34a' : invoice.status === 'overdue' ? '#dc2626' : '#2563eb'}`,
                            color: invoice.status === 'paid' ? '#16a34a' : invoice.status === 'overdue' ? '#dc2626' : '#2563eb',
                            borderRadius: '8px', letterSpacing: '4px', textTransform: 'uppercase',
                            transform: 'rotate(-5deg)', opacity: 0.9, textAlign: 'center'
                        }}>
                            {invoice.status}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                Please make checks payable to Medquad Health Solutions. Thank you for your business!
            </div>
        </div>
    );
};

// ─── Main ClientInvoices Component ──────────────────────────────────────────────
const ClientInvoices = () => {
    const printRef = useRef();
    const [invoices, setInvoices]     = useState([]);
    const [summary, setSummary]       = useState({});
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [printInvoice, setPrintInvoice] = useState(null);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            // "client" role only receives their own invoices (server-side enforced)
            const res = await invoicesAPI.getAll(statusFilter ? { status: statusFilter } : {});
            // Do not display "draft" invoices to clients
            const cleanInvoices = (res.data?.data?.invoices || []).filter(i => i.status !== 'draft');
            setInvoices(cleanInvoices);
            setSummary(res.data?.data?.summary || {});
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, [statusFilter]);

    const handlePrint = (inv) => {
        setPrintInvoice(inv);
        setTimeout(() => {
            const content = printRef.current?.innerHTML;
            if (!content) return;
            const w = window.open('', '_blank', 'width=800,height=900');
            w.document.write(`<html><head><title>Invoice ${inv.invoiceNumber}</title></head><body>${content}</body></html>`);
            w.document.close();
            w.focus();
            w.print();
        }, 100);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading your invoices...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">My Bills & Invoices</h1>
                    <p className="text-slate-500 text-sm">View and download your billing history.</p>
                </div>
                </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex gap-2 overflow-x-auto">
                {['', 'sent', 'paid', 'overdue'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize whitespace-nowrap transition-colors
                            ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {s === 'sent' ? 'Unpaid' : s || 'All Invoices'}
                    </button>
                ))}
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center text-slate-400">
                        <HiOutlineDocumentText className="text-5xl mx-auto mb-3" />
                        <p className="font-semibold">No invoices found</p>
                        <p className="text-sm mt-1">You do not have any {statusFilter} invoices at this time.</p>
                    </div>
                ) : (
                    invoices.map((inv) => (
                        <div key={inv._id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row gap-5 items-center justify-between transition-shadow hover:shadow-md">
                            
                            {/* Icon & Details */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                                    ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : inv.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {inv.status === 'paid' ? <HiOutlineCheck className="text-2xl" /> : inv.status === 'overdue' ? <HiOutlineExclamationCircle className="text-2xl" /> : <HiOutlineClock className="text-2xl" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800">Invoice {inv.invoiceNumber}</h3>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                        <span><strong className="text-slate-600">Issued:</strong> {new Date(inv.issueDate).toLocaleDateString()}</span>
                                        <span className={inv.status === 'overdue' ? 'text-red-500 font-medium' : ''}><strong className="text-slate-600">Due:</strong> {new Date(inv.dueDate).toLocaleDateString()}</span>
                                        {inv.ticketId && <span><strong className="text-slate-600">Ref:</strong> Ticket #{inv.ticketId.ticketNumber}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-semibold uppercase mb-0.5">Total Amount</p>
                                    <p className="text-xl font-bold text-slate-800">{inv.currency} {Number(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <button
                                    onClick={() => handlePrint(inv)}
                                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-md font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0"
                                >
                                    <HiOutlinePrinter className="text-xl" /> <span className="hidden sm:inline">Print PDF</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Hidden Print Receipt HTML */}
            <div ref={printRef} style={{ display: 'none' }}><PrintInvoice invoice={printInvoice} /></div>
        </div>
    );
};

export default ClientInvoices;
