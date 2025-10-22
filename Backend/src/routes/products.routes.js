const router = require('express').Router();
const ctrl = require('../controllers/products.controller');
const { validateCreateProduct } = require('../middleware/validation');

router.post('/', validateCreateProduct, ctrl.createProduct);
router.get('/', ctrl.listProducts);
router.get('/:id', ctrl.getProduct);
router.patch('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;


