const express = require('express');
const router = express.Router();
const {
    getTickets, getTicket, createTicket, updateTicket,
    addTicketUpdate, deleteTicket, getTicketStats, analyzeTicket
} = require('../controllers/ticketController');
const { protect, requireRole } = require('../middleware/auth');
const { validateTicketCreate, validateTicketUpdate, validateTicketAddUpdate, validateIdParam } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// Stats must come before /:id route
router.get('/stats', requireRole('admin'), getTicketStats);
router.post('/analyze', requireRole('admin', 'client'), analyzeTicket);

router.route('/')
    .get(getTickets)
    .post(requireRole('admin', 'client'), validateTicketCreate, createTicket);

router.route('/:id')
    .all(validateIdParam)
    .get(getTicket)
    .put(requireRole('admin', 'employee'), validateTicketUpdate, updateTicket)
    .delete(requireRole('admin'), deleteTicket);

router.post('/:id/updates', validateIdParam, validateTicketAddUpdate, addTicketUpdate);

module.exports = router;
