const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * Transform MongoDB types to JSON-serializable types
 * Handles: ObjectId → string, Decimal128 → number, Map → object
 */
function transformMongoTypes(obj) {
	if (!obj) return obj;

	// Handle ObjectId - check for _bsontype or constructor name
	if (obj._bsontype === 'ObjectId' || obj.constructor?.name === 'ObjectId') {
		return obj.toString();
	}

	// Handle Decimal128
	if (obj.constructor?.name === 'Decimal128') {
		return parseFloat(obj.toString());
	}

	// Handle Arrays
	if (Array.isArray(obj)) {
		return obj.map(transformMongoTypes);
	}

	// Handle Map
	if (obj instanceof Map) {
		const plain = {};
		for (const [key, value] of obj.entries()) {
			plain[key] = transformMongoTypes(value);
		}
		return plain;
	}

	// Handle plain objects (but not Date, Buffer, etc.)
	if (typeof obj === 'object' && obj.constructor?.name === 'Object') {
		const transformed = {};
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				transformed[key] = transformMongoTypes(obj[key]);
			}
		}
		return transformed;
	}

	return obj;
}

async function createProduct(req, res) {
	try {
		// Ensure materials have proper ObjectId conversion
		if (req.body.materials && Array.isArray(req.body.materials)) {
			req.body.materials = req.body.materials.map(material => {
				// Handle materialID conversion - it might be an object or string
				let materialID = material.materialID;
				if (typeof materialID === 'object' && materialID !== null) {
					materialID = materialID._id || materialID.toString();
				}
				if (typeof materialID !== 'string') {
					materialID = String(materialID);
				}
				
				return {
					...material,
					materialID: materialID,
					basePrice: parseFloat(material.basePrice) || 0,
					sizeOptions: (material.sizeOptions || []).map(size => ({
						sizeMM: parseInt(size.sizeMM) || 0,
						additionalCost: parseFloat(size.additionalCost) || 0,
						isOptional: Boolean(size.isOptional)
					}))
				};
			});
		}

		// Ensure finishes have proper ObjectId conversion
		if (req.body.finishes && Array.isArray(req.body.finishes)) {
			req.body.finishes = req.body.finishes.map(finish => {
				// Handle finishID conversion - it might be an object or string
				let finishID = finish.finishID;
				if (typeof finishID === 'object' && finishID !== null) {
					finishID = finishID._id || finishID.toString();
				}
				if (typeof finishID !== 'string') {
					finishID = String(finishID);
				}
				
				return {
					...finish,
					finishID: finishID,
					priceAdjustment: parseFloat(finish.priceAdjustment) || 0
				};
			});
		}

		// Ensure packagingPrice is properly converted
		if (req.body.packagingPrice !== undefined) {
			req.body.packagingPrice = parseFloat(req.body.packagingPrice) || 0;
		}

		const product = await Product.create(req.body);

		const transformedProduct = transformMongoTypes(product.toObject());
		return res.status(201).json(transformedProduct);
	} catch (err) {
		console.error('Product creation error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function listProducts(req, res) {
	try {
		const { q, material, hasSize, finishId, category, subcategory, subcategoryId } = req.query;
		const Category = require('../models/Category');
		const filter = {};

		// Search query
		if (q) filter.$or = [
			{ name: { $regex: q, $options: 'i' } },
			{ productID: { $regex: q, $options: 'i' } },
			{ productUID: { $regex: q, $options: 'i' } },
		];

		// Material filter
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };

		// Size filter
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };

		// Finish filter
		if (finishId) filter.finishes = { $in: [finishId] };

		// Category filter - support both ID and slug
		if (category) {
			// Check if category is an ObjectId or slug
			const mongoose = require('mongoose');
			if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
				// It's an ObjectId
				filter.category = category;
			} else {
				// It's a slug - need to look up the category ID
				const categoryDoc = await Category.findOne({ slug: category });
				if (categoryDoc) {
					filter.category = categoryDoc._id;
				} else {
					// Category slug not found - return empty results
					return res.json([]);
				}
			}
		}

		// Subcategory filter - support both ID and slug
		if (subcategory || subcategoryId) {
			const subcategoryValue = subcategory || subcategoryId;
			const mongoose = require('mongoose');

			if (mongoose.Types.ObjectId.isValid(subcategoryValue) && subcategoryValue.length === 24) {
				// It's an ObjectId
				filter.subcategoryId = subcategoryValue;
			} else {
				// It's a slug - need to find the subcategory ID from the category
				// First, we need to find which category contains this subcategory
				const categoryWithSubcategory = await Category.findOne({
					'subcategories.slug': subcategoryValue
				});

				if (categoryWithSubcategory) {
					const subcategoryDoc = categoryWithSubcategory.subcategories.find(
						sub => sub.slug === subcategoryValue
					);
					if (subcategoryDoc) {
						filter.subcategoryId = subcategoryDoc._id;
					}
				} else {
					// Subcategory slug not found - return empty results
					return res.json([]);
				}
			}
		}

		const items = await Product.find(filter).populate('category', 'name slug description subcategories').lean();

		const transformedItems = items.map(item => transformMongoTypes(item));
		return res.json(transformedItems);
	} catch (err) {
		console.error('List products error:', err);
		return res.status(500).json({ message: err.message });
	}
}

async function getProduct(req, res) {
	try {
		const item = await Product.findById(req.params.id)
			.populate('category', 'name slug description subcategories')
			.lean();
		if (!item) return res.status(404).json({ message: 'Not found' });

		// Add subcategory details if subcategoryId exists
		if (item.subcategoryId && item.category && item.category.subcategories) {
			const subcategory = item.category.subcategories.find(
				sub => sub._id.toString() === item.subcategoryId.toString()
			);
			if (subcategory) {
				item.subcategory = {
					_id: subcategory._id,
					name: subcategory.name,
					slug: subcategory.slug,
					description: subcategory.description
				};
			}
		}

		const transformedItem = transformMongoTypes(item);
		return res.json(transformedItem);
	} catch (err) {
		console.error('Product fetch error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function updateProduct(req, res) {
	try {
		const productId = req.params.id;
		
		// Get the existing product to compare images
		const existingProduct = await Product.findById(productId);
		if (!existingProduct) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Handle image URLs update - identify images to delete
		if (req.body.imageURLs !== undefined) {
			// Convert new imageURLs to a Set of URLs for comparison
			const newImageUrls = new Set();
			
			if (typeof req.body.imageURLs === 'object' && req.body.imageURLs !== null) {
				// Handle both Map-like objects and plain objects
				const imageMap = req.body.imageURLs;
				for (const key in imageMap) {
					if (imageMap.hasOwnProperty(key)) {
						const imageData = imageMap[key];
						if (typeof imageData === 'object' && imageData.url) {
							newImageUrls.add(imageData.url);
						} else if (typeof imageData === 'string') {
							newImageUrls.add(imageData);
						}
					}
				}
			}

			// Find images that were removed (exist in old but not in new)
			const imagesToDelete = [];
			for (const [key, imageData] of existingProduct.imageURLs.entries()) {
				if (!newImageUrls.has(imageData.url)) {
					imagesToDelete.push({ key, imageData });
				}
			}

			// Delete removed images from Cloudinary
			if (imagesToDelete.length > 0) {
				const deletePromises = imagesToDelete.map(({ imageData }) => {
					try {
						// Extract public_id from Cloudinary URL
						const urlParts = imageData.url.split('/');
						const fileWithExt = urlParts[urlParts.length - 1];
						const fileNameWithoutExt = fileWithExt.split('.')[0];
						const publicId = `glister/products/${existingProduct.productID}/${fileNameWithoutExt}`;
						
						return deleteFromCloudinary(publicId);
					} catch (err) {
						console.error('Error extracting public_id:', err);
						return Promise.resolve(); // Continue even if extraction fails
					}
				});

				await Promise.all(deletePromises);
			}

			// Update imageURLs to new format if provided
			if (typeof req.body.imageURLs === 'object' && req.body.imageURLs !== null) {
				// Replace the entire Map with new values
				existingProduct.imageURLs.clear();
				for (const key in req.body.imageURLs) {
					if (req.body.imageURLs.hasOwnProperty(key)) {
						const imageData = req.body.imageURLs[key];
						existingProduct.imageURLs.set(key, {
							url: typeof imageData === 'string' ? imageData : imageData.url,
							mappedFinishID: typeof imageData === 'object' ? (imageData.mappedFinishID || null) : null
						});
					}
				}
			}

			// Remove imageURLs from req.body since we're handling it separately
			delete req.body.imageURLs;
		}

		// Ensure materials have proper ObjectId conversion
		if (req.body.materials && Array.isArray(req.body.materials)) {
			req.body.materials = req.body.materials.map(material => {
				// Handle materialID conversion - it might be an object or string
				let materialID = material.materialID;
				if (typeof materialID === 'object' && materialID !== null) {
					materialID = materialID._id || materialID.toString();
				}
				if (typeof materialID !== 'string') {
					materialID = String(materialID);
				}
				
				return {
					...material,
					materialID: materialID,
					basePrice: parseFloat(material.basePrice) || 0,
					sizeOptions: (material.sizeOptions || []).map(size => ({
						sizeMM: parseInt(size.sizeMM) || 0,
						additionalCost: parseFloat(size.additionalCost) || 0,
						isOptional: Boolean(size.isOptional)
					}))
				};
			});
		}

		// Ensure finishes have proper ObjectId conversion
		if (req.body.finishes && Array.isArray(req.body.finishes)) {
			req.body.finishes = req.body.finishes.map(finish => {
				// Handle finishID conversion - it might be an object or string
				let finishID = finish.finishID;
				if (typeof finishID === 'object' && finishID !== null) {
					finishID = finishID._id || finishID.toString();
				}
				if (typeof finishID !== 'string') {
					finishID = String(finishID);
				}
				
				return {
					...finish,
					finishID: finishID,
					priceAdjustment: parseFloat(finish.priceAdjustment) || 0
				};
			});
		}

		// Ensure packagingPrice is properly converted
		if (req.body.packagingPrice !== undefined) {
			req.body.packagingPrice = parseFloat(req.body.packagingPrice) || 0;
		}

		// Update other fields
		Object.assign(existingProduct, req.body);
		await existingProduct.save();

		const transformedItem = transformMongoTypes(existingProduct.toObject());
		return res.json(transformedItem);
	} catch (err) {
		console.error('Product update error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function deleteProduct(req, res) {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Delete all images from Cloudinary
		if (product.imageURLs && product.imageURLs.size > 0) {
			const deletePromises = [];
			for (const [key, imageData] of product.imageURLs.entries()) {
				try {
					// Extract public_id from Cloudinary URL
					const urlParts = imageData.url.split('/');
					const fileWithExt = urlParts[urlParts.length - 1];
					const fileNameWithoutExt = fileWithExt.split('.')[0];
					const publicId = `glister/products/${product.productID}/${fileNameWithoutExt}`;
					
					deletePromises.push(deleteFromCloudinary(publicId));
				} catch (err) {
					console.error('Error extracting public_id:', err);
				}
			}
			
			// Wait for all image deletions to complete
			await Promise.all(deletePromises);
		}

		// Delete the product from database
		const result = await Product.findByIdAndDelete(req.params.id);
		return res.json({ message: 'Product and associated images deleted successfully' });
	} catch (err) {
		console.error('Product deletion error:', err);
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

		// Add new image URLs to the product as Map entries
		imageUrls.forEach((url, index) => {
			const imageKey = `image_${Date.now()}_${index}`;
			product.imageURLs.set(imageKey, {
				url: url,
				mappedFinishID: null
			});
		});
		
		await product.save();

		const transformedProduct = transformMongoTypes(product.toObject());

		return res.status(200).json({
			message: 'Images uploaded successfully',
			images: imageUrls,
			product: transformedProduct,
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

		// Find the image key in the product's imageURLs Map
		let imageKeyToDelete = null;
		for (const [key, imageData] of product.imageURLs.entries()) {
			if (imageData.url === imageUrl) {
				imageKeyToDelete = key;
				break;
			}
		}

		if (!imageKeyToDelete) {
			return res.status(404).json({ message: 'Image not found in product' });
		}

		// Extract public_id from Cloudinary URL
		// URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
		const urlParts = imageUrl.split('/');
		const fileWithExt = urlParts[urlParts.length - 1];
		const publicId = `glister/products/${product.productID}/${fileWithExt.split('.')[0]}`;

		// Delete from Cloudinary
		await deleteFromCloudinary(publicId);

		// Remove from product's imageURLs Map
		product.imageURLs.delete(imageKeyToDelete);
		
		await product.save();

		const transformedProduct = transformMongoTypes(product.toObject());

		return res.status(200).json({
			message: 'Image deleted successfully',
			product: transformedProduct,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Update image-finish mapping for a product
 * PUT /api/products/:id/images/mapping
 */
async function updateImageFinishMapping(req, res) {
	try {
		const { imageUrl, mappedFinishID } = req.body;
		
		if (!imageUrl) {
			return res.status(400).json({ message: 'Image URL is required' });
		}

		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Find the image key in the product's imageURLs Map
		let imageKeyToUpdate = null;
		for (const [key, imageData] of product.imageURLs.entries()) {
			if (imageData.url === imageUrl) {
				imageKeyToUpdate = key;
				break;
			}
		}

		if (!imageKeyToUpdate) {
			return res.status(404).json({ message: 'Image not found in product' });
		}

		// Update the mapping
		const imageData = product.imageURLs.get(imageKeyToUpdate);
		imageData.mappedFinishID = mappedFinishID || null;
		product.imageURLs.set(imageKeyToUpdate, imageData);
		await product.save();

		const transformedProduct = transformMongoTypes(product.toObject());

		return res.status(200).json({
			message: 'Image-finish mapping updated successfully',
			product: transformedProduct,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * List products with minimal data for product listing page
 * Returns only essential fields: id, productID, name, description,
 * materialsCount, and up to 2 images (default + hover)
 * GET /api/products/listing
 */
async function listProductsMinimal(req, res) {
	try {
		const { q, material, hasSize, finishId, category, subcategory, subcategoryId } = req.query;
		const Category = require('../models/Category');
		const filter = {};

		// Search query
		if (q) filter.$or = [
			{ name: { $regex: q, $options: 'i' } },
			{ productID: { $regex: q, $options: 'i' } },
			{ productUID: { $regex: q, $options: 'i' } },
		];

		// Material filter
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };

		// Size filter
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };

		// Finish filter
		if (finishId) filter.finishes = { $in: [finishId] };

		// Category filter - support both ID and slug
		if (category) {
			const mongoose = require('mongoose');
			if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
				filter.category = category;
			} else {
				const categoryDoc = await Category.findOne({ slug: category });
				if (categoryDoc) {
					filter.category = categoryDoc._id;
				} else {
					return res.json([]);
				}
			}
		}

		// Subcategory filter - support both ID and slug
		if (subcategory || subcategoryId) {
			const subcategoryValue = subcategory || subcategoryId;
			const mongoose = require('mongoose');

			if (mongoose.Types.ObjectId.isValid(subcategoryValue) && subcategoryValue.length === 24) {
				filter.subcategoryId = subcategoryValue;
			} else {
				const categoryWithSubcategory = await Category.findOne({
					'subcategories.slug': subcategoryValue
				});

				if (categoryWithSubcategory) {
					const subcategoryDoc = categoryWithSubcategory.subcategories.find(
						sub => sub.slug === subcategoryValue
					);
					if (subcategoryDoc) {
						filter.subcategoryId = subcategoryDoc._id;
					}
				} else {
					return res.json([]);
				}
			}
		}

		// Fetch products with only necessary fields
		const items = await Product.find(filter)
			.select('_id productID name description imageURLs materials')
			.lean();

		// Transform to minimal format
		const minimalProducts = items.map(item => {
			// Extract images
			const imageURLsArray = item.imageURLs ? Object.values(item.imageURLs) : [];

			// Find default image (mappedFinishID is null)
			const defaultImage = imageURLsArray.find(img => img.mappedFinishID === null);

			// Find first finish-specific image for hover
			const hoverImage = imageURLsArray.find(img => img.mappedFinishID !== null);

			return {
				_id: item._id.toString(),
				productID: item.productID,
				name: item.name,
				description: item.description || '',
				materialsCount: item.materials ? item.materials.length : 0,
				thumbnailImage: defaultImage?.url || imageURLsArray[0]?.url || null,
				hoverImage: hoverImage?.url || null,
				hoverImageFinishId: hoverImage?.mappedFinishID?.toString() || null
			};
		});

		return res.json(minimalProducts);
	} catch (err) {
		console.error('List products minimal error:', err);
		return res.status(500).json({ message: err.message });
	}
}

module.exports = {
	createProduct,
	listProducts,
	listProductsMinimal,
	getProduct,
	updateProduct,
	deleteProduct,
	uploadProductImages,
	deleteProductImage,
	updateImageFinishMapping,
};


