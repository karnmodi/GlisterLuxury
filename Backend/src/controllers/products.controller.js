const Product = require('../models/Product');

async function createProduct(req, res) {
	try {
		const product = await Product.create(req.body);
		return res.status(201).json(product);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listProducts(req, res) {
	try {
		const { q, material, hasSize, finishId, category, subcategoryId } = req.query;
		const filter = {};
		if (q) filter.$or = [
			{ name: { $regex: q, $options: 'i' } },
			{ productID: { $regex: q, $options: 'i' } },
			{ productUID: { $regex: q, $options: 'i' } },
		];
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };
		if (finishId) filter.finishes = { $in: [finishId] };
		if (category) filter.category = category;
		if (subcategoryId) filter.subcategoryId = subcategoryId;
		const items = await Product.find(filter).populate('category', 'name slug').lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getProduct(req, res) {
	try {
		const item = await Product.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateProduct(req, res) {
	try {
		const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteProduct(req, res) {
	try {
		const result = await Product.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Not found' });
		return res.json({ message: 'Deleted' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { createProduct, listProducts, getProduct, updateProduct, deleteProduct };


