const FAQ = require('../models/FAQ');

async function createFAQ(req, res) {
	try {
		const faq = await FAQ.create(req.body);
		return res.status(201).json(faq);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listFAQs(req, res) {
	try {
		const { q, isActive, sortBy } = req.query;
		const filter = {};
		
		// Search filter
		if (q) {
			filter.$or = [
				{ question: { $regex: q, $options: 'i' } },
				{ answer: { $regex: q, $options: 'i' } },
			];
		}
		
		// Active filter
		if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		// Build sort object
		let sort = { order: 1, createdAt: -1 }; // Default sort by order, then by creation date
		if (sortBy) {
			switch (sortBy) {
				case 'order':
					sort = { order: 1 };
					break;
				case 'order-desc':
					sort = { order: -1 };
					break;
				case 'created':
					sort = { createdAt: -1 };
					break;
				case 'updated':
					sort = { updatedAt: -1 };
					break;
				case 'question':
					sort = { question: 1 };
					break;
			}
		}
		
		const items = await FAQ.find(filter).sort(sort).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getFAQ(req, res) {
	try {
		const item = await FAQ.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'FAQ not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateFAQ(req, res) {
	try {
		const item = await FAQ.findByIdAndUpdate(
			req.params.id, 
			req.body, 
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'FAQ not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteFAQ(req, res) {
	try {
		const result = await FAQ.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'FAQ not found' });
		return res.json({ message: 'FAQ deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function reorderFAQs(req, res) {
	try {
		const { orderedIds } = req.body;
		
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return res.status(400).json({ message: 'orderedIds must be a non-empty array' });
		}

		// Update the order field for each FAQ
		const updatePromises = orderedIds.map((id, index) => 
			FAQ.findByIdAndUpdate(id, { order: index }, { new: true })
		);

		await Promise.all(updatePromises);

		return res.json({ message: 'FAQs reordered successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { createFAQ, listFAQs, getFAQ, updateFAQ, deleteFAQ, reorderFAQs };
