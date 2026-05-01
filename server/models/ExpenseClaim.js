const mongoose = require('mongoose');

const expenseClaimSchema = new mongoose.Schema(
    {
        claimNumber: {
            type: String,
            unique: true,
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee is required'],
        },
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceTicket',
            default: null,
        },
        type: {
            type: String,
            enum: ['travel', 'tools', 'supplies', 'accommodation', 'meals', 'other'],
            required: [true, 'Expense type is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            minlength: [5, 'Description must be at least 5 characters'],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'],
        },
        currency: {
            type: String,
            enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED'],
            default: 'PKR',
        },
        exchangeRate: {
            // Exchange rate to PKR at time of submission
            type: Number,
            default: 1,
            min: 0,
        },
        amountPKR: {
            // Normalized amount in PKR for admin reporting
            type: Number,
        },
        expenseDate: {
            type: Date,
            required: [true, 'Expense date is required'],
        },
        receiptNote: {
            type: String,
            default: '',
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        adminNote: {
            type: String,
            default: '',
            trim: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

// Auto-generate claim number before saving
expenseClaimSchema.pre('save', async function (next) {
    if (!this.claimNumber) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
        this.claimNumber = `EXP-${ts}-${rand}`;
    }
    // Auto-compute amountPKR
    if (this.amount && this.exchangeRate) {
        this.amountPKR = parseFloat((this.amount * this.exchangeRate).toFixed(2));
    }
    next();
});

expenseClaimSchema.index({ employeeId: 1 });
expenseClaimSchema.index({ status: 1 });
expenseClaimSchema.index({ expenseDate: -1 });
expenseClaimSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
