function isDecimalLike(v) {
	return typeof v === 'number' || typeof v === 'string';
}

function validateCreateProduct(req, res, next) {
	const { productID, name, packagingPrice } = req.body || {};
	if (!productID || !name) return res.status(400).json({ message: 'productID and name are required' });
	if (packagingPrice != null && !isDecimalLike(packagingPrice)) return res.status(400).json({ message: 'packagingPrice must be a number/string' });
	return next();
}

function validateCreateFinish(req, res, next) {
	const { name } = req.body || {};
	if (!name) return res.status(400).json({ message: 'name is required' });
	return next();
}

function validateCreateMaterial(req, res, next) {
	const { name } = req.body || {};
	if (!name) return res.status(400).json({ message: 'name is required' });
	return next();
}

function validatePreviewPrice(req, res, next) {
	const { productID, selectedMaterial, quantity } = req.body || {};
	if (!productID) return res.status(400).json({ message: 'productID is required' });
	if (!selectedMaterial || !selectedMaterial.name && !selectedMaterial.materialID) return res.status(400).json({ message: 'selectedMaterial with name or materialID is required' });
	if (selectedMaterial.basePrice != null && !isDecimalLike(selectedMaterial.basePrice)) return res.status(400).json({ message: 'selectedMaterial.basePrice must be a number/string' });
	if (quantity != null && (!Number.isInteger(quantity) || quantity < 1)) return res.status(400).json({ message: 'quantity must be an integer >= 1' });
	return next();
}

module.exports = { validateCreateProduct, validateCreateFinish, validateCreateMaterial, validatePreviewPrice };


