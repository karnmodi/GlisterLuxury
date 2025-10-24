const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

async function createProduct(req, res) {
	try {
		const product = await Product.create(req.body);
		return res.status(201).json(product);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listProducts(req, res) {
	try {
		const { q, material, hasSize, finishId, category, subcategoryId } = req.query;
		const filter = {};
		if (q) filter.$or = [
			{ name: { $regex: q, $options: 'i' } },
			{ productID: { $regex: q, $options: 'i' } },
			{ productUID: { $regex: q, $options: 'i' } },
		];
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };
		if (finishId) filter.finishes = { $in: [finishId] };
		if (category) filter.category = category;
		if (subcategoryId) filter.subcategoryId = subcategoryId;
		const items = await Product.find(filter).populate('category', 'name slug').lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getProduct(req, res) {
	try {
		const item = await Product.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateProduct(req, res) {
	try {
		const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteProduct(req, res) {
	try {
		const result = await Product.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Not found' });
		return res.json({ message: 'Deleted' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Upload multiple images for a product
 * POST /api/products/:id/images
 */
async function uploadProductImages(req, res) {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: 'No images provided' });
		}

		// Upload all images to Cloudinary
		const uploadPromises = req.files.map((file) =>
			uploadToCloudinary(file.buffer, {
				folder: `glister/products/${product.productID}`,
			})
		);

		const uploadResults = await Promise.all(uploadPromises);
		
		// Extract secure URLs from upload results
		const imageUrls = uploadResults.map((result) => result.secure_url);

		// Add new image URLs to the product
		product.imageURLs.push(...imageUrls);
		await product.save();

		return res.status(200).json({
			message: 'Images uploaded successfully',
			images: imageUrls,
			product: product,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Delete a specific image from a product
 * DELETE /api/products/:id/images
 */
async function deleteProductImage(req, res) {
	try {
		const { imageUrl } = req.body;
		
		if (!imageUrl) {
			return res.status(400).json({ message: 'Image URL is required' });
		}

		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Check if the image exists in the product
		const imageIndex = product.imageURLs.indexOf(imageUrl);
		if (imageIndex === -1) {
			return res.status(404).json({ message: 'Image not found in product' });
		}

		// Extract public_id from Cloudinary URL
		// URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
		const urlParts = imageUrl.split('/');
		const fileWithExt = urlParts[urlParts.length - 1];
		const publicId = `glister/products/${product.productID}/${fileWithExt.split('.')[0]}`;

		// Delete from Cloudinary
		await deleteFromCloudinary(publicId);

		// Remove from product
		product.imageURLs.splice(imageIndex, 1);
		await product.save();

		return res.status(200).json({
			message: 'Image deleted successfully',
			product: product,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

module.exports = { 
	createProduct, 
	listProducts, 
	getProduct, 
	updateProduct, 
	deleteProduct,
	uploadProductImages,
	deleteProductImage,
};


