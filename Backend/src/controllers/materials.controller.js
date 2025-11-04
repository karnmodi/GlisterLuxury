const MaterialMaster = require('../models/MaterialMaster');

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

module.exports = { 
	createMaterial, 
	listMaterials, 
	updateMaterial, 
	deleteMaterial,
	getMaterialById
};


