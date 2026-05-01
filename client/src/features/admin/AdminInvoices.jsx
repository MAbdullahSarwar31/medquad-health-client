import { useState, useEffect, useRef } from 'react';
import { invoicesAPI, clientsAPI, ticketsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
    HiOutlinePlus, HiOutlineRefresh, HiOutlineX, HiOutlinePrinter,
    HiOutlineDocumentText, HiOutlineClock, HiOutlineCheck,
    HiOutlineTrash, HiOutlineMail
} from 'react-icons/hi';
import { MdOutlineMoreHoriz } from 'react-icons/md';

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
            {/* Header */}
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

            {/* Bill To & Details */}
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

            {/* Line Items Table */}
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

            {/* Totals Block */}
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

            {/* Notes & Status */}
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

            {/* Footer */}
            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
                Please make checks payable to Medquad Health Solutions. Thank you for your business!
            </div>
        </div>
    );
};

// ─── Main AdminInvoices Component ───────────────────────────────────────────────
const AdminInvoices = () => {
    const printRef = useRef();
    const [invoices, setInvoices]     = useState([]);
    const [summary, setSummary]       = useState({});
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [printInvoice, setPrintInvoice] = useState(null);

    // Form lookups
    const [clients, setClients] = useState([]);
    const [tickets, setTickets] = useState([]);

    // Drawer state
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Create Invoice Form State
    const [formClient, setFormClient] = useState('');
    const [formTicket, setFormTicket] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formCurrency, setFormCurrency] = useState('PKR');
    const [formTax, setFormTax] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unitPrice: '' }]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await invoicesAPI.getAll(statusFilter ? { status: statusFilter } : {});
            setInvoices(res.data?.data?.invoices || []);
            setSummary(res.data?.data?.summary || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [cRes, tRes] = await Promise.all([
                clientsAPI.getAll({ limit: 100 }),
                ticketsAPI.getAll({ limit: 100 })
            ]);
            setClients(cRes.data?.data?.clients || []);
            setTickets(tRes.data?.data?.tickets || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchInvoices(); }, [statusFilter]);
    useEffect(() => { fetchLookups(); }, []);

    // Print logic
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

    // Status toggle logic
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await invoicesAPI.updateStatus(id, { status: newStatus });
            toast.success(`Invoice marked as ${newStatus}`);
            fetchInvoices();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    // Form Handlers
    const handleAddLine = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: '' }]);
    const handleRemoveLine = (idx) => setLineItems(lineItems.filter((_, i) => i !== idx));
    const handleLineChange = (idx, field, val) => {
        const newItems = [...lineItems];
        newItems[idx][field] = val;
        setLineItems(newItems);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formClient || !formDueDate) return toast.error('Client and Due Date are required.');
        const validItems = lineItems.filter(i => i.description.trim() && i.unitPrice);
        if (validItems.length === 0) return toast.error('Add at least one complete line item.');

        // Sanitize items
        const cleanItems = validItems.map(i => ({
            description: i.description,
            quantity: parseFloat(i.quantity) || 1,
            unitPrice: parseFloat(i.unitPrice),
            total: (parseFloat(i.quantity) || 1) * parseFloat(i.unitPrice)
        }));

        setSubmitting(true);
        try {
            await invoicesAPI.create({
                clientId: formClient,
                ticketId: formTicket || undefined,
                dueDate: formDueDate,
                currency: formCurrency,
                taxRate: parseFloat(formTax) || 0,
                notes: formNotes,
                items: cleanItems
            });
            toast.success('Invoice created successfully!');
            setShowForm(false);
            setFormClient(''); setFormTicket(''); setFormTax(''); setFormNotes(''); setLineItems([{ description: '', quantity: 1, unitPrice: '' }]);
            setFormDueDate('');
            fetchInvoices();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculations for preview
    const preSubtotal = lineItems.reduce((acc, curr) => acc + ((parseFloat(curr.quantity)||0) * (parseFloat(curr.unitPrice)||0)), 0);
    const preTax = preSubtotal * ((parseFloat(formTax)||0) / 100);
    const preTotal = preSubtotal + preTax;

    if (loading && invoices.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Loading invoices...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Billing & Invoices</h1>
                    <p className="text-slate-500 text-sm">Create and manage client invoices.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                    >
                        <HiOutlinePlus className="text-lg" /> Create Invoice
                    </button>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-slate-300">
                    <div className="text-2xl font-bold text-slate-700">{summary.draftCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Draft Invoices</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{summary.sentCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Awaiting Payment</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{summary.overdueCount ?? 0}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Overdue</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500">
                    <div className="text-lg font-bold text-amber-600">
                        PKR {(summary.totalOutstanding ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">Total Outstanding</div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-5 flex gap-2 overflow-x-auto">
                {['', 'draft', 'sent', 'paid', 'overdue'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize whitespace-nowrap transition-colors
                            ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {s || 'All Invoices'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-5 py-3 whitespace-nowrap">Invoice #</th>
                                <th className="px-5 py-3 whitespace-nowrap">Client</th>
                                <th className="px-5 py-3 whitespace-nowrap">Issue / Due Date</th>
                                <th className="px-5 py-3 whitespace-nowrap text-right">Total Amount</th>
                                <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                <th className="px-5 py-3 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                                        <HiOutlineDocumentText className="text-5xl mx-auto mb-3" />
                                        <p className="font-semibold">No invoices found</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{inv.invoiceNumber}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-sm text-slate-800">{inv.clientId?.orgName}</p>
                                            <p className="text-xs text-slate-500">{inv.clientId?.email}</p>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <p><span className="text-slate-400">Iss:</span> {new Date(inv.issueDate).toLocaleDateString()}</p>
                                            <p className={inv.status === 'overdue' ? 'text-red-600 font-semibold' : ''}><span className="text-slate-400">Due:</span> {new Date(inv.dueDate).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <p className="font-bold text-slate-800">{inv.currency} {Number(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={inv.status} /></td>
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handlePrint(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Print PDF">
                                                    <HiOutlinePrinter className="text-lg" />
                                                </button>
                                                
                                                {/* Dropdown for status actions could go here, for now inline buttons */}
                                                {inv.status === 'draft' && (
                                                    <button onClick={() => handleStatusUpdate(inv._id, 'sent')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Mark as Sent">
                                                        <HiOutlineMail className="text-lg" />
                                                    </button>
                                                )}
                                                {(inv.status === 'sent' || inv.status === 'overdue') && (
                                                    <button onClick={() => handleStatusUpdate(inv._id, 'paid')} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Mark as Paid">
                                                        <HiOutlineCheck className="text-lg" />
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

            {/* ── Create Invoice Drawer ──────────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Create New Invoice</h2>
                                <p className="text-sm text-slate-500">Draft a bill for a client</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                                <HiOutlineX className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Client <span className="text-red-500">*</span></label>
                                    <select required value={formClient} onChange={e => setFormClient(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select a Client...</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.orgName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Due Date <span className="text-red-500">*</span></label>
                                    <input type="date" required value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Currency</label>
                                    <select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                                        {['PKR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Link Ticket (Optional)</label>
                                    <select value={formTicket} onChange={e => setFormTicket(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
                                        <option value="">None</option>
                                        {tickets.map(t => <option key={t._id} value={t._id}>#{t.ticketNumber}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-700">Line Items</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {lineItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <div className="flex-1">
                                                <input type="text" placeholder="Description (e.g. Parts, Labor)" value={item.description} onChange={e => handleLineChange(idx, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500" required />
                                            </div>
                                            <div className="w-20">
                                                <input type="number" min="0.1" step="0.1" placeholder="Qty" value={item.quantity} onChange={e => handleLineChange(idx, 'quantity', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-center focus:ring-2 focus:ring-blue-500" required />
                                            </div>
                                            <div className="w-28">
                                                <input type="number" min="0" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-right focus:ring-2 focus:ring-blue-500" required />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveLine(idx)} disabled={lineItems.length === 1} className="mt-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30">
                                                <HiOutlineTrash className="text-xl" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddLine} className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1">
                                        <HiOutlinePlus /> Add Item
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Tax Rate (%)</label>
                                    <input type="number" min="0" max="100" step="0.1" placeholder="0" value={formTax} onChange={e => setFormTax(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                                    <div className="flex justify-between text-sm text-slate-600 mb-1"><span>Subtotal:</span><span>{preSubtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm text-slate-600 mb-2 border-b border-slate-200 pb-2"><span>Tax:</span><span>{preTax.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-lg font-bold text-slate-800"><span>Total:</span><span>{formCurrency} {preTotal.toFixed(2)}</span></div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Notes to Client</label>
                                <textarea rows={2} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Thank you for your business..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
                            </div>

                        </form>

                        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 whitespace-nowrap bg-white border border-slate-300 text-slate-700 rounded-md font-semibold hover:bg-slate-50">
                                Cancel
                            </button>
                            <button onClick={handleCreateSubmit} disabled={submitting} className="px-6 py-2 whitespace-nowrap bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">
                                {submitting ? 'Creating...' : 'Save as Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Receipt HTML */}
            <div ref={printRef} style={{ display: 'none' }}><PrintInvoice invoice={printInvoice} /></div>
        </div>
    );
};

export default AdminInvoices;
