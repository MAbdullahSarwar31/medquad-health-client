const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(requireRole('admin', 'employee'), getClients)
    .post(requireRole('admin'), createClient);

router.route('/:id')
    .get(requireRole('admin', 'employee', 'client'), getClient)
    .put(requireRole('admin'), updateClient)
    .delete(requireRole('admin'), deleteClient);

module.exports = router;
