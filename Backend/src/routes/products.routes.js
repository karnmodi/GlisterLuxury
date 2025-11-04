const router = require('express').Router();
const ctrl = require('../controllers/products.controller');
const { validateCreateProduct } = require('../middleware/validation');
const { uploadMultiple, handleMulterError } = require('../middleware/upload');

router.post('/', validateCreateProduct, ctrl.createProduct);
router.get('/listing', ctrl.listProductsMinimal); // Optimized endpoint for product listing
router.get('/', ctrl.listProducts);
router.get('/:id', ctrl.getProduct);
router.patch('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

// Image upload routes
router.post('/:id/images', uploadMultiple, handleMulterError, ctrl.uploadProductImages);
router.delete('/:id/images', ctrl.deleteProductImage);
router.put('/:id/images/mapping', ctrl.updateImageFinishMapping);

module.exports = router;


