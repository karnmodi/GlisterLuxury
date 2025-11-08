const router = require('express').Router();
const ctrl = require('../controllers/materials.controller');
const { validateCreateMaterial } = require('../middleware/validation');

router.post('/', validateCreateMaterial, ctrl.createMaterial);
router.get('/with-products', ctrl.listMaterialsWithProducts);
router.get('/', ctrl.listMaterials);
router.get('/:id', ctrl.getMaterialById);
router.patch('/:id', ctrl.updateMaterial);
router.put('/:id', ctrl.updateMaterial);
router.delete('/:id', ctrl.deleteMaterial);

module.exports = router;


