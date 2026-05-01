const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
    {
        orgName: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
            unique: true,
            maxlength: [200, 'Organization name cannot exceed 200 characters'],
        },
        contactPerson: {
            type: String,
            required: [true, 'Contact person is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        address: {
            street: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            zipCode: { type: String, default: '' },
            country: { type: String, default: 'Pakistan' },
        },
        contractExpiry: {
            type: Date,
            required: [true, 'Contract expiry date is required'],
        },
        contractStatus: {
            type: String,
            enum: ['active', 'expired', 'pending', 'cancelled'],
            default: 'active',
        },
        equipmentIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Equipment',
            },
        ],
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

clientSchema.index({ contractStatus: 1 });
clientSchema.index({ contractExpiry: 1 });

module.exports = mongoose.model('Client', clientSchema);
