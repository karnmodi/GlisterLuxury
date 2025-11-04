const express = require('express');
const router = express.Router();
const {
	createCategory,
	listCategories,
	getCategory,
	getCategoryBySlug,
	updateCategory,
	deleteCategory,
	addSubcategory,
	updateSubcategory,
	deleteSubcategory,
} = require('../controllers/categories.controller');

// Category routes
router.post('/', createCategory);
router.get('/', listCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.put('/:id', updateCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Subcategory routes
router.post('/:id/subcategories', addSubcategory);
router.put('/:id/subcategories/:subcategoryId', updateSubcategory);
router.delete('/:id/subcategories/:subcategoryId', deleteSubcategory);

module.exports = router;


