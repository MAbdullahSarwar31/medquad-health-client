const express = require('express');
const router = express.Router();
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const { protect, requireRole } = require('../middleware/auth');
const { validateEquipmentCreate, validateIdParam } = require('../middleware/validator');

// Public route — equipment catalog (no auth needed)
router.get('/', getEquipment);

// Protected routes
router.get('/:id', validateIdParam, protect, getEquipmentById);
router.post('/', protect, requireRole('admin'), validateEquipmentCreate, createEquipment);
router.put('/:id', validateIdParam, protect, requireRole('admin'), validateEquipmentCreate, updateEquipment);
router.delete('/:id', validateIdParam, protect, requireRole('admin'), deleteEquipment);

module.exports = router;
