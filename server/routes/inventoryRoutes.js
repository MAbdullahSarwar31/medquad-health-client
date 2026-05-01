const express = require('express');
const router = express.Router();
const { getInventory, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem } = require('../controllers/inventoryController');
const { protect, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(requireRole('admin', 'employee'), getInventory)
    .post(requireRole('admin'), createInventoryItem);

router.route('/:id')
    .get(requireRole('admin', 'employee'), getInventoryItem)
    .put(requireRole('admin'), updateInventoryItem)
    .delete(requireRole('admin'), deleteInventoryItem);

module.exports = router;
