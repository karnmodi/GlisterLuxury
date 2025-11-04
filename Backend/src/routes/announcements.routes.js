const router = require('express').Router();
const ctrl = require('../controllers/announcement.controller');
const { protect, authorize } = require('../middleware/auth');

// Public route - get active announcements
router.get('/public', ctrl.listAnnouncements);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ctrl.createAnnouncement);
router.get('/', ctrl.listAnnouncements);
router.patch('/reorder', ctrl.reorderAnnouncements);
router.get('/:id', ctrl.getAnnouncement);
router.patch('/:id', ctrl.updateAnnouncement);
router.delete('/:id', ctrl.deleteAnnouncement);

module.exports = router;

