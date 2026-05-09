const { notify, getAdminIds } = require('../services/notificationService');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * @desc    Get expense claims
 * @route   GET /api/v1/expenses
 * @access  Admin: all claims | Employee: own claims only
 */
const getExpenses = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, type, employeeId } = req.query;
        const query = {};

        // Role-based filter
        if (req.user.role === 'employee') {
            query.employeeId = req.user._id;
        } else if (employeeId) {
            query.employeeId = employeeId;
        }

        if (status) query.status = status;
        if (type) query.type = type;

        const total = await ExpenseClaim.countDocuments(query);
        const claims = await ExpenseClaim.find(query)
            .populate('employeeId', 'name email')
            .populate('ticketId', 'ticketNumber description')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Summary stats (for admin dashboard cards)
        const pendingCount = await ExpenseClaim.countDocuments({ ...(req.user.role === 'employee' ? { employeeId: req.user._id } : {}), status: 'pending' });
        const approvedCount = await ExpenseClaim.countDocuments({ ...(req.user.role === 'employee' ? { employeeId: req.user._id } : {}), status: 'approved' });
        const rejectedCount = await ExpenseClaim.countDocuments({ ...(req.user.role === 'employee' ? { employeeId: req.user._id } : {}), status: 'rejected' });

        // Total approved amount in PKR
        const approvedAgg = await ExpenseClaim.aggregate([
            { $match: { ...(req.user.role === 'employee' ? { employeeId: req.user._id } : {}), status: 'approved' } },
            { $group: { _id: null, totalPKR: { $sum: '$amountPKR' } } },
        ]);
        const totalApprovedPKR = approvedAgg[0]?.totalPKR || 0;

        res.status(200).json({
            success: true,
            data: {
                claims,
                summary: { pendingCount, approvedCount, rejectedCount, totalApprovedPKR },
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
 * @desc    Get single expense claim by ID
 * @route   GET /api/v1/expenses/:id
 * @access  Admin | Claim owner (employee)
 */
const getExpenseById = async (req, res, next) => {
    try {
        const claim = await ExpenseClaim.findById(req.params.id)
            .populate('employeeId', 'name email')
            .populate('ticketId', 'ticketNumber description')
            .populate('reviewedBy', 'name email');

        if (!claim) {
            return res.status(404).json({ success: false, message: 'Expense claim not found' });
        }

        // Employees can only view their own claims
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
