const User = require('../models/User');

/**
 * @desc    Get all users (with pagination & filtering)
 * @route   GET /api/v1/users
 * @access  Admin only
 */
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, search, isActive } = req.query;
        const query = {};

        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .populate('clientId', 'orgName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                users,
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
 * @desc    Get single user by ID
 * @route   GET /api/v1/users/:id
 * @access  Admin only
 */
const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('clientId', 'orgName');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a user (admin can set any role)
 * @route   POST /api/v1/users
 * @access  Admin only
 */
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, clientId } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const user = await User.create({ name, email, password, role, phone, clientId });
        res.status(201).json({ success: true, data: { user } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a user
 * @route   PUT /api/v1/users/:id
 * @access  Admin only
 */
const updateUser = async (req, res, next) => {
    try {
        const { name, email, role, phone, clientId, isActive } = req.body;
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (email !== undefined) updateFields.email = email;
        if (role !== undefined) updateFields.role = role;
        if (phone !== undefined) updateFields.phone = phone;
        if (clientId !== undefined) updateFields.clientId = clientId;
        if (isActive !== undefined) updateFields.isActive = isActive;

        const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/users/:id
 * @access  Admin only
 */
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
