const Product = require('../models/Product');
const Finish = require('../models/Finish');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { setCorsHeaders } = require('../utils/corsHelper');

/**
 * Sanitize productID for use in Cloudinary public_id
 * Cloudinary public_id cannot contain special characters like &, spaces, etc.
 */
const sanitizeProductID = (productID) => {
	if (!productID) return '';
	return productID
		.replace(/\s+/g, '_')           // Replace spaces with underscores
		.replace(/[&<>#%{}|\\^~\[\]`]/g, '') // Remove invalid characters
		.replace(/__+/g, '_')           // Replace multiple underscores with single
		.replace(/^_+|_+$/g, '')        // Remove leading/trailing underscores
		.toLowerCase();
};

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

/**
 * Extract prefix and numeric part from productID
 * Handles any prefix pattern (M-, MP-, H-P-, ABC-, etc.)
 * @param {string} productID - The product ID (e.g., "M-101", "MP-1001", "H-P-200")
 * @returns {Object} - Object with prefix and numericPart
 */
function parseProductID(productID) {
	if (!productID || typeof productID !== 'string') {
		return { prefix: productID || '', numericPart: 0 };
	}

	const lastDashIndex = productID.lastIndexOf('-');
	
	// If no dash found, treat entire string as prefix
	if (lastDashIndex === -1) {
		return { prefix: productID, numericPart: 0 };
	}

	// Extract prefix: all parts before the last "-"
	const prefix = productID.substring(0, lastDashIndex);
	
	// Extract numeric part: last part after the last "-"
	const numericStr = productID.substring(lastDashIndex + 1);
	const numericPart = parseInt(numericStr, 10);
	
	// If numeric part is not a valid number, treat as 0
	return {
		prefix: prefix || productID,
		numericPart: isNaN(numericPart) ? 0 : numericPart
	};
}

/**
 * Sort products by category/subcategory, then by productID prefix and numeric part
 * Groups products by category and subcategoryId, then sorts within each group
 * @param {Array} products - Array of product objects
 * @returns {Array} - Sorted array of products
 */
function sortProductsByCategoryAndID(products) {
	if (!Array.isArray(products) || products.length === 0) {
		return products;
	}

	// Create a copy to avoid mutating the original array
	const sortedProducts = [...products];

	sortedProducts.sort((a, b) => {
		// Helper function to get category name
		const getCategoryName = (category) => {
			if (!category) return null;
			if (typeof category === 'string') return null; // If it's just an ID string, we can't get the name
			return category.name || null;
		};

		// Helper function to check if category is "Handles"
		const isHandlesCategory = (category) => {
			const categoryName = getCategoryName(category);
			return categoryName && categoryName.toLowerCase() === 'handles';
		};

		// 1. Compare by category - prioritize "Handles" category first
		const isHandlesA = isHandlesCategory(a.category);
		const isHandlesB = isHandlesCategory(b.category);
		
		if (isHandlesA !== isHandlesB) {
			// If one is Handles and the other isn't, Handles comes first
			return isHandlesA ? -1 : 1;
		}

		// If both are Handles or both are not Handles, continue with other sorting criteria
		// Parse productIDs to get prefix and numeric part
		const parsedA = parseProductID(a.productID);
		const parsedB = parseProductID(b.productID);
		
		// 2. Compare by productID prefix (alphabetically) - SECONDARY SORT
		// This ensures all products with same prefix (e.g., ARN, AUA, M, MP) are grouped together
		const prefixCompare = parsedA.prefix.localeCompare(parsedB.prefix);
		if (prefixCompare !== 0) {
			return prefixCompare;
		}

		// 3. Compare by numeric part (numerically) - TERTIARY SORT within same prefix
		// This ensures products with same prefix are sorted numerically (e.g., M-101, M-102, M-1001, M-1009, M-1010)
		const numA = Number(parsedA.numericPart) || 0;
		const numB = Number(parsedB.numericPart) || 0;
		const numericCompare = numA - numB;
		if (numericCompare !== 0) {
			return numericCompare;
		}

		// 4. Compare by category ID (or null) - QUATERNARY SORT
		// Only used when prefix and numeric part are the same
		const categoryA = a.category?._id?.toString() || a.category?.toString() || null;
		const categoryB = b.category?._id?.toString() || b.category?.toString() || null;
		
		if (categoryA !== categoryB) {
			if (categoryA === null) return 1; // null categories go last
			if (categoryB === null) return -1;
			return categoryA.localeCompare(categoryB);
		}

		// 5. Compare by subcategory ID (or null) - QUINARY SORT
		// Only used when prefix, numeric part, and category are the same
		const subcategoryA = a.subcategoryId?.toString() || null;
		const subcategoryB = b.subcategoryId?.toString() || null;
		
		if (subcategoryA !== subcategoryB) {
			if (subcategoryA === null) return 1; // null subcategories go last
			if (subcategoryB === null) return -1;
			return subcategoryA.localeCompare(subcategoryB);
		}

		// If everything is the same, maintain original order
		return 0;
	});

	return sortedProducts;
}

async function createProduct(req, res) {
	try {
		// Validate that sizeOptions have names
		if (req.body.materials && Array.isArray(req.body.materials)) {
			for (const material of req.body.materials) {
				if (material.sizeOptions && Array.isArray(material.sizeOptions)) {
					for (const sizeOption of material.sizeOptions) {
						if (!sizeOption.name || typeof sizeOption.name !== 'string' || sizeOption.name.trim() === '') {
							return res.status(400).json({ 
								message: 'Size name is required for all size options. Each size option must have a name, sizeMM, and additionalCost.' 
							});
						}
					}
				}
			}
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
						name: size.name.trim(),
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

		// Validate and normalize discountPercentage if provided
		if (req.body.discountPercentage !== undefined) {
			let dp = req.body.discountPercentage;
			dp = dp === null || dp === '' ? null : Number(dp);
			if (dp !== null) {
				if (Number.isNaN(dp)) {
					return res.status(400).json({ message: 'Invalid discountPercentage' });
				}
				if (dp < 0 || dp > 100) {
					return res.status(400).json({ message: 'discountPercentage must be between 0 and 100' });
				}
				req.body.discountPercentage = dp;
			} else {
				req.body.discountPercentage = null;
			}
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
		const { q, material, hasSize, finishId, category, subcategory, subcategoryId, sortBy, sortOrder, hasDiscount, limit, skip } = req.query;
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

		// Finish filter - finishes is an array of objects with finishID property
		if (finishId) {
			const mongoose = require('mongoose');
			if (mongoose.Types.ObjectId.isValid(finishId)) {
				filter['finishes.finishID'] = new mongoose.Types.ObjectId(finishId);
			}
		}

		// Discount filter
		if (hasDiscount === 'true') {
			filter.discountPercentage = { $gt: 0 };
		}

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

		// Parse pagination parameters
		const limitNum = limit ? parseInt(limit, 10) : undefined;
		const skipNum = skip ? parseInt(skip, 10) : undefined;

		// Build query - fetch all matching products first (without pagination)
		// We need to fetch all products to sort them properly by category/subcategory and productID
		let query = Product.find(filter)
			.populate('category', 'name slug description subcategories');

		// Fetch all matching products
		const allItems = await query.lean();

		// Apply category-based and productID-based sorting
		const sortedItems = sortProductsByCategoryAndID(allItems);

		// Apply other sorting options if specified (name, price, createdAt)
		// These will be applied after category/productID sorting
		if (sortBy && sortBy !== 'productID') {
			const order = sortOrder === 'asc' ? 1 : -1;
			sortedItems.sort((a, b) => {
				let aValue, bValue;
				
				if (sortBy === 'name') {
					aValue = a.name?.toLowerCase() || '';
					bValue = b.name?.toLowerCase() || '';
				} else if (sortBy === 'createdAt') {
					aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				} else if (sortBy === 'price' || sortBy === 'packagingPrice') {
					aValue = a.packagingPrice ? parseFloat(a.packagingPrice.toString()) : 0;
					bValue = b.packagingPrice ? parseFloat(b.packagingPrice.toString()) : 0;
				} else {
					return 0;
				}

				if (aValue < bValue) return -1 * order;
				if (aValue > bValue) return 1 * order;
				return 0;
			});
		} else if (sortBy === 'productID' && sortOrder === 'desc') {
			// If sorting by productID descending, reverse the category-based sort
			sortedItems.reverse();
		}
		// If no sortBy specified or sortBy is 'productID' with 'asc', use category-based sort (already applied)

		// Apply pagination after sorting
		let paginatedItems = sortedItems;
		if (skipNum !== undefined && skipNum >= 0) {
			paginatedItems = paginatedItems.slice(skipNum);
		}
		if (limitNum !== undefined && limitNum > 0) {
			paginatedItems = paginatedItems.slice(0, limitNum);
		}

		const transformedItems = paginatedItems.map(item => transformMongoTypes(item));
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
						const sanitizedProductID = sanitizeProductID(existingProduct.productID);
						const publicId = `glister/products/${sanitizedProductID}/${fileNameWithoutExt}`;
						
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

		// Validate that sizeOptions have names
		if (req.body.materials && Array.isArray(req.body.materials)) {
			for (const material of req.body.materials) {
				if (material.sizeOptions && Array.isArray(material.sizeOptions)) {
					for (const sizeOption of material.sizeOptions) {
						if (!sizeOption.name || typeof sizeOption.name !== 'string' || sizeOption.name.trim() === '') {
							return res.status(400).json({ 
								message: 'Size name is required for all size options. Each size option must have a name, sizeMM, and additionalCost.' 
							});
						}
					}
				}
			}
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
						name: size.name.trim(),
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

		// Validate and normalize discountPercentage if provided
		if (req.body.discountPercentage !== undefined) {
			let dp = req.body.discountPercentage;
			dp = dp === null || dp === '' ? null : Number(dp);
			if (dp !== null) {
				if (Number.isNaN(dp)) {
					return res.status(400).json({ message: 'Invalid discountPercentage' });
				}
				if (dp < 0 || dp > 100) {
					return res.status(400).json({ message: 'discountPercentage must be between 0 and 100' });
				}
				existingProduct.discountPercentage = dp;
			} else {
				existingProduct.discountPercentage = null;
			}
			// Remove from req.body to avoid overwriting again below in assign
			delete req.body.discountPercentage;
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
					const sanitizedProductID = sanitizeProductID(product.productID);
					const publicId = `glister/products/${sanitizedProductID}/${fileNameWithoutExt}`;
					
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
	// Set CORS headers explicitly for this route
	setCorsHeaders(req, res);
	
	try {
		// Log request details for debugging
		const contentType = req.headers['content-type'] || 'unknown';
		console.log(`[uploadProductImages] Request received - Product ID: ${req.params.id}, Content-Type: ${contentType}`);
		
		const product = await Product.findById(req.params.id);
		if (!product) {
			console.error(`[uploadProductImages] Product not found: ${req.params.id}`);
			return res.status(404).json({ message: 'Product not found' });
		}

		// Log file information
		console.log(`[uploadProductImages] Files received:`, {
			filesPresent: !!req.files,
			filesCount: req.files ? req.files.length : 0,
			filesInfo: req.files ? req.files.map(f => ({
				fieldname: f.fieldname,
				originalname: f.originalname,
				mimetype: f.mimetype,
				size: f.size,
				bufferLength: f.buffer ? f.buffer.length : 0
			})) : []
		});

		if (!req.files || req.files.length === 0) {
			console.error(`[uploadProductImages] No files provided in request`);
			console.error(`[uploadProductImages] Request body type:`, typeof req.body);
			console.error(`[uploadProductImages] Request body keys:`, Object.keys(req.body || {}));
			console.error(`[uploadProductImages] Content-Type header:`, contentType);
			return res.status(400).json({ 
				message: 'No images provided. Please ensure files are being sent correctly.',
				debug: process.env.NODE_ENV === 'development' ? {
					contentType,
					hasFiles: !!req.files,
					filesCount: req.files ? req.files.length : 0,
					bodyKeys: Object.keys(req.body || {})
				} : undefined
			});
		}

		// Check payload size and compress if needed (fallback compression)
		const { compressMulterFiles, calculateTotalSizeMB } = require('../utils/imageCompression');
		const totalSizeMB = calculateTotalSizeMB(req.files);
		const maxPayloadMB = 4.5; // Vercel's limit
		const safetyMarginMB = 4.0; // Safety margin for multipart encoding overhead

		console.log(`[uploadProductImages] Total payload size: ${totalSizeMB.toFixed(2)}MB (limit: ${maxPayloadMB}MB)`);

		let filesToUpload = req.files;

		// If payload is close to or exceeds limit, compress server-side as fallback
		if (totalSizeMB > safetyMarginMB) {
			console.log(`[uploadProductImages] Payload size (${totalSizeMB.toFixed(2)}MB) exceeds safety margin (${safetyMarginMB}MB), attempting server-side compression`);
			
			// Calculate target size per file to stay under limit
			const availableSizeMB = (safetyMarginMB * 0.9) / req.files.length; // 90% of safety margin distributed across files
			const targetSizeMB = Math.max(0.5, Math.min(availableSizeMB, 2)); // Between 0.5MB and 2MB per file

			console.log(`[uploadProductImages] Compressing files to ${targetSizeMB.toFixed(2)}MB per file`);
			
			try {
				filesToUpload = await compressMulterFiles(req.files, {
					maxSizeMB: targetSizeMB,
					maxWidthOrHeight: 2000,
					quality: 85
				});

				const compressedTotalSizeMB = calculateTotalSizeMB(filesToUpload);
				const savedMB = totalSizeMB - compressedTotalSizeMB;
				
				// Check if compression actually reduced the size
				if (compressedTotalSizeMB < totalSizeMB) {
					console.log(`[uploadProductImages] Server-side compression complete: ${compressedTotalSizeMB.toFixed(2)}MB (saved ${savedMB.toFixed(2)}MB)`);
				} else {
					console.warn(`[uploadProductImages] Compression did not reduce size (likely sharp unavailable). Original: ${totalSizeMB.toFixed(2)}MB, Result: ${compressedTotalSizeMB.toFixed(2)}MB`);
				}

				// Warn if still too large after compression attempt
				if (compressedTotalSizeMB > maxPayloadMB) {
					console.warn(`[uploadProductImages] WARNING: Payload size (${compressedTotalSizeMB.toFixed(2)}MB) still exceeds Vercel limit (${maxPayloadMB}MB) after compression attempt. Upload may fail.`);
				}
			} catch (compressionError) {
				console.error(`[uploadProductImages] Server-side compression failed:`, compressionError);
				console.warn(`[uploadProductImages] Continuing with original files. If upload fails due to size, please compress images on the frontend or upload fewer files.`);
				// Continue with original files if compression fails
				filesToUpload = req.files;
			}
		} else {
			console.log(`[uploadProductImages] Payload size within safety margin, skipping server-side compression`);
		}

		// Upload all images to Cloudinary
		const sanitizedProductID = sanitizeProductID(product.productID);
		console.log(`[uploadProductImages] Starting Cloudinary upload for ${filesToUpload.length} file(s) to folder: glister/products/${sanitizedProductID}`);
		
		const uploadPromises = filesToUpload.map((file, index) => {
			const fileSizeMB = file.buffer ? (file.buffer.length / 1024 / 1024).toFixed(2) : (file.size / 1024 / 1024).toFixed(2);
			console.log(`[uploadProductImages] Uploading file ${index + 1}/${filesToUpload.length}: ${file.originalname} (${fileSizeMB}MB)`);
			return uploadToCloudinary(file.buffer, {
				folder: `glister/products/${sanitizedProductID}`,
			}).catch(err => {
				console.error(`[uploadProductImages] Cloudinary upload failed for ${file.originalname}:`, err);
				throw new Error(`Failed to upload ${file.originalname}: ${err.message}`);
			});
		});

		const uploadResults = await Promise.all(uploadPromises);
		console.log(`[uploadProductImages] Successfully uploaded ${uploadResults.length} image(s) to Cloudinary`);
		
		// Extract secure URLs from upload results
		const imageUrls = uploadResults.map((result) => result.secure_url);
		console.log(`[uploadProductImages] Cloudinary URLs generated:`, imageUrls);

		// Add new image URLs to the product as Map entries
		imageUrls.forEach((url, index) => {
			const imageKey = `image_${Date.now()}_${index}`;
			product.imageURLs.set(imageKey, {
				url: url,
				mappedFinishID: null
			});
		});
		
		await product.save();
		console.log(`[uploadProductImages] Product saved with ${imageUrls.length} new image(s)`);

		const transformedProduct = transformMongoTypes(product.toObject());

		return res.status(200).json({
			message: 'Images uploaded successfully',
			images: imageUrls,
			product: transformedProduct,
		});
	} catch (err) {
		// Ensure CORS headers are set even on error
		setCorsHeaders(req, res);
		
		console.error(`[uploadProductImages] Error during upload:`, {
			message: err.message,
			stack: err.stack,
			productId: req.params.id,
			filesCount: req.files ? req.files.length : 0,
			contentType: req.headers['content-type']
		});
		
		// Handle sharp-related errors specifically
		if (err.message && (err.message.includes('sharp') || err.message.includes('Could not load'))) {
			console.warn(`[uploadProductImages] Sharp module error detected, but upload should continue with original files`);
			// Don't fail the upload due to sharp errors - the compression utility should handle this gracefully
			// If we reach here, it means there was an unexpected error, so we'll return a generic error
		}
		
		// Handle 413 Payload Too Large errors specifically
		if (err.status === 413 || (err.message && err.message.includes('413')) || err.message?.includes('Content Too Large')) {
			return res.status(413).json({ 
				message: 'File size too large. Maximum size is 3MB per file. Please compress images on the frontend or upload one image at a time.',
				error: process.env.NODE_ENV === 'development' ? err.stack : undefined
			});
		}
		
		return res.status(500).json({ 
			message: err.message || 'Failed to upload images',
			error: process.env.NODE_ENV === 'development' ? err.stack : undefined
		});
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
		const sanitizedProductID = sanitizeProductID(product.productID);
		const publicId = `glister/products/${sanitizedProductID}/${fileWithExt.split('.')[0]}`;

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
		const { q, material, hasSize, finishId, category, subcategory, subcategoryId, limit, skip } = req.query;
		const Category = require('../models/Category');
		const mongoose = require('mongoose');
		const filter = {};
		const andConditions = [];

		// Only show visible products to customers
		// Include products where isVisible is true, undefined, or doesn't exist (for backward compatibility)
		// This matches: isVisible = true OR isVisible doesn't exist OR isVisible = null
		const visibilityCondition = {
			$or: [
				{ isVisible: true },
				{ isVisible: { $exists: false } },
				{ isVisible: null }
			]
		};

		// Search query
		if (q) {
			andConditions.push(visibilityCondition);
			andConditions.push({
				$or: [
					{ name: { $regex: q, $options: 'i' } },
					{ productID: { $regex: q, $options: 'i' } },
					{ productUID: { $regex: q, $options: 'i' } },
				]
			});
			filter.$and = andConditions;
		} else {
			// If no search query, use visibility condition directly
			filter.$or = visibilityCondition.$or;
		}

		// Material filter
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };

		// Size filter
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };

		// Finish filter - finishes is an array of objects with finishID property
		if (finishId) {
			if (mongoose.Types.ObjectId.isValid(finishId)) {
				filter['finishes.finishID'] = new mongoose.Types.ObjectId(finishId);
			}
		}

		// Category filter - support both ID and slug
		if (category) {
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

		// Parse pagination parameters
		const limitNum = limit ? parseInt(limit, 10) : undefined;
		const skipNum = skip ? parseInt(skip, 10) : undefined;

		// Build query with necessary fields including category and subcategoryId for sorting
		// We need to fetch all matching products first to sort them properly
		let query = Product.find(filter)
			.select('_id productID name description imageURLs materials finishes category subcategoryId')
			.populate('category', 'name slug description subcategories');

		// Fetch all matching products
		const allItems = await query.lean();

		// Apply category-based and productID-based sorting as default
		// This ensures products are always grouped by category/subcategory and sorted by productID
		const sortedItems = sortProductsByCategoryAndID(allItems);

		// Apply pagination after sorting
		let paginatedItems = sortedItems;
		if (skipNum !== undefined && skipNum >= 0) {
			paginatedItems = paginatedItems.slice(skipNum);
		}
		if (limitNum !== undefined && limitNum > 0) {
			paginatedItems = paginatedItems.slice(0, limitNum);
		}

		// Transform to minimal format
		const minimalProducts = paginatedItems.map(item => {
			// Extract images
			const imageURLsArray = item.imageURLs ? Object.values(item.imageURLs) : [];

			// Find default image (mappedFinishID is null)
			const defaultImage = imageURLsArray.find(img => img.mappedFinishID === null);

			// Get valid finish IDs from product's finishes array
			const validFinishIds = (item.finishes || []).map(f => {
				// Handle both populated and non-populated finishes
				if (typeof f.finishID === 'object' && f.finishID !== null) {
					return f.finishID._id ? f.finishID._id.toString() : f.finishID.toString();
				}
				return f.finishID ? f.finishID.toString() : null;
			}).filter(Boolean);

			// Find first finish-specific image for hover that matches a valid finish
			// Only select images whose mappedFinishID is in the product's finishes array
			const hoverImage = imageURLsArray.find(img => {
				if (!img.mappedFinishID) return false;
				const mappedFinishIdStr = img.mappedFinishID.toString();
				return validFinishIds.includes(mappedFinishIdStr);
			});

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

async function getProductFinishes(req, res) {
	try {
		const productId = req.params.id;
		const product = await Product.findById(productId)
			.select('finishes')
			.lean();

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		if (!product.finishes || product.finishes.length === 0) {
			return res.json([]);
		}

		// Get all finish IDs from the product
		const finishIds = product.finishes.map(f => f.finishID);

		// Fetch finish details and include price adjustments
		const finishes = await Finish.find({ _id: { $in: finishIds } }).lean();

		// Map finishes with their price adjustments
		const finishesWithAdjustments = finishes.map(finish => {
			const finishOption = product.finishes.find(
				f => f.finishID && f.finishID.toString() === finish._id.toString()
			);
			
			return {
				...finish,
				_id: finish._id.toString(),
				priceAdjustment: finishOption?.priceAdjustment 
					? parseFloat(finishOption.priceAdjustment.toString()) 
					: 0
			};
		});

		// Transform MongoDB types
		const transformedFinishes = finishesWithAdjustments.map(transformMongoTypes);

		return res.json(transformedFinishes);
	} catch (err) {
		console.error('Get product finishes error:', err);
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Toggle product visibility status
 * PATCH /api/products/:id/visibility
 */
async function toggleProductVisibility(req, res) {
	try {
		const productId = req.params.id;
		const { isVisible } = req.body;

		if (typeof isVisible !== 'boolean') {
			return res.status(400).json({ message: 'isVisible must be a boolean value' });
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		product.isVisible = isVisible;
		await product.save();

		const transformedProduct = transformMongoTypes(product.toObject());
		return res.json({
			message: `Product ${isVisible ? 'made visible' : 'hidden'} successfully`,
			product: transformedProduct,
		});
	} catch (err) {
		console.error('Toggle product visibility error:', err);
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Get search suggestions for autocomplete
 * Returns limited products, matching categories, and subcategories
 */
async function getSuggestions(req, res) {
	try {
		const { q } = req.query;

		// Return empty results if no query
		if (!q || q.trim().length === 0) {
			return res.json({
				products: [],
				categories: [],
				subcategories: [],
			});
		}

		const Category = require('../models/Category');
		const searchQuery = q.trim();
		const mongoose = require('mongoose');

		// Search for products (limit to 8 for suggestions)
		const visibilityCondition = {
			$or: [
				{ isVisible: true },
				{ isVisible: { $exists: false } },
				{ isVisible: null }
			]
		};

		const productFilter = {
			$and: [
				visibilityCondition,
				{
					$or: [
						{ name: { $regex: searchQuery, $options: 'i' } },
						{ productID: { $regex: searchQuery, $options: 'i' } },
						{ productUID: { $regex: searchQuery, $options: 'i' } },
					]
				}
			]
		};

		const products = await Product.find(productFilter)
			.select('_id productID name description imageURLs')
			.limit(8)
			.lean();

		// Transform product images to get thumbnailImage
		const transformedProducts = products.map(product => {
			let thumbnailImage = null;

			if (product.imageURLs && typeof product.imageURLs === 'object') {
				const images = Object.values(product.imageURLs);
				if (images.length > 0 && images[0].url) {
					thumbnailImage = images[0].url;
				}
			}

			return {
				_id: product._id.toString(),
				productID: product.productID,
				name: product.name,
				description: product.description || '',
				thumbnailImage,
			};
		});

		// Search for matching categories that have products
		const allMatchingCategories = await Category.find({
			name: { $regex: searchQuery, $options: 'i' }
		})
			.select('_id name slug')
			.lean();

		// Filter categories to only include those with visible products
		const categoriesWithProducts = [];
		for (const category of allMatchingCategories) {
			const productCount = await Product.countDocuments({
				category: category._id,
				$or: [
					{ isVisible: true },
					{ isVisible: { $exists: false } },
					{ isVisible: null }
				]
			});

			if (productCount > 0) {
				categoriesWithProducts.push(category);
			}

			// Limit to 5 categories
			if (categoriesWithProducts.length >= 5) break;
		}

		// Search for matching subcategories that have products
		const categoriesWithSubcategories = await Category.find({
			'subcategories.name': { $regex: searchQuery, $options: 'i' }
		})
			.select('_id name subcategories')
			.lean();

		const matchingSubcategories = [];
		for (const category of categoriesWithSubcategories) {
			for (const subcategory of category.subcategories) {
				if (subcategory.name.toLowerCase().includes(searchQuery.toLowerCase())) {
					// Check if this subcategory has any visible products
					const productCount = await Product.countDocuments({
						subcategoryId: subcategory._id,
						$or: [
							{ isVisible: true },
							{ isVisible: { $exists: false } },
							{ isVisible: null }
						]
					});

					if (productCount > 0) {
						matchingSubcategories.push({
							_id: subcategory._id.toString(),
							name: subcategory.name,
							slug: subcategory.slug,
							categoryName: category.name,
							categoryId: category._id.toString(),
						});
					}

					// Limit to 5 subcategories
					if (matchingSubcategories.length >= 5) break;
				}
			}
			if (matchingSubcategories.length >= 5) break;
		}

		return res.json({
			products: transformedProducts,
			categories: categoriesWithProducts.map(cat => ({
				_id: cat._id.toString(),
				name: cat.name,
				slug: cat.slug,
			})),
			subcategories: matchingSubcategories,
		});
	} catch (err) {
		console.error('Get suggestions error:', err);
		return res.status(500).json({
			message: 'Failed to fetch suggestions',
			error: err.message
		});
	}
}

module.exports = {
	createProduct,
	listProducts,
	listProductsMinimal,
	getSuggestions,
	getProduct,
	updateProduct,
	deleteProduct,
	uploadProductImages,
	deleteProductImage,
	updateImageFinishMapping,
	getProductFinishes,
	toggleProductVisibility,
};


