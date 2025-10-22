const Finish = require('../models/Finish');

async function createFinish(req, res) {
	try {
		const item = await Finish.create(req.body);
		return res.status(201).json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listFinishes(req, res) {
	try {
		const items = await Finish.find().lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getFinish(req, res) {
	try {
		const item = await Finish.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateFinish(req, res) {
	try {
		const item = await Finish.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteFinish(req, res) {
	try {
		const result = await Finish.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Not found' });
		return res.json({ message: 'Deleted' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { createFinish, listFinishes, getFinish, updateFinish, deleteFinish };


