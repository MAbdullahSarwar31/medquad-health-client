const { notify, getAdminIds } = require('../services/notificationService');
const Inventory = require('../models/Inventory');

/**
 * @desc    Get all inventory items
 * @route   GET /api/v1/inventory
 * @access  Admin, Employee
 */
const getInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, category, needsReorder } = req.query;
        const query = {};

        if (category) query.category = category;
        if (needsReorder !== undefined) query.needsReorder = needsReorder === 'true';
        if (search) {
            query.$or = [
                { partName: { $regex: search, $options: 'i' } },
                { partNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Inventory.countDocuments(query);
        const items = await Inventory.find(query)
            .sort({ needsReorder: -1, partName: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const reorderCount = await Inventory.countDocuments({ needsReorder: true });

        res.status(200).json({
            success: true,
            data: {
                items,
                reorderCount,
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
 * @desc    Get single inventory item
 * @route   GET /api/v1/inventory/:id
 * @access  Admin, Employee
 */
const getInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }
        // NOTIF: inventory_low
        if (item.quantityOnHand <= item.reorderThreshold) {
            const io7 = req.app.get('io');
            const adminIds7 = await getAdminIds();
            await notify({ recipientId: adminIds7, type: 'inventory_low', title: '⚠️ Low Stock Alert', message: `"${item.partName}" (Part# ${item.partNumber}) is at or below reorder threshold. Current stock: ${item.quantityOnHand} units (threshold: ${item.reorderThreshold}).`, link: '/admin/inventory', buttonText: 'Manage Inventory', metadata: { inventoryId: item._id }, sendEmail: true, io: io7 });
        }

        res.status(200).json({ success: true, data: { item } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create inventory item
 * @route   POST /api/v1/inventory
 * @access  Admin
 */
const createInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.create(req.body);
        res.status(201).json({ success: true, data: { item } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update inventory item
 * @route   PUT /api/v1/inventory/:id
 * @access  Admin
 */
const updateInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }

        Object.keys(req.body).forEach((key) => {
            item[key] = req.body[key];
        });

        await item.save(); // Triggers pre-save hook for needsReorder
        res.status(200).json({ success: true, data: { item } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete inventory item
 * @route   DELETE /api/v1/inventory/:id
 * @access  Admin
 */
const deleteInventoryItem = async (req, res, next) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Inventory item not found' });
        }
        res.status(200).json({ success: true, message: 'Inventory item deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem };
