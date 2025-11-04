const Announcement = require('../models/Announcement');

async function createAnnouncement(req, res) {
	try {
		const announcement = await Announcement.create(req.body);
		return res.status(201).json(announcement);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listAnnouncements(req, res) {
	try {
		const { q, isActive, sortBy, public: publicOnly } = req.query;
		const filter = {};
		
		// Search filter
		if (q) {
			filter.$or = [
				{ message: { $regex: q, $options: 'i' } },
			];
		}
		
		// Active filter
		if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		// Public filter - only show active announcements with valid dates
		if (publicOnly === 'true') {
			filter.isActive = true;
			const now = new Date();
			// Filter: no date restriction OR dates are valid (startDate <= now <= endDate)
			filter.$and = [
				{
					$or: [
						{ startDate: { $exists: false }, endDate: { $exists: false } },
						{ startDate: { $exists: false }, endDate: { $gte: now } },
						{ startDate: { $lte: now }, endDate: { $exists: false } },
						{ 
							startDate: { $exists: true, $lte: now }, 
							endDate: { $exists: true, $gte: now } 
						},
					]
				}
			];
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
				case 'message':
					sort = { message: 1 };
					break;
			}
		}
		
		const items = await Announcement.find(filter).sort(sort).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getAnnouncement(req, res) {
	try {
		const item = await Announcement.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Announcement not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateAnnouncement(req, res) {
	try {
		const item = await Announcement.findByIdAndUpdate(
			req.params.id, 
			req.body, 
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'Announcement not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteAnnouncement(req, res) {
	try {
		const result = await Announcement.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Announcement not found' });
		return res.json({ message: 'Announcement deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function reorderAnnouncements(req, res) {
	try {
		const { orderedIds } = req.body;
		
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return res.status(400).json({ message: 'orderedIds must be a non-empty array' });
		}

		// Update the order field for each announcement
		const updatePromises = orderedIds.map((id, index) => 
			Announcement.findByIdAndUpdate(id, { order: index }, { new: true })
		);

		await Promise.all(updatePromises);

		return res.json({ message: 'Announcements reordered successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { 
	createAnnouncement, 
	listAnnouncements, 
	getAnnouncement, 
	updateAnnouncement, 
	deleteAnnouncement, 
	reorderAnnouncements 
};

