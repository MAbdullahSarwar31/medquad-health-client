const ExpenseClaim = require('../models/ExpenseClaim');
const { notify, getAdminIds } = require('../services/notificationService');

/**
 * @desc    Get expense claims
 * @route   GET /api/v1/expenses
 * @access  Private (Admin sees all, Employee sees own)
 */
const getExpenses = async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role === 'employee') {
            query.employeeId = req.user._id;
        }

        const claims = await ExpenseClaim.find(query)
            .populate('employeeId', 'name email')
            .populate('ticketId', 'ticketNumber')
            .populate('reviewedBy', 'name')
            .sort('-createdAt');

        const summary = {
            pendingCount: claims.filter(c => c.status === 'pending').length,
            approvedCount: claims.filter(c => c.status === 'approved').length,
            rejectedCount: claims.filter(c => c.status === 'rejected').length,
            totalApprovedPKR: claims.filter(c => c.status === 'approved').reduce((acc, c) => acc + (c.amountPKR || (c.amount * (c.exchangeRate || 1))), 0)
        };

        res.status(200).json({
            success: true,
            count: claims.length,
            data: { claims, summary },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single expense claim
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
const getExpenseById = async (req, res, next) => {
    try {
        const claim = await ExpenseClaim.findById(req.params.id)
            .populate('employeeId', 'name email')
            .populate('ticketId', 'ticketNumber')
            .populate('reviewedBy', 'name');

        if (!claim) {
            return res.status(404).json({ success: false, message: 'Expense claim not found' });
        }

        // Make sure employee only accesses their own claim
        if (req.user.role === 'employee' && claim.employeeId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, data: { claim } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Submit a new expense claim
 * @route   POST /api/v1/expenses
 * @access  Employee only
 */
const createExpense = async (req, res, next) => {
    try {
        const { type, description, amount, currency, exchangeRate, expenseDate, receiptNote, ticketId } = req.body;

        const claim = await ExpenseClaim.create({
            employeeId: req.user._id,
            type,
            description,
            amount,
            currency: currency || 'PKR',
            exchangeRate: exchangeRate || 1,
            expenseDate,
            receiptNote,
            ticketId: ticketId || null,
        });

        const populated = await claim.populate([
            { path: 'employeeId', select: 'name email' },
            { path: 'ticketId', select: 'ticketNumber' },
        ]);

        // --- NOTIFICATIONS ---
        const io = req.app.get('io');
        const adminIds = await getAdminIds();
        await notify({
            recipientId: adminIds,
            type: 'expense_submitted',
            title: 'New Expense Claim Submitted',
            message: `An employee has submitted a new expense claim of ${populated.amount} ${populated.currency} (${populated.type}). Please review.`,
            link: '/admin/expenses',
            buttonText: 'Review Claim',
            metadata: { expenseId: claim._id },
            sendEmail: true,
            io,
        });

        res.status(201).json({
            success: true,
            message: 'Expense claim submitted successfully',
            data: { claim: populated },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve or reject an expense claim
 * @route   PATCH /api/v1/expenses/:id/status
 * @access  Admin only
 */
const updateExpenseStatus = async (req, res, next) => {
    try {
        const { status, adminNote } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
        }

        const claim = await ExpenseClaim.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Expense claim not found' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending claims can be reviewed' });
        }

        claim.status = status;
        claim.adminNote = adminNote || '';
        claim.reviewedBy = req.user._id;
        claim.reviewedAt = new Date();
        await claim.save();

        const populated = await claim.populate([
            { path: 'employeeId', select: 'name email' },
            { path: 'reviewedBy', select: 'name' },
        ]);

        // --- NOTIFICATIONS ---
        const io = req.app.get('io');
        const isApproved = status === 'approved';
        await notify({
            recipientId: populated.employeeId._id,
            type: isApproved ? 'expense_approved' : 'expense_rejected',
            title: isApproved ? '🎉 Expense Claim Approved' : '❌ Expense Claim Rejected',
            message: isApproved
                ? `Your expense claim ${populated.claimNumber} for ${populated.amount?.toLocaleString()} ${populated.currency} has been approved.`
                : `Your expense claim ${populated.claimNumber} was rejected. Admin note: ${adminNote || 'No note provided.'}`,
            link: '/employee/expenses',
            buttonText: 'View My Claims',
            metadata: { expenseId: claim._id },
            sendEmail: true,
            io,
        });

        res.status(200).json({
            success: true,
            message: `Expense claim ${status}`,
            data: { claim: populated },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpenseStatus };
