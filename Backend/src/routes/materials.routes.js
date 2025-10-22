const router = require('express').Router();
const ctrl = require('../controllers/materials.controller');
const { validateCreateMaterial } = require('../middleware/validation');

router.post('/', validateCreateMaterial, ctrl.createMaterial);
router.get('/', ctrl.listMaterials);

module.exports = router;


