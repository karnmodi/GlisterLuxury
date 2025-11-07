const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth');

// Public route - get settings (needed for cart/checkout to calculate delivery)
router.get('/', ctrl.getSettings);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.put('/', ctrl.updateSettings);
router.post('/reset', ctrl.resetSettings);

module.exports = router;
