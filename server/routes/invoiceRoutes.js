const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus,
} = require('../controllers/invoiceController');
const { protect, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(requireRole('admin', 'client'), getInvoices)
    .post(requireRole('admin'), createInvoice);

router.route('/:id')
    .get(requireRole('admin', 'client'), getInvoiceById);

router.patch('/:id/status', requireRole('admin'), updateInvoiceStatus);

module.exports = router;
