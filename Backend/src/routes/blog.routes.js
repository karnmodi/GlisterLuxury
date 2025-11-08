const router = require('express').Router();
const ctrl = require('../controllers/blog.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const ensureDbConnection = require('../middleware/ensureDbConnection');

// Public route - get active blogs (anyone can access)
// If user is admin, they can see all blogs via query params
router.get('/', ensureDbConnection, optionalAuth, ctrl.listBlogs);
router.get('/:id', ensureDbConnection, optionalAuth, ctrl.getBlog);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ensureDbConnection, ctrl.createBlog);
router.patch('/reorder', ensureDbConnection, ctrl.reorderBlogs);
router.patch('/:id', ensureDbConnection, ctrl.updateBlog);
router.delete('/:id', ensureDbConnection, ctrl.deleteBlog);

module.exports = router;

