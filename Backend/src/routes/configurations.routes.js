const router = require('express').Router();
const ctrl = require('../controllers/configurations.controller');
const { validatePreviewPrice } = require('../middleware/validation');

router.post('/price', validatePreviewPrice, ctrl.previewPrice);
router.post('/', validatePreviewPrice, ctrl.createConfiguration);
router.get('/:id', ctrl.getConfiguration);
router.get('/', ctrl.listConfigurations);

module.exports = router;


