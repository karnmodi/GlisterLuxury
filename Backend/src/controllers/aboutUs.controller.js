const AboutUs = require('../models/AboutUs');

async function createAboutUs(req, res) {
	try {
		const aboutUs = await AboutUs.create(req.body);
		return res.status(201).json(aboutUs);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listAboutUs(req, res) {
	try {
		const { section, isActive, sortBy, q } = req.query;
		const filter = {};
		
		// Section filter
		if (section) {
			filter.section = section;
		}
		
		// Search filter
		if (q) {
			filter.$or = [
				{ title: { $regex: q, $options: 'i' } },
				{ content: { $regex: q, $options: 'i' } },
				{ subtitle: { $regex: q, $options: 'i' } },
			];
		}
		
		// Active filter - if user is not admin, only show active items
		if (!req.user || req.user.role !== 'admin') {
			filter.isActive = true;
		} else if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		// Build sort object
		let sort = { section: 1, order: 1, createdAt: -1 }; // Default sort by section, then order, then creation date
		if (sortBy) {
			switch (sortBy) {
				case 'order':
					sort = { section: 1, order: 1 };
					break;
				case 'order-desc':
					sort = { section: 1, order: -1 };
					break;
				case 'created':
					sort = { createdAt: -1 };
					break;
				case 'updated':
					sort = { updatedAt: -1 };
					break;
				case 'section':
					sort = { section: 1, order: 1 };
					break;
			}
		}
		
		const items = await AboutUs.find(filter).sort(sort).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getAboutUs(req, res) {
	try {
		const item = await AboutUs.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'About Us content not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateAboutUs(req, res) {
	try {
		const item = await AboutUs.findByIdAndUpdate(
			req.params.id, 
			req.body, 
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'About Us content not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteAboutUs(req, res) {
	try {
		const result = await AboutUs.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'About Us content not found' });
		return res.json({ message: 'About Us content deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function reorderAboutUs(req, res) {
	try {
		const { orderedIds } = req.body;
		
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return res.status(400).json({ message: 'orderedIds must be a non-empty array' });
		}

		// Update the order field for each item
		const updatePromises = orderedIds.map((id, index) => 
			AboutUs.findByIdAndUpdate(id, { order: index }, { new: true })
		);

		await Promise.all(updatePromises);

		return res.json({ message: 'About Us content reordered successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { createAboutUs, listAboutUs, getAboutUs, updateAboutUs, deleteAboutUs, reorderAboutUs };

