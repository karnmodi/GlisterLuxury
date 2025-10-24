const Finish = require('../models/Finish');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

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

/**
 * Upload a single image for a finish
 * POST /api/finishes/:id/image
 */
async function uploadFinishImage(req, res) {
	try {
		const finish = await Finish.findById(req.params.id);
		if (!finish) {
			return res.status(404).json({ message: 'Finish not found' });
		}

		if (!req.file) {
			return res.status(400).json({ message: 'No image provided' });
		}

		// Delete old image from Cloudinary if exists
		if (finish.photoURL) {
			try {
				const urlParts = finish.photoURL.split('/');
				const fileWithExt = urlParts[urlParts.length - 1];
				const publicId = `glister/finishes/${finish._id}/${fileWithExt.split('.')[0]}`;
				await deleteFromCloudinary(publicId);
			} catch (deleteErr) {
				console.error('Error deleting old image:', deleteErr);
				// Continue even if deletion fails
			}
		}

		// Upload new image to Cloudinary
		const uploadResult = await uploadToCloudinary(req.file.buffer, {
			folder: `glister/finishes/${finish._id}`,
		});

		// Update finish with new image URL
		finish.photoURL = uploadResult.secure_url;
		await finish.save();

		return res.status(200).json({
			message: 'Image uploaded successfully',
			imageUrl: uploadResult.secure_url,
			finish: finish,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Delete the image from a finish
 * DELETE /api/finishes/:id/image
 */
async function deleteFinishImage(req, res) {
	try {
		const finish = await Finish.findById(req.params.id);
		if (!finish) {
			return res.status(404).json({ message: 'Finish not found' });
		}

		if (!finish.photoURL) {
			return res.status(404).json({ message: 'No image found for this finish' });
		}

		// Extract public_id from Cloudinary URL
		const urlParts = finish.photoURL.split('/');
		const fileWithExt = urlParts[urlParts.length - 1];
		const publicId = `glister/finishes/${finish._id}/${fileWithExt.split('.')[0]}`;

		// Delete from Cloudinary
		await deleteFromCloudinary(publicId);

		// Remove from finish
		finish.photoURL = null;
		await finish.save();

		return res.status(200).json({
			message: 'Image deleted successfully',
			finish: finish,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = { 
	createFinish, 
	listFinishes, 
	getFinish, 
	updateFinish, 
	deleteFinish,
	uploadFinishImage,
	deleteFinishImage,
};


