const { notify, getAdminIds } = require('../services/notificationService');
const { generateEquipmentReport } = require('../services/equipmentReportAIService');
const Equipment = require('../models/Equipment');

/**
 * @desc    Get all equipment (public catalog or admin list)
 *          Supports: search, filter by category/manufacturer/status, cursor-based pagination
 * @route   GET /api/v1/equipment
 * @access  Public (catalog) / All authenticated roles
 */
const getEquipment = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            manufacturer,
            status,
            clientId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};

        if (category) query.category = category;
        if (manufacturer) query.manufacturer = { $regex: manufacturer, $options: 'i' };
        if (status) query.status = status;

        // Client should only see their own equipment
        if (req.user && req.user.role === 'client') {
            query.clientId = req.user.clientId || req.user._id;
        } else if (clientId) {
            query.clientId = clientId;
        }

        // Full-text search on name, model, description, manufacturer
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const total = await Equipment.countDocuments(query);
        const equipment = await Equipment.find(query)
            .populate('clientId', 'orgName')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get unique manufacturers and categories for filter dropdowns
        const [manufacturers, categories] = await Promise.all([
            Equipment.distinct('manufacturer'),
            Equipment.distinct('category'),
        ]);

        res.status(200).json({
            success: true,
            data: {
                equipment,
                filters: { manufacturers, categories },
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
 * @desc    Get single equipment by ID
 * @route   GET /api/v1/equipment/:id
 * @access  Authenticated
 */
const getEquipmentById = async (req, res, next) => {
    try {
        const equipment = await Equipment.findById(req.params.id)
            .populate('clientId', 'orgName contactPerson');

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        res.status(200).json({ success: true, data: { equipment } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate AI Health Report for a specific equipment
 * @route   GET /api/v1/equipment/:id/ai-report
 * @access  Admin only
 * 
 * Academic Concepts: RAG (Retrieval-Augmented Generation),
 * Data-to-Text Generation, Summarization, Explainable AI (XAI)
 */
const getEquipmentAIReport = async (req, res, next) => {
    try {
        const equipment = await Equipment.findById(req.params.id)
            .populate('clientId', 'orgName');

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }

        // RAG: Fetch all relevant context from DB before calling AI
        const ServiceTicket = require('../models/ServiceTicket');
        const MaintenancePrediction = require('../models/MaintenancePrediction');

        const [tickets, predictions] = await Promise.all([
            ServiceTicket.find({ equipmentId: equipment._id })
                .sort({ createdAt: -1 }).limit(10).lean(),
            MaintenancePrediction.find({ equipmentId: equipment._id, isAcknowledged: false })
                .sort({ confidence: -1 }).lean(),
        ]);

        const report = await generateEquipmentReport(equipment, tickets, predictions);

        if (!report) {
            return res.status(503).json({
                success: false,
                message: 'AI report generation failed. Please try again later.',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                report,
                equipment: { name: equipment.name, id: equipment._id, category: equipment.category },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new equipment
 * @route   POST /api/v1/equipment
 * @access  Admin only
 */
const createEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.create(req.body);
        const io = req.app.get('io');
        const adminIds = await getAdminIds();
        await notify({
            recipientId: adminIds,
            type: 'equipment_added',
            title: 'New Equipment Added',
            message: `New equipment "${equipment.name}" (${equipment.category}) has been registered in the system.`,
            link: '/admin/equipment',
            buttonText: 'View Equipment',
            metadata: { equipmentId: equipment._id },
            sendEmail: false,
            io,
        });

        res.status(201).json({ success: true, data: { equipment } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update equipment
 * @route   PUT /api/v1/equipment/:id
 * @access  Admin only
 */
const updateEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.status(200).json({ success: true, data: { equipment } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete equipment
 * @route   DELETE /api/v1/equipment/:id
 * @access  Admin only
 */
const deleteEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);
        if (!equipment) {
            return res.status(404).json({ success: false, message: 'Equipment not found' });
        }
        res.status(200).json({ success: true, message: 'Equipment deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getEquipment, getEquipmentById, getEquipmentAIReport, createEquipment, updateEquipment, deleteEquipment };
