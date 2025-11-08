const Category = require('../models/Category');
const Product = require('../models/Product');

async function createCategory(req, res) {
	try {
		const category = await Category.create(req.body);
		return res.status(201).json(category);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listCategories(req, res) {
	try {
		const { q } = req.query;
		const filter = {};
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ slug: { $regex: q, $options: 'i' } },
			];
		}
		const items = await Category.find(filter).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getCategory(req, res) {
	try {
		const item = await Category.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Category not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function getCategoryBySlug(req, res) {
	try {
		const item = await Category.findOne({ slug: req.params.slug }).lean();
		if (!item) return res.status(404).json({ message: 'Category not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateCategory(req, res) {
	try {
		const { name, description } = req.body;
		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({ message: 'Category not found' });
		
		// Update name and regenerate slug if name changed
		if (name && name !== category.name) {
			category.name = name;
			category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}
		if (description !== undefined) category.description = description;
		
		await category.save();
		return res.json(category);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteCategory(req, res) {
	try {
		const result = await Category.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Category not found' });
		return res.json({ message: 'Category deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function addSubcategory(req, res) {
	try {
		const { name, description } = req.body;
		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({ message: 'Category not found' });
		
		// Generate slug for subcategory
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		
		category.subcategories.push({ name, slug, description });
		await category.save();
		
		return res.status(201).json(category);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateSubcategory(req, res) {
	try {
		const { name, description } = req.body;
		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({ message: 'Category not found' });
		
		const subcategory = category.subcategories.id(req.params.subcategoryId);
		if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
		
		if (name) {
			subcategory.name = name;
			subcategory.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}
		if (description !== undefined) subcategory.description = description;
		
		await category.save();
		return res.json(category);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteSubcategory(req, res) {
	try {
		const category = await Category.findById(req.params.id);
		if (!category) return res.status(404).json({ message: 'Category not found' });
		
		category.subcategories.pull(req.params.subcategoryId);
		await category.save();
		
		return res.json({ message: 'Subcategory deleted successfully', category });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

// Get only categories and subcategories that have products
async function listCategoriesWithProducts(req, res) {
	try {
		const { q } = req.query;
		
		// Use aggregation pipeline to get distinct category and subcategory IDs efficiently
		// This is much faster than fetching all products
		const aggregationResult = await Product.aggregate([
			// Match only visible products
			{ $match: { isVisible: true } },
			// Project only category and subcategoryId fields
			{
				$project: {
					category: 1,
					subcategoryId: 1
				}
			},
			// Group to get distinct category and subcategory IDs
			{
				$group: {
					_id: null,
					categoryIds: { $addToSet: '$category' },
					subcategoryIds: { $addToSet: '$subcategoryId' }
				}
			},
			// Project to clean up null values
			{
				$project: {
					_id: 0,
					categoryIds: {
						$filter: {
							input: '$categoryIds',
							as: 'catId',
							cond: { $ne: ['$$catId', null] }
						}
					},
					subcategoryIds: {
						$filter: {
							input: '$subcategoryIds',
							as: 'subId',
							cond: { $ne: ['$$subId', null] }
						}
					}
				}
			}
		]);
		
		// Extract category and subcategory IDs from aggregation result
		// MongoDB aggregation returns ObjectIds, so we can use them directly
		const categoryIds = aggregationResult.length > 0 
			? aggregationResult[0].categoryIds
			: [];
		const subcategoryIds = aggregationResult.length > 0
			? aggregationResult[0].subcategoryIds
			: [];
		
		// Build filter for categories - use ObjectIds directly
		const filter = categoryIds.length > 0 ? { _id: { $in: categoryIds } } : { _id: { $in: [] } };
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ slug: { $regex: q, $options: 'i' } },
			];
		}
		
		// Get categories that have products
		const categories = await Category.find(filter).lean();
		
		// Filter subcategories to only include those that have products
		// Convert subcategoryIds to strings for comparison
		const subcategoryIdStrings = subcategoryIds.map(id => id.toString());
		const filteredCategories = categories.map(category => {
			const filteredSubcategories = category.subcategories.filter(subcat => 
				subcategoryIdStrings.includes(subcat._id.toString())
			);
			return {
				...category,
				subcategories: filteredSubcategories
			};
		});
		
		return res.json(filteredCategories);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = {
	createCategory,
	listCategories,
	listCategoriesWithProducts,
	getCategory,
	getCategoryBySlug,
	updateCategory,
	deleteCategory,
	addSubcategory,
	updateSubcategory,
	deleteSubcategory,
};


