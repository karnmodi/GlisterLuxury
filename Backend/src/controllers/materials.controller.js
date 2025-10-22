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

module.exports = { createMaterial, listMaterials };


