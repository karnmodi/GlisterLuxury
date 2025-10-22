const ProductConfiguration = require('../models/ProductConfiguration');
const { computePriceAndValidate } = require('../utils/pricing');

async function previewPrice(req, res) {
	try {
		const result = await computePriceAndValidate(req.body);
		return res.json({ unitPrice: result.unitPrice, totalAmount: result.totalAmount, breakdown: result.breakdown });
	} catch (err) {
		return res.status(err.status || 400).json({ message: err.message });
	}
}

async function createConfiguration(req, res) {
	try {
		const { product, breakdown, unitPrice, totalAmount } = await computePriceAndValidate(req.body);
		const { selectedMaterial, selectedSize, selectedFinishes = [], quantity = 1, productID } = req.body;

		const config = await ProductConfiguration.create({
			productID,
			selectedMaterial,
			selectedSize,
			selectedFinishes,
			quantity,
			sizeCost: breakdown.size,
			finishTotalCost: breakdown.finishes,
			totalAmount,
		});
		return res.status(201).json(config);
	} catch (err) {
		return res.status(err.status || 400).json({ message: err.message });
	}
}

async function getConfiguration(req, res) {
	try {
		const item = await ProductConfiguration.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listConfigurations(req, res) {
	try {
		const { productID, userID } = req.query;
		const filter = {};
		if (productID) filter.productID = productID;
		if (userID) filter.userID = userID;
		const items = await ProductConfiguration.find(filter).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = { previewPrice, createConfiguration, getConfiguration, listConfigurations };


