const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, default: Date.now },
        hours: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const equipmentSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            default: null,
        },
        name: {
            type: String,
            required: [true, 'Equipment name is required'],
            trim: true,
        },
        model: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
        },
        manufacturer: {
            type: String,
            required: [true, 'Manufacturer is required'],
            trim: true,
        },
        category: {
            type: String,
            enum: ['MRI', 'CT', 'Ultrasound', 'X-Ray', 'ECG', 'Ventilator', 'Monitor', 'Other'],
            required: [true, 'Category is required'],
        },
        serialNumber: {
            type: String,
            required: [true, 'Serial number is required'],
            unique: true,
            trim: true,
        },
        installDate: {
            type: Date,
            default: null,
        },
        lastServiceDate: {
            type: Date,
            default: null,
        },
        warrantyExpiry: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['operational', 'maintenance', 'down', 'decommissioned'],
            default: 'operational',
        },
        description: {
            type: String,
            default: '',
        },
        specifications: {
            type: Map,
            of: String,
            default: {},
        },
        imageUrl: {
            type: String,
            default: '',
        },
        manualUrl: {
            type: String,
            default: '',
        },
        usageHoursLog: [usageLogSchema],
        totalUsageHours: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

// Text index for full-text search on name, model, manufacturer, description
equipmentSchema.index({ name: 'text', model: 'text', description: 'text', manufacturer: 'text' });
equipmentSchema.index({ clientId: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ manufacturer: 1 });
equipmentSchema.index({ status: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
