const router = require('express').Router();
const ctrl = require('../controllers/blog.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public route - get active blogs (anyone can access)
// If user is admin, they can see all blogs via query params
router.get('/', optionalAuth, ctrl.listBlogs);
router.get('/:id', optionalAuth, ctrl.getBlog);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ctrl.createBlog);
router.patch('/reorder', ctrl.reorderBlogs);
router.patch('/:id', ctrl.updateBlog);
router.delete('/:id', ctrl.deleteBlog);

module.exports = router;

