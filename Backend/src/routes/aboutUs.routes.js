const router = require('express').Router();
const ctrl = require('../controllers/aboutUs.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public route - get active about us content (anyone can access)
// If user is admin, they can see all content via query params
router.get('/', optionalAuth, ctrl.listAboutUs);
router.get('/:id', optionalAuth, ctrl.getAboutUs);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ctrl.createAboutUs);
router.patch('/reorder', ctrl.reorderAboutUs);
router.patch('/:id', ctrl.updateAboutUs);
router.delete('/:id', ctrl.deleteAboutUs);

module.exports = router;

