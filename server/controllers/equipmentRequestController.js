const EquipmentRequest = require('../models/EquipmentRequest');
const Equipment = require('../models/Equipment');
const { notify, getAdminIds } = require('../services/notificationService');

/**
 * @desc    Create a new equipment request (add/remove)
 * @route   POST /api/v1/equipment-requests
 * @access  Client only
 */
const createRequest = async (req, res, next) => {
    try {
        if (req.user.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Only clients can request equipment changes.' });
        }

        const clientId = req.user.clientId || req.user._id;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Could not identify client ID.' });
        }

        const { requestType, equipmentDetails, equipmentId, clientNotes } = req.body;

        const newRequest = await EquipmentRequest.create({
            clientId: clientId,
            requestedBy: req.user._id,
            requestType,
            equipmentDetails: requestType === 'add' ? equipmentDetails : undefined,
            equipmentId: requestType === 'remove' ? equipmentId : undefined,
            clientNotes,
        });

        // Notify admins
        const adminIds = await getAdminIds();
        await notify({
            recipientId: adminIds,
            type: 'equipment_request',
            title: `New Equipment ${requestType === 'add' ? 'Addition' : 'Removal'} Request`,
            message: `A client has requested to ${requestType} equipment.`,
            link: '/admin/equipment', // Add an equipment requests tab here later
            io: req.app.get('io'),
        });

        res.status(201).json({ success: true, data: { request: newRequest } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get equipment requests
 * @route   GET /api/v1/equipment-requests
 * @access  Admin, Client
 */
const getRequests = async (req, res, next) => {
    try {
        const query = {};
        if (req.user.role === 'client') {
            const clientId = req.user.clientId || req.user._id;
            query.clientId = clientId;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        const requests = await EquipmentRequest.find(query)
            .populate('clientId', 'orgName')
            .populate('requestedBy', 'name email')
            .populate('equipmentId', 'name serialNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: { requests } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve or reject a request
 * @route   PUT /api/v1/equipment-requests/:id/status
 * @access  Admin
 */
const updateRequestStatus = async (req, res, next) => {
    try {
        const { status, adminNotes } = req.body; // status: 'approved' | 'rejected'

        const request = await EquipmentRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
        }

        request.status = status;
        request.adminNotes = adminNotes;
        request.resolvedAt = Date.now();
        request.resolvedBy = req.user._id;

        // Automatically process the request if approved
        if (status === 'approved') {
            if (request.requestType === 'add') {
                await Equipment.create({
                    clientId: request.clientId,
                    name: request.equipmentDetails.name,
                    category: request.equipmentDetails.category,
                    manufacturer: request.equipmentDetails.manufacturer,
                    model: request.equipmentDetails.model,
                    serialNumber: request.equipmentDetails.serialNumber,
                    status: 'operational',
                });
            } else if (request.requestType === 'remove') {
                await Equipment.findByIdAndDelete(request.equipmentId);
            }
        }

        await request.save();

        // Notify client
        await notify({
            recipientId: request.requestedBy,
            type: 'equipment_request_resolved',
            title: `Equipment Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your request to ${request.requestType} equipment has been ${status}. ${adminNotes || ''}`,
            link: '/client/dashboard',
            io: req.app.get('io'),
        });

        res.status(200).json({ success: true, data: { request } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRequest,
    getRequests,
    updateRequestStatus,
};
