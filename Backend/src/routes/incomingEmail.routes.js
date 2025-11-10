const router = require('express').Router();
const ctrl = require('../controllers/incomingEmail.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Manual trigger to process emails
router.post('/process', ctrl.processEmails);

// Get polling status
router.get('/status', ctrl.getStatus);

// Test email connection (IMAP or POP3)
router.post('/test-connection', ctrl.testConnection);

module.exports = router;

