const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes - get contact info and submit inquiries
router.get('/info', optionalAuth, ctrl.listContactInfo);
router.post('/inquiry', ctrl.submitInquiry);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Contact Info management (admin only)
router.post('/info', ctrl.createContactInfo);
router.get('/info/:id', ctrl.getContactInfo);
router.patch('/info/:id', ctrl.updateContactInfo);
router.delete('/info/:id', ctrl.deleteContactInfo);

// Inquiry management (admin only)
router.get('/inquiries', ctrl.listInquiries);
router.get('/inquiries/:id', ctrl.getInquiry);
router.patch('/inquiries/:id', ctrl.updateInquiry);
router.delete('/inquiries/:id', ctrl.deleteInquiry);

module.exports = router;

