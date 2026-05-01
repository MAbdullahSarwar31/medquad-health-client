const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        partName: {
            type: String,
            required: [true, 'Part name is required'],
            trim: true,
        },
        partNumber: {
            type: String,
            required: [true, 'Part number is required'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        compatibleModels: [
            {
                type: String,
                trim: true,
            },
        ],
        category: {
            type: String,
            enum: ['tubes', 'coils', 'sensors', 'motors', 'boards', 'cables', 'filters', 'misc'],
            default: 'misc',
        },
        quantityOnHand: {
            type: Number,
            required: true,
            min: [0, 'Quantity cannot be negative'],
            default: 0,
        },
        reorderThreshold: {
            type: Number,
            required: true,
            min: [0, 'Reorder threshold cannot be negative'],
            default: 5,
        },
        unitCost: {
            type: Number,
            min: 0,
            default: 0,
        },
        supplier: {
            type: String,
            default: '',
        },
        location: {
            type: String,
            default: 'Warehouse A',
        },
        needsReorder: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

// Auto-calculate needsReorder before save
inventorySchema.pre('save', function (next) {
    this.needsReorder = this.quantityOnHand <= this.reorderThreshold;
    next();
});

inventorySchema.index({ partName: 'text', description: 'text' });
inventorySchema.index({ needsReorder: 1 });
inventorySchema.index({ category: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
