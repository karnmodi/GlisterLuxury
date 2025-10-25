const router = require('express').Router();
const ctrl = require('../controllers/faq.controller');
const { validateCreateFAQ } = require('../middleware/validation');

router.post('/', validateCreateFAQ, ctrl.createFAQ);
router.get('/', ctrl.listFAQs);
router.get('/:id', ctrl.getFAQ);
router.patch('/:id', ctrl.updateFAQ);
router.delete('/:id', ctrl.deleteFAQ);

module.exports = router;
