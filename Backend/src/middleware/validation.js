function isDecimalLike(v) {
	return typeof v === 'number' || typeof v === 'string';
}

function validateCreateProduct(req, res, next) {
	const { productID, name, packagingPrice, materials } = req.body || {};
	if (!productID || !name) return res.status(400).json({ message: 'productID and name are required' });
	if (packagingPrice != null && !isDecimalLike(packagingPrice)) return res.status(400).json({ message: 'packagingPrice must be a number/string' });
	
	// Validate that sizeOptions have names if materials are provided
	if (materials && Array.isArray(materials)) {
		for (const material of materials) {
			if (material.sizeOptions && Array.isArray(material.sizeOptions) && material.sizeOptions.length > 0) {
				for (const sizeOption of material.sizeOptions) {
					if (!sizeOption.name || typeof sizeOption.name !== 'string' || sizeOption.name.trim() === '') {
						return res.status(400).json({ 
							message: 'Size name is required for all size options. Each size option must have a name along with sizeMM and additionalCost.' 
						});
					}
					if (sizeOption.sizeMM == null) {
						return res.status(400).json({ 
							message: 'sizeMM is required for all size options.' 
						});
					}
				}
			}
		}
	}
	
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

function validateCreateFAQ(req, res, next) {
	const { question, answer, linkType, linkUrl, order } = req.body || {};
	
	// Required fields
	if (!question || !answer) {
		return res.status(400).json({ message: 'question and answer are required' });
	}
	
	// Validate linkType enum
	if (linkType && !['internal', 'external', 'none'].includes(linkType)) {
		return res.status(400).json({ message: 'linkType must be one of: internal, external, none' });
	}
	
	// Validate linkUrl based on linkType
	if (linkType === 'internal' && linkUrl && !linkUrl.startsWith('/')) {
		return res.status(400).json({ message: 'Internal links must start with "/"' });
	}
	
	if (linkType === 'external' && linkUrl && !linkUrl.startsWith('http')) {
		return res.status(400).json({ message: 'External links must start with "http" or "https"' });
	}
	
	// Validate order is a number
	if (order != null && (!Number.isInteger(order) || order < 0)) {
		return res.status(400).json({ message: 'order must be a non-negative integer' });
	}
	
	return next();
}

module.exports = { validateCreateProduct, validateCreateFinish, validateCreateMaterial, validatePreviewPrice, validateCreateFAQ };


