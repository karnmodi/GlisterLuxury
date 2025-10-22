const router = require('express').Router();
const ctrl = require('../controllers/finishes.controller');
const { validateCreateFinish } = require('../middleware/validation');

router.post('/', validateCreateFinish, ctrl.createFinish);
router.get('/', ctrl.listFinishes);
router.get('/:id', ctrl.getFinish);
router.patch('/:id', ctrl.updateFinish);
router.delete('/:id', ctrl.deleteFinish);

module.exports = router;


