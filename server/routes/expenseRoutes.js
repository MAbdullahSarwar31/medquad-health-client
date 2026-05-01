const express = require('express');
const router = express.Router();
const {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpenseStatus,
} = require('../controllers/expenseController');
const { protect, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(requireRole('admin', 'employee'), getExpenses)
    .post(requireRole('employee'), createExpense);

router.route('/:id')
    .get(requireRole('admin', 'employee'), getExpenseById);

router.patch('/:id/status', requireRole('admin'), updateExpenseStatus);

module.exports = router;
