const { validationResult, check } = require('express-validator');

// Middleware to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

// Validation rules for Auth
const validateRegister = [
    check('name', 'Name is required and must be at least 2 characters').isString().trim().isLength({ min: 2, max: 100 }),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('role', 'Invalid role').optional().isIn(['public', 'client', 'employee', 'admin']),
    check('phone', 'Phone number must be a string').optional().isString().trim(),
    validate
];

const validateLogin = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').notEmpty(),
    validate
];

// Validation rules for Tickets
const validateTicketCreate = [
    check('equipmentId', 'Equipment ID is required').isMongoId(),
    check('description', 'Description must be at least 10 characters').isString().trim().isLength({ min: 10 }),
    check('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    validate
];

const validateTicketUpdate = [
    check('status', 'Invalid status').optional().isIn(['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed']),
    check('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    check('assignedEmployee', 'Invalid employee ID').optional().isMongoId(),
    check('description', 'Description must be a string').optional().isString().trim(),
    validate
];

const validateTicketAddUpdate = [
    check('message', 'Message is required').isString().notEmpty().trim(),
    check('status', 'Invalid status').optional().isIn(['open', 'assigned', 'in-progress', 'on-hold', 'resolved', 'closed']),
    validate
];

// Validation rules for Equipment
const validateEquipmentCreate = [
    check('name', 'Equipment name is required').isString().notEmpty().trim(),
    check('model', 'Model is required').isString().notEmpty().trim(),
    check('manufacturer', 'Manufacturer is required').isString().notEmpty().trim(),
    check('category', 'Invalid category').isIn(['MRI', 'CT', 'Ultrasound', 'X-Ray', 'ECG', 'Ventilator', 'Monitor', 'Other']),
    check('serialNumber', 'Serial number is required').isString().notEmpty().trim(),
    check('clientId', 'Invalid client ID').optional().isMongoId(),
    check('status', 'Invalid status').optional().isIn(['operational', 'maintenance', 'down', 'decommissioned']),
    validate
];

// Reusable ID validation
const validateIdParam = [
    check('id', 'Invalid ID format').isMongoId(),
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
