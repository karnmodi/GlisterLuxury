const Category = require('../models/Category');

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
		const item = await Category.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'Category not found' });
		return res.json(item);
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

module.exports = {
	createCategory,
	listCategories,
	getCategory,
	getCategoryBySlug,
	updateCategory,
	deleteCategory,
	addSubcategory,
	updateSubcategory,
	deleteSubcategory,
};


