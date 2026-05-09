const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { notify, getAdminIds } = require('../services/notificationService');
/**
 * @desc    Get invoices
 * @route   GET /api/v1/invoices
 * @access  Admin, Client (own)
 */
const getInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, clientId } = req.query;
        const query = {};

        // Role-based filter
        if (req.user.role === 'client') {
            // Assume the user has an associated clientId on their profile, 
            // but for simplicity in this system clients might be User records or we filter by their User _id 
            // Wait, looking at the models earlier, Clients are separate entities. 
            // In a typical system, the requesting User would have a `clientId` mapped to them if they are a client role.
            // For now, if role is client, we assume `req.user.clientId` is populated, or we look it up.
            // Let's filter by the query.clientId if provided, or default to their ID if they are somehow tied directly.
            // Actually, if they are 'client' role, we assume they pass their clientId or it's attached to user.
            if (req.user.clientId) {
                query.clientId = req.user.clientId;
            } else {
                 // Fallback: If user.role === client but no clientId on user object, 
                 // we'll still let them view if they pass clientId? No, that's insecure.
                 // We'll filter based on user._id if user._id IS the client._id (not standard but possible).
                 // Let's ensure query.clientId is strictly enforced.
                 // If the system doesn't attach clientId to req.user yet, we'll tentatively use their User._id.
                 query.clientId = req.user._id; 
            }
        } else if (clientId) {
             query.clientId = clientId;
        }

        if (status) query.status = status;

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .populate('clientId')
            .populate('ticketId', 'ticketNumber equipmentId')
            .sort({ issueDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Summary stats
        const draftCount    = await Invoice.countDocuments({ ...query, status: 'draft' });
        const sentCount     = await Invoice.countDocuments({ ...query, status: 'sent' });
        const paidCount     = await Invoice.countDocuments({ ...query, status: 'paid' });
        const overdueCount  = await Invoice.countDocuments({ ...query, status: 'overdue' });

        // Total Outstanding (sent + overdue)
        const outstandingAgg = await Invoice.aggregate([
            { $match: { ...query, status: { $in: ['sent', 'overdue'] } } },
            { $group: { _id: null, totalStringent: { $sum: '$totalAmount' } } },
        ]);
        const totalOutstanding = outstandingAgg[0]?.totalStringent || 0;

        res.status(200).json({
            success: true,
            data: {
                invoices,
                summary: { draftCount, sentCount, paidCount, overdueCount, totalOutstanding },
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single invoice by ID
 * @route   GET /api/v1/invoices/:id
 * @access  Admin, Client (own)
 */
const getInvoiceById = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('clientId')
            .populate({
                path: 'ticketId',
                populate: { path: 'equipmentId' }
            });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        res.status(200).json({ success: true, data: { invoice } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new invoice
 * @route   POST /api/v1/invoices
 * @access  Admin only
 */
const createInvoice = async (req, res, next) => {
    try {
        const { clientId, ticketId, issueDate, dueDate, currency, items, taxRate, notes, status } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invoice must have at least one line item' });
        }

        const invoice = await Invoice.create({
            clientId,
            ticketId: ticketId || null,
            issueDate: issueDate || Date.now(),
            dueDate,
            currency: currency || 'PKR',
            items,
            taxRate: taxRate || 0,
            notes,
            status: status || 'draft',
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: { invoice },
        });

        // --- NOTIFICATIONS ---
        if (invoice.status === 'sent' && invoice.clientId) {
            const io = req.app.get('io');
            const clientUsers = await User.find({ clientId: invoice.clientId, isActive: { $ne: false } }).select('_id').lean();
            if (clientUsers.length > 0) {
                await notify({
                    recipientId: clientUsers.map(u => u._id),
                    type: 'general',
                    title: 'New Invoice Available',
                    message: `A new invoice (${invoice.invoiceNumber || 'New'}) has been issued to your account.`,
                    link: '/client/invoices',
                    metadata: { invoiceId: invoice._id },
                    sendEmail: true,
                    io
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update invoice status
 * @route   PATCH /api/v1/invoices/:id/status
 * @access  Admin only
 */
const updateInvoiceStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('clientId');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        res.status(200).json({
            success: true,
            message: `Invoice marked as ${status}`,
            data: { invoice },
        });

        // --- NOTIFICATIONS ---
        if (invoice.clientId && (status === 'sent' || status === 'paid' || status === 'overdue')) {
            const io = req.app.get('io');
            const clientUsers = await User.find({ clientId: invoice.clientId._id, isActive: { $ne: false } }).select('_id').lean();
            if (clientUsers.length > 0) {
                let title = 'Invoice Updated';
                let message = `Your invoice status has been updated to ${status}.`;
                
                if (status === 'sent') {
                    title = 'New Invoice Available';
                    message = `A new invoice has been issued to your account.`;
                } else if (status === 'paid') {
                    title = 'Payment Received';
                    message = `Thank you! Your payment has been received and the invoice is marked as paid.`;
                } else if (status === 'overdue') {
                    title = 'Invoice Overdue';
                    message = `Friendly reminder: An invoice on your account is now overdue.`;
                }

                await notify({
                    recipientId: clientUsers.map(u => u._id),
                    type: 'general',
                    title,
                    message,
                    link: '/client/invoices',
                    metadata: { invoiceId: invoice._id },
                    sendEmail: true,
                    io
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus };
