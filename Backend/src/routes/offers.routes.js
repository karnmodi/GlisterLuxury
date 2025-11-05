const router = require('express').Router();
const ctrl = require('../controllers/offers.controller');
const { protect, authorize } = require('../middleware/auth');

// Public route - validate offer code (must come before other routes)
router.post('/validate', ctrl.validateOffer);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ctrl.createOffer);
router.get('/', ctrl.listOffers);
router.get('/:id', ctrl.getOfferById);
router.get('/:id/analytics', ctrl.getOfferAnalytics);
router.patch('/:id', ctrl.updateOffer);
router.put('/:id', ctrl.updateOffer);
router.delete('/:id', ctrl.deleteOffer);
router.post('/:id/increment-usage', ctrl.incrementUsage);

module.exports = router;

