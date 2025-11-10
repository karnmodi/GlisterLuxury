const Blog = require('../models/Blog');

async function createBlog(req, res) {
	try {
		const blog = await Blog.create(req.body);
		return res.status(201).json(blog);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listBlogs(req, res) {
	try {
		const { tags, isActive, sortBy, q } = req.query;
		const filter = {};
		
		// Tags filter - support comma-separated tags
		if (tags) {
			const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
			filter.tags = { $in: tagArray };
		}
		
		// Search filter
		if (q) {
			filter.$or = [
				{ title: { $regex: q, $options: 'i' } },
				{ content: { $regex: q, $options: 'i' } },
				{ shortDescription: { $regex: q, $options: 'i' } },
				{ tags: { $regex: q, $options: 'i' } },
			];
		}
		
		// Active filter - if user is not admin, only show active items
		if (!req.user || req.user.role !== 'admin') {
			filter.isActive = true;
		} else if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		// Build sort object
		let sort = { order: 1, createdAt: -1 }; // Default sort by order, then creation date
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
				case 'title':
					sort = { title: 1 };
					break;
				case 'title-desc':
					sort = { title: -1 };
					break;
			}
		}
		
		const items = await Blog.find(filter).sort(sort).lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getBlog(req, res) {
	try {
		const item = await Blog.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Blog article not found' });
		// If user is not admin and item is not active, return 404
		if ((!req.user || req.user.role !== 'admin') && !item.isActive) {
			return res.status(404).json({ message: 'Blog article not found' });
		}
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateBlog(req, res) {
	try {
		const item = await Blog.findByIdAndUpdate(
			req.params.id, 
			req.body, 
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'Blog article not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteBlog(req, res) {
	try {
		const result = await Blog.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Blog article not found' });
		return res.json({ message: 'Blog article deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function reorderBlogs(req, res) {
	try {
		const { orderedIds } = req.body;
		
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return res.status(400).json({ message: 'orderedIds must be a non-empty array' });
		}

		// Update the order field for each item
		const updatePromises = orderedIds.map((id, index) => 
			Blog.findByIdAndUpdate(id, { order: index }, { new: true })
		);

		await Promise.all(updatePromises);

		return res.json({ message: 'Blog articles reordered successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = { createBlog, listBlogs, getBlog, updateBlog, deleteBlog, reorderBlogs };


