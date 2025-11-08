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
		
		// Find all unique category IDs that have products
		const productsWithCategories = await Product.find({ isVisible: true })
			.select('category subcategoryId')
			.lean();
		
		const categoryIds = new Set();
		const subcategoryIds = new Set();
		
		productsWithCategories.forEach(product => {
			if (product.category) {
				categoryIds.add(product.category.toString());
			}
			if (product.subcategoryId) {
				subcategoryIds.add(product.subcategoryId.toString());
			}
		});
		
		// Build filter for categories
		const filter = { _id: { $in: Array.from(categoryIds) } };
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ slug: { $regex: q, $options: 'i' } },
			];
		}
		
		// Get categories that have products
		const categories = await Category.find(filter).lean();
		
		// Filter subcategories to only include those that have products
		const filteredCategories = categories.map(category => {
			const filteredSubcategories = category.subcategories.filter(subcat => 
				subcategoryIds.has(subcat._id.toString())
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


