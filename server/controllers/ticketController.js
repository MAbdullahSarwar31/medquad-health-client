const ServiceTicket = require('../models/ServiceTicket');
const User = require('../models/User');
const { analyzeTicketDescription } = require('../services/ticketAIService');
const { notify, getAdminIds } = require('../services/notificationService');

/**
 * @desc    Get all tickets (filtered by role)
 * @route   GET /api/v1/tickets
 * @access  Authenticated
 */
const getTickets = async (req, res, next) => {
    try {
        const {
            page = 1, limit = 20, status, priority,
            clientId, assignedEmployee, search, sortBy = 'createdAt', sortOrder = 'desc',
        } = req.query;

        const query = {};

        // Role-based filtering
        if (req.user.role === 'client') {
            query.clientId = req.user.clientId;
        } else if (req.user.role === 'employee') {
            query.assignedEmployee = req.user._id;
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (clientId && req.user.role === 'admin') query.clientId = clientId;
        if (assignedEmployee && req.user.role === 'admin') query.assignedEmployee = assignedEmployee;
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { ticketNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const total = await ServiceTicket.countDocuments(query);
        const tickets = await ServiceTicket.find(query)
            .populate('clientId', 'orgName')
            .populate('equipmentId', 'name model category')
            .populate('createdBy', 'name email')
            .populate('assignedEmployee', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                tickets,
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
 * @desc    Get single ticket
 * @route   GET /api/v1/tickets/:id
 * @access  Authenticated (scoped)
 */
const getTicket = async (req, res, next) => {
    try {
        const ticket = await ServiceTicket.findById(req.params.id)
            .populate('clientId', 'orgName contactPerson')
            .populate('equipmentId', 'name model manufacturer category serialNumber')
            .populate('createdBy', 'name email')
            .populate('assignedEmployee', 'name email phone')
            .populate('updates.updatedBy', 'name role');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Client can only view their own tickets
        if (req.user.role === 'client' && ticket.clientId._id.toString() !== req.user.clientId?.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({ success: true, data: { ticket } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new service ticket
 * @route   POST /api/v1/tickets
 * @access  Client, Admin
 */
const createTicket = async (req, res, next) => {
    try {
        const { equipmentId, description, priority } = req.body;

        const ticketData = {
            clientId: req.user.role === 'client' ? req.user.clientId : req.body.clientId,
            equipmentId,
            description,
            priority: priority || 'medium',
            createdBy: req.user._id,
        };

        // Asynchronously process NLP categorization
        // To not block ticket creation, we create it first, then update it.
        // Wait, the blueprint says it happens asynchronously, but we can do it synchronously
        // if we want to show it immediately. Let's do it synchronously for better UX or async if preferred.
        // Let's do it right away so the created ticket has the fields.
        
        const aiResult = await analyzeTicketDescription(description);
        
        if (aiResult) {
            ticketData.aiCategory = aiResult.category;
            ticketData.aiPriorityScore = aiResult.priorityScore;
            
            // Map priority score to priority string
            if (!priority) {
                if (aiResult.priorityScore >= 4) ticketData.priority = 'critical';
                else if (aiResult.priorityScore === 3) ticketData.priority = 'high';
                else if (aiResult.priorityScore === 2) ticketData.priority = 'medium';
                else ticketData.priority = 'low';
            }

            // Find an available employee (simplified auto-assignment)
            // Just picking the first available employee with matching skills or any employee
            const employee = await User.findOne({ role: 'employee' }); // Simplified logic
            if (employee) {
                ticketData.suggestedEmployee = employee._id;
                ticketData.assignedEmployee = employee._id;
                ticketData.status = 'assigned';
                ticketData.estimatedResponseTime = aiResult.priorityScore >= 4 ? 'Within 4 hours' : 'Within 24 hours';
            }
        }

        const ticket = await ServiceTicket.create(ticketData);
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

/**
 * @desc    Analyze ticket description with AI
 * @route   POST /api/v1/tickets/analyze
 * @access  Admin, Client
 */
const analyzeTicket = async (req, res, next) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ success: false, message: 'Description is required for analysis' });
        }
        
        const aiResult = await analyzeTicketDescription(description);
        
        res.status(200).json({
            success: true,
            data: { analysis: aiResult }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update ticket (status, assign employee, etc.)
 * @route   PUT /api/v1/tickets/:id
 * @access  Admin, Employee
 */
const updateTicket = async (req, res, next) => {
    try {
        const ticket = await ServiceTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const { status, priority, assignedEmployee, description } = req.body;

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;
        if (assignedEmployee) ticket.assignedEmployee = assignedEmployee;
        if (description) ticket.description = description;

        await ticket.save();

        const updated = await ServiceTicket.findById(ticket._id)
            .populate('clientId', 'orgName')
            .populate('equipmentId', 'name model category')
            .populate('assignedEmployee', 'name email');

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`room:admin`).emit('ticketUpdated', updated);
            if (updated.clientId) {
                io.to(`room:${updated.clientId._id.toString()}`).emit('ticketUpdated', updated);
            }
            if (updated.assignedEmployee) {
                io.to(`room:${updated.assignedEmployee._id.toString()}`).emit('ticketUpdated', updated);
            }
        }

        res.status(200).json({ success: true, data: { ticket: updated } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add an update/note to a ticket
 * @route   POST /api/v1/tickets/:id/updates
 * @access  Admin, Employee, Client (own tickets)
 */
const addTicketUpdate = async (req, res, next) => {
    try {
        const ticket = await ServiceTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const { message, status } = req.body;

        ticket.updates.push({
            updatedBy: req.user._id,
            message,
            status: status || ticket.status,
        });

        if (status) {
            ticket.status = status;
        }

        await ticket.save();

        const updated = await ServiceTicket.findById(ticket._id)
            .populate('updates.updatedBy', 'name role');

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`room:admin`).emit('ticketUpdated', updated);
            if (updated.clientId) {
                io.to(`room:${updated.clientId.toString()}`).emit('ticketUpdated', updated);
            }
            if (updated.assignedEmployee) {
                io.to(`room:${updated.assignedEmployee.toString()}`).emit('ticketUpdated', updated);
            }
        }

        res.status(200).json({ success: true, data: { ticket: updated } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a ticket
 * @route   DELETE /api/v1/tickets/:id
 * @access  Admin only
 */
const deleteTicket = async (req, res, next) => {
    try {
        const ticket = await ServiceTicket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ticket statistics (for admin dashboard)
 * @route   GET /api/v1/tickets/stats
 * @access  Admin
 */
const getTicketStats = async (req, res, next) => {
    try {
        // Get 7-day trend data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const trendData = await ServiceTicket.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Create array for last 7 days with counts
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const dataPoint = trendData.find(d => d._id === dateStr);
            last7Days.push({
                name: dayName,
                tickets: dataPoint ? dataPoint.count : 0
            });
        }

        const [statusCounts, priorityCounts, recentTickets] = await Promise.all([
            ServiceTicket.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            ServiceTicket.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } },
            ]),
            ServiceTicket.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('clientId', 'orgName')
                .populate('equipmentId', 'name model'),
        ]);

        const totalTickets = await ServiceTicket.countDocuments();
        const resolvedTickets = await ServiceTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } });

        res.status(200).json({
            success: true,
            data: {
                totalTickets,
                resolvedTickets,
                openTickets: totalTickets - resolvedTickets,
                statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
                priorityCounts: Object.fromEntries(priorityCounts.map((p) => [p._id, p.count])),
                recentTickets,
                trendData: last7Days,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    addTicketUpdate,
    deleteTicket,
    getTicketStats,
    analyzeTicket,
};
