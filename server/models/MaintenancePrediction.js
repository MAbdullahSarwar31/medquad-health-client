const mongoose = require('mongoose');

const maintenancePredictionSchema = new mongoose.Schema(
    {
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            required: [true, 'Equipment reference is required'],
        },
        predictedFailureDate: {
            type: Date,
            required: [true, 'Predicted failure date is required'],
        },
        confidence: {
            type: Number,
            required: true,
            min: [0, 'Confidence must be between 0 and 1'],
            max: [1, 'Confidence must be between 0 and 1'],
        },
        failureType: {
            type: String,
            default: 'Component Degradation',
        },
        modelVersion: {
            type: String,
            default: 'medquad-ai-v2.0',
        },
        recommendations: {
            type: String,
            default: '',
        },
        // Structured risk tier derived from confidence thresholds
        riskTier: {
            type: String,
            enum: ['critical', 'high', 'moderate'],
            default: 'moderate',
        },
        // Detailed list of contributing risk factors for transparency
        riskFactors: {
            type: [String],
            default: [],
        },
        // AI-generated engineering explanation (XAI — Explainable AI)
        aiExplanation: {
            type: String,
            default: null,
        },
        isAcknowledged: {
            type: Boolean,
            default: false,
        },
        acknowledgedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        strict: true,
    }
);

maintenancePredictionSchema.index({ equipmentId: 1 });
maintenancePredictionSchema.index({ predictedFailureDate: 1 });
maintenancePredictionSchema.index({ confidence: -1 });
maintenancePredictionSchema.index({ isAcknowledged: 1 });
maintenancePredictionSchema.index({ riskTier: 1 });

module.exports = mongoose.model('MaintenancePrediction', maintenancePredictionSchema);
