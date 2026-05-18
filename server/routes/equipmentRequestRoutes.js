const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/equipmentRequestController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.post('/', requireRole('client'), createRequest);
router.get('/', getRequests); // Both admin and client
router.put('/:id/status', requireRole('admin'), updateRequestStatus);

module.exports = router;
