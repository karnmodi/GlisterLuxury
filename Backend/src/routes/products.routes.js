const router = require('express').Router();
const ctrl = require('../controllers/products.controller');
const { validateCreateProduct } = require('../middleware/validation');
const { uploadMultiple, handleMulterError, validatePayloadSize } = require('../middleware/upload');
const { handleOptionsRequest } = require('../utils/corsHelper');

router.post('/', validateCreateProduct, ctrl.createProduct);
router.get('/suggestions', ctrl.getSuggestions); // Optimized endpoint for search suggestions
router.get('/listing', ctrl.listProductsMinimal); // Optimized endpoint for product listing
router.get('/', ctrl.listProducts);
router.get('/:id/finishes', ctrl.getProductFinishes);
router.patch('/:id/visibility', ctrl.toggleProductVisibility);
router.get('/:id', ctrl.getProduct);
router.patch('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

// Image upload routes
// Handle OPTIONS preflight requests for CORS
router.options('/:id/images', handleOptionsRequest);
router.post('/:id/images', uploadMultiple, handleMulterError, validatePayloadSize, ctrl.uploadProductImages);
router.delete('/:id/images', ctrl.deleteProductImage);
router.put('/:id/images/mapping', ctrl.updateImageFinishMapping);

module.exports = router;


