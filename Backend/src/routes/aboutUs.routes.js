const router = require('express').Router();
const ctrl = require('../controllers/aboutUs.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const ensureDbConnection = require('../middleware/ensureDbConnection');

// Public route - get active about us content (anyone can access)
// If user is admin, they can see all content via query params
router.get('/', ensureDbConnection, optionalAuth, ctrl.listAboutUs);
router.get('/:id', ensureDbConnection, optionalAuth, ctrl.getAboutUs);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ensureDbConnection, ctrl.createAboutUs);
router.patch('/reorder', ensureDbConnection, ctrl.reorderAboutUs);
router.patch('/:id', ensureDbConnection, ctrl.updateAboutUs);
router.delete('/:id', ensureDbConnection, ctrl.deleteAboutUs);

module.exports = router;

