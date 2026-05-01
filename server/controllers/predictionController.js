const MaintenancePrediction = require('../models/MaintenancePrediction');
const ServiceTicket = require('../models/ServiceTicket');
const Equipment = require('../models/Equipment');

/**
 * @desc    Get all active predictions
 * @route   GET /api/v1/predictions
 * @access  Admin
 */
const getPredictions = async (req, res, next) => {
    try {
        const predictions = await MaintenancePrediction.find({ isAcknowledged: false })
            .populate({
                path: 'equipmentId',
                select: 'name model manufacturer serialNumber clientId status category',
                populate: {
                    path: 'clientId',
                    select: 'orgName'
                }
            })
            .sort({ confidence: -1, predictedFailureDate: 1 });

        res.status(200).json({
            success: true,
            data: { predictions }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Acknowledge prediction
 * @route   PUT /api/v1/predictions/:id/acknowledge
 * @access  Admin
 */
const acknowledgePrediction = async (req, res, next) => {
    try {
        const prediction = await MaintenancePrediction.findByIdAndUpdate(
            req.params.id,
            {
                isAcknowledged: true,
                acknowledgedBy: req.user._id
            },
            { new: true }
        );

        if (!prediction) {
            return res.status(404).json({ success: false, message: 'Prediction not found' });
        }

        res.status(200).json({ success: true, data: { prediction } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create preventive ticket from prediction
 * @route   POST /api/v1/predictions/:id/create-ticket
 * @access  Admin
 */
const createPreventiveTicket = async (req, res, next) => {
    try {
        const prediction = await MaintenancePrediction.findById(req.params.id)
            .populate('equipmentId');

        if (!prediction) {
            return res.status(404).json({ success: false, message: 'Prediction not found' });
        }

        if (prediction.isAcknowledged) {
            return res.status(400).json({ success: false, message: 'Prediction is already acknowledged' });
        }

        const equipment = prediction.equipmentId;

        // Create the ticket
        const ticket = await ServiceTicket.create({
            clientId: equipment.clientId,
            equipmentId: equipment._id,
            description: `[AUTO-GENERATED: PREVENTIVE MAINTENANCE ALERT]\n\nAI Engine predicts a potential failure on or around ${new Date(prediction.predictedFailureDate).toLocaleDateString()}.\n\nConfidence: ${(prediction.confidence * 100).toFixed(0)}%\nRecommendations: ${prediction.recommendations}`,
            priority: prediction.confidence > 0.8 ? 'high' : 'medium',
            createdBy: req.user._id,
            aiCategory: 'Preventive',
            aiPriorityScore: prediction.confidence > 0.8 ? 4 : 3
        });

        // Acknowledge the prediction
        prediction.isAcknowledged = true;
        prediction.acknowledgedBy = req.user._id;
        await prediction.save();

        const populated = await ServiceTicket.findById(ticket._id)
            .populate('clientId', 'orgName')
            .populate('equipmentId', 'name model category')
            .populate('createdBy', 'name email');

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`room:admin`).emit('ticketCreated', populated);
            if (populated.clientId) {
                io.to(`room:${populated.clientId._id.toString()}`).emit('ticketCreated', populated);
            }
        }

        res.status(201).json({ success: true, data: { ticket: populated } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPredictions, acknowledgePrediction, createPreventiveTicket };
