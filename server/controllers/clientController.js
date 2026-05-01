const Client = require('../models/Client');

/**
 * @desc    Get all clients (with pagination & search)
 * @route   GET /api/v1/clients
 * @access  Admin, Employee
 */
const getClients = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, contractStatus } = req.query;
        const query = {};

        if (contractStatus) query.contractStatus = contractStatus;
        if (search) {
            query.$or = [
                { orgName: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Client.countDocuments(query);
        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                clients,
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
 * @desc    Get single client
 * @route   GET /api/v1/clients/:id
 * @access  Admin, Employee, Client (own org)
 */
const getClient = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id).populate('equipmentIds');
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // If user is a client, they can only view their own organization
        if (req.user.role === 'client' && req.user.clientId?.toString() !== client._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, data: { client } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new client organization
 * @route   POST /api/v1/clients
 * @access  Admin only
 */
const createClient = async (req, res, next) => {
    try {
        const client = await Client.create(req.body);
        res.status(201).json({ success: true, data: { client } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a client
 * @route   PUT /api/v1/clients/:id
 * @access  Admin only
 */
const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(200).json({ success: true, data: { client } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a client
 * @route   DELETE /api/v1/clients/:id
 * @access  Admin only
 */
const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
