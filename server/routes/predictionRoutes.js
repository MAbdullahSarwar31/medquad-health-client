const express = require('express');
const router = express.Router();
const { getPredictions, acknowledgePrediction, createPreventiveTicket } = require('../controllers/predictionController');
const { protect, requireRole } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validator');

router.use(protect);
router.use(requireRole('admin'));

router.get('/', getPredictions);
router.put('/:id/acknowledge', validateIdParam, acknowledgePrediction);
router.post('/:id/create-ticket', validateIdParam, createPreventiveTicket);

module.exports = router;
