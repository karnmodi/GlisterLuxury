const router = require('express').Router();
const ctrl = require('../controllers/finishes.controller');
const { validateCreateFinish } = require('../middleware/validation');
const { uploadSingle, handleMulterError } = require('../middleware/upload');

router.post('/', validateCreateFinish, ctrl.createFinish);
router.get('/with-products', ctrl.listFinishesWithProducts);
router.get('/', ctrl.listFinishes);
router.get('/:id', ctrl.getFinish);
router.patch('/:id', ctrl.updateFinish);
router.delete('/:id', ctrl.deleteFinish);

// Image upload routes
router.post('/:id/image', uploadSingle, handleMulterError, ctrl.uploadFinishImage);
router.delete('/:id/image', ctrl.deleteFinishImage);

module.exports = router;


