const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { chat } = require('../controllers/chatController');

const router = express.Router();

// Rate limiter: 20 requests per 15 minutes per IP
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please wait a moment before sending another message.',
    },
});

// Input validation
const validateChat = [
    body('messages')
        .isArray({ min: 1, max: 50 })
        .withMessage('Messages must be a non-empty array (max 50)'),
    body('messages.*.role')
        .isIn(['user', 'assistant'])
        .withMessage('Each message role must be "user" or "assistant"'),
    body('messages.*.text')
        .isString()
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message text must be between 1 and 2000 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
];

// POST /api/v1/chat  (public — no auth required)
router.post('/', chatLimiter, validateChat, chat);

module.exports = router;
