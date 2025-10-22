const mongoose = require('mongoose');
const Product = require('../models/Product');

function toNumber(decimal128) {
	if (decimal128 == null) return 0;
	if (typeof decimal128 === 'number') return decimal128;
	try { return parseFloat(decimal128.toString()); } catch (e) { return 0; }
}

async function computePriceAndValidate(payload) {
	const { productID, selectedMaterial, selectedSize, selectedFinishes = [], quantity = 1, includePackaging = true } = payload;

	const product = await Product.findById(productID).lean();
	if (!product) {
		throw Object.assign(new Error('Product not found'), { status: 404 });
	}

	// Validate material exists on product by id or name
	const materialMatch = product.materials.find(m => {
		if (selectedMaterial.materialID && m.materialID && String(m.materialID) === String(selectedMaterial.materialID)) return true;
		return m.name.toLowerCase() === String(selectedMaterial.name || '').toLowerCase();
	});
	if (!materialMatch) {
		throw Object.assign(new Error('Selected material not available for product'), { status: 400 });
	}

	const materialCost = toNumber(selectedMaterial.basePrice ?? materialMatch.basePrice);

	// Validate size if provided
	let sizeCost = 0;
	if (selectedSize != null) {
		const sizeOption = (materialMatch.sizeOptions || []).find(s => Number(s.sizeMM) === Number(selectedSize));
		if (!sizeOption) {
			throw Object.assign(new Error('Selected size not available for chosen material'), { status: 400 });
		}
		sizeCost = toNumber(sizeOption.additionalCost);
	}

	// Validate finishes are allowed for this product and calculate finish costs
	let finishTotalCost = 0;
	for (const fid of selectedFinishes) {
		const finishOption = (product.finishes || []).find(f => String(f.finishID) === String(fid));
		if (!finishOption) {
			throw Object.assign(new Error('One or more selected finishes are not allowed for this product'), { status: 400 });
		}
		finishTotalCost += toNumber(finishOption.priceAdjustment);
	}

	const packagingPrice = includePackaging ? toNumber(product.packagingPrice) : 0;
	const unitPrice = materialCost + sizeCost + finishTotalCost + packagingPrice;
	const totalAmount = unitPrice * Number(quantity || 1);

	return {
		product,
		breakdown: {
			material: materialCost,
			size: sizeCost,
			finishes: finishTotalCost,
			packaging: packagingPrice,
		},
		unitPrice,
		totalAmount,
		resolved: { materialMatch },
		includePackaging
	};
}

module.exports = { computePriceAndValidate, toNumber };


