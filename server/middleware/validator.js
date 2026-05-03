const { validationResult, body, param } = require('express-validator');

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(err => `${err.msg} (got: "${err.value}")`).join(', ');
        return res.status(400).json({
            success: false,
            message: `Validation Error: ${errorDetails}`,
            errors: errors.array().map(err => ({ field: err.path, message: err.msg, value: err.value }))
        });
    }
    next();
};

// Validation rules for Auth
const validateRegister = [
    body('name', 'Name is required and must be at least 2 characters').isString().trim().isLength({ min: 2, max: 100 }),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    body('role', 'Invalid role').optional().isIn(['public', 'client', 'employee', 'admin']),
    body('phone', 'Phone number must be a string').optional().isString().trim(),
    validate
];

const validateLogin = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').notEmpty(),
    validate
];

// Validation rules for Tickets
const validateTicketCreate = [
    body('equipmentId', 'Equipment ID is required').isMongoId(),
    body('description', 'Description must be at least 10 characters').isString().trim().isLength({ min: 10 }),
    body('priority', 'Invalid priority').optional().trim().toLowerCase().isIn(['low', 'medium', 'high', 'critical']),
    validate
];

const validateTicketUpdate = [
    body('status', 'Invalid status').optional().isIn(['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed']),
    body('priority', 'Invalid priority').optional().trim().toLowerCase().isIn(['low', 'medium', 'high', 'critical']),
    body('assignedEmployee', 'Invalid employee ID').optional().isMongoId(),
    body('description', 'Description must be a string').optional().isString().trim(),
    validate
];

const validateTicketAddUpdate = [
    body('message', 'Message is required').isString().notEmpty().trim(),
    body('status', 'Invalid status').optional().isIn(['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed']),
    validate
];

// Validation rules for Equipment
const validateEquipmentCreate = [
    body('name', 'Equipment name is required').isString().notEmpty().trim(),
    body('model', 'Model is required').isString().notEmpty().trim(),
    body('manufacturer', 'Manufacturer is required').isString().notEmpty().trim(),
    body('category', 'Invalid category').isIn(['MRI', 'CT', 'Ultrasound', 'X-Ray', 'ECG', 'Ventilator', 'Monitor', 'Other']),
    body('serialNumber', 'Serial number is required').isString().notEmpty().trim(),
    body('clientId', 'Invalid client ID').optional().isMongoId(),
    body('status', 'Invalid status').optional().isIn(['operational', 'maintenance', 'down', 'decommissioned']),
    validate
];

// Reusable ID validation
const validateIdParam = [
    param('id', 'Invalid ID format').isMongoId(),
    validate
];

module.exports = {
    validateRegister,
    validateLogin,
    validateTicketCreate,
    validateTicketUpdate,
    validateTicketAddUpdate,
    validateEquipmentCreate,
    validateIdParam,
};
