const mongoose = require('mongoose');

const equipmentRequestSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestType: {
            type: String,
            enum: ['add', 'remove'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        // Fields for 'add' requests
        equipmentDetails: {
            name: { type: String, trim: true },
            category: { type: String, trim: true },
            manufacturer: { type: String, trim: true },
            model: { type: String, trim: true },
            serialNumber: { type: String, trim: true },
        },
        // Fields for 'remove' requests
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
        },
        clientNotes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster querying
equipmentRequestSchema.index({ clientId: 1, status: 1 });
equipmentRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EquipmentRequest', equipmentRequestSchema);
