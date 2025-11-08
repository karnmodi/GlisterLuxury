const router = require('express').Router();
const ctrl = require('../controllers/collections.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes - get collections (for customer-facing pages)
router.get('/', ctrl.listCollections);
router.get('/:id', ctrl.getCollection);
router.get('/:id/products', ctrl.getCollectionProducts);

// Admin routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.post('/', ctrl.createCollection);
router.patch('/:id', ctrl.updateCollection);
router.delete('/:id', ctrl.deleteCollection);
router.post('/:id/products', ctrl.addProductsToCollection);
router.delete('/:id/products', ctrl.removeProductsFromCollection);

module.exports = router;

