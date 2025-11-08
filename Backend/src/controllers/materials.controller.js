const MaterialMaster = require('../models/MaterialMaster');
const Product = require('../models/Product');

async function createMaterial(req, res) {
	try {
		const item = await MaterialMaster.create(req.body);
		return res.status(201).json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listMaterials(req, res) {
	try {
		const items = await MaterialMaster.find().lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function updateMaterial(req, res) {
	try {
		const item = await MaterialMaster.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!item) {
			return res.status(404).json({ message: 'Material not found' });
		}
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteMaterial(req, res) {
	try {
		const item = await MaterialMaster.findByIdAndDelete(req.params.id);
		if (!item) {
			return res.status(404).json({ message: 'Material not found' });
		}
		return res.json({ message: 'Material deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function getMaterialById(req, res) {
	try {
		const item = await MaterialMaster.findById(req.params.id);
		if (!item) {
			return res.status(404).json({ message: 'Material not found' });
		}
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

// Get only materials that have products
async function listMaterialsWithProducts(req, res) {
	try {
		// Find all unique material IDs that are used in products
		const products = await Product.find({ isVisible: true })
			.select('materials')
			.lean();
		
		const materialIds = new Set();
		products.forEach(product => {
			if (product.materials && Array.isArray(product.materials)) {
				product.materials.forEach(material => {
					if (material.materialID) {
						materialIds.add(material.materialID.toString());
					}
				});
			}
		});
		
		// Get only materials that have products
		const items = await MaterialMaster.find({
			_id: { $in: Array.from(materialIds) }
		}).lean();
		
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = { 
	createMaterial, 
	listMaterials,
	listMaterialsWithProducts, 
	updateMaterial, 
	deleteMaterial,
	getMaterialById
};


