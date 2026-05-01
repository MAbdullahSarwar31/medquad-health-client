const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Item description is required'],
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0.1,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
    },
});

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Client is required'],
        },
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceTicket',
            default: null,
        },
        issueDate: {
            type: Date,
            required: [true, 'Issue date is required'],
            default: Date.now,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        currency: {
            type: String,
            default: 'PKR',
        },
        items: [invoiceItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        taxRate: {
            // Percentage spread (e.g. 10 for 10%)
            type: Number,
            default: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            default: 'draft',
        },
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate invoice number and compute totals before validation
invoiceSchema.pre('validate', function (next) {
    // Generate INV number
    if (!this.invoiceNumber) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.invoiceNumber = `INV-${datePart}-${rand}`;
    }

    // Compute line items
    let calculatedSubtotal = 0;
    if (this.items && this.items.length > 0) {
        this.items.forEach((item) => {
            item.total = item.quantity * item.unitPrice;
            calculatedSubtotal += item.total;
        });
    }

    // Final calculations
    this.subtotal = calculatedSubtotal;
    this.taxAmount = (this.subtotal * (this.taxRate / 100)) || 0;
    this.totalAmount = this.subtotal + this.taxAmount;

    next();
});

invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
