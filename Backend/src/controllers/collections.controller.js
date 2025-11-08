const Collection = require('../models/Collection');
const Product = require('../models/Product');

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

async function createCollection(req, res) {
	try {
		const collection = await Collection.create(req.body);
		const transformedCollection = transformMongoTypes(collection.toObject());
		return res.status(201).json(transformedCollection);
	} catch (err) {
		console.error('Collection creation error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function listCollections(req, res) {
	try {
		const { isActive, includeProductCount, q } = req.query;
		const filter = {};

		// Filter by isActive if provided
		if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}

		// Search query
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ slug: { $regex: q, $options: 'i' } },
			];
		}

		let query = Collection.find(filter).sort({ displayOrder: 1, createdAt: -1 });

		// Include product count if requested
		if (includeProductCount === 'true') {
			query = query.lean();
			const collections = await query;
			
			// Add product count to each collection
			const collectionsWithCount = await Promise.all(
				collections.map(async (collection) => {
					const productCount = await Product.countDocuments({ 
						_id: { $in: collection.products },
						isVisible: { $ne: false } // Only count visible products
					});
					return {
						...collection,
						productCount,
						_id: collection._id.toString(),
						products: collection.products.map(p => p.toString())
					};
				})
			);

			const transformedCollections = collectionsWithCount.map(transformMongoTypes);
			return res.json(transformedCollections);
		}

		const items = await query.lean();
		const transformedItems = items.map(item => transformMongoTypes(item));
		return res.json(transformedItems);
	} catch (err) {
		console.error('List collections error:', err);
		return res.status(500).json({ message: err.message });
	}
}

async function getCollection(req, res) {
	try {
		const { id } = req.params;
		const mongoose = require('mongoose');

		// Check if id is ObjectId or slug
		let collection;
		if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
			collection = await Collection.findById(id)
				.populate('products', 'productID name description imageURLs category isVisible')
				.lean();
		} else {
			collection = await Collection.findOne({ slug: id })
				.populate('products', 'productID name description imageURLs category isVisible')
				.lean();
		}

		if (!collection) {
			return res.status(404).json({ message: 'Collection not found' });
		}

		// Filter out non-visible products for customer-facing requests
		// Admin requests will see all products
		if (collection.products) {
			collection.products = collection.products.filter(
				product => product.isVisible !== false
			);
		}

		const transformedCollection = transformMongoTypes(collection);
		return res.json(transformedCollection);
	} catch (err) {
		console.error('Get collection error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function updateCollection(req, res) {
	try {
		const { id } = req.params;
		const { name, description, isActive, displayOrder, products } = req.body;
		
		const collection = await Collection.findById(id);
		if (!collection) {
			return res.status(404).json({ message: 'Collection not found' });
		}

		// Update name and regenerate slug if name changed
		if (name && name !== collection.name) {
			collection.name = name;
			collection.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		}

		if (description !== undefined) collection.description = description;
		if (isActive !== undefined) collection.isActive = isActive;
		if (displayOrder !== undefined) collection.displayOrder = displayOrder;
		
		// Update products array if provided
		if (products !== undefined && Array.isArray(products)) {
			collection.products = products;
		}

		await collection.save();
		const transformedCollection = transformMongoTypes(collection.toObject());
		return res.json(transformedCollection);
	} catch (err) {
		console.error('Update collection error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function deleteCollection(req, res) {
	try {
		const result = await Collection.findByIdAndDelete(req.params.id);
		if (!result) {
			return res.status(404).json({ message: 'Collection not found' });
		}
		return res.json({ message: 'Collection deleted successfully' });
	} catch (err) {
		console.error('Delete collection error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function addProductsToCollection(req, res) {
	try {
		const { id } = req.params;
		const { productIds } = req.body;

		if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
			return res.status(400).json({ message: 'productIds array is required' });
		}

		const collection = await Collection.findById(id);
		if (!collection) {
			return res.status(404).json({ message: 'Collection not found' });
		}

		// Add products that aren't already in the collection
		const existingProductIds = collection.products.map(p => p.toString());
		const newProductIds = productIds.filter(
			pid => !existingProductIds.includes(pid.toString())
		);

		if (newProductIds.length === 0) {
			return res.json({ 
				message: 'All products are already in the collection',
				collection: transformMongoTypes(collection.toObject())
			});
		}

		collection.products.push(...newProductIds);
		await collection.save();

		const transformedCollection = transformMongoTypes(collection.toObject());
		return res.json({
			message: `Added ${newProductIds.length} product(s) to collection`,
			collection: transformedCollection
		});
	} catch (err) {
		console.error('Add products to collection error:', err);
		return res.status(400).json({ message: err.message });
	}
}

async function removeProductsFromCollection(req, res) {
	try {
		const { id } = req.params;
		const { productIds } = req.body;

		if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
			return res.status(400).json({ message: 'productIds array is required' });
		}

		const collection = await Collection.findById(id);
		if (!collection) {
			return res.status(404).json({ message: 'Collection not found' });
		}

		// Remove products from collection
		const productIdsToRemove = productIds.map(pid => pid.toString());
		collection.products = collection.products.filter(
			p => !productIdsToRemove.includes(p.toString())
		);

		await collection.save();

		const transformedCollection = transformMongoTypes(collection.toObject());
		return res.json({
			message: `Removed ${productIds.length} product(s) from collection`,
			collection: transformedCollection
		});
	} catch (err) {
		console.error('Remove products from collection error:', err);
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Get products in a collection with filters and sorting
 * Similar to products listing but filtered by collection
 */
async function getCollectionProducts(req, res) {
	try {
		const { id } = req.params;
		const { q, material, hasSize, finishId, category, subcategory, subcategoryId, sortBy, sortOrder, hasDiscount, limit, skip } = req.query;
		
		const mongoose = require('mongoose');
		const Category = require('../models/Category');
		
		// Get collection
		let collection;
		if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
			collection = await Collection.findById(id).lean();
		} else {
			collection = await Collection.findOne({ slug: id }).lean();
		}

		if (!collection) {
			return res.status(404).json({ message: 'Collection not found' });
		}

		// Build filter starting with products in collection
		const filter = {
			_id: { $in: collection.products },
			isVisible: { $ne: false } // Only show visible products
		};

		// Search query
		if (q) {
			filter.$and = filter.$and || [];
			filter.$and.push({
				$or: [
					{ name: { $regex: q, $options: 'i' } },
					{ productID: { $regex: q, $options: 'i' } },
					{ productUID: { $regex: q, $options: 'i' } },
				]
			});
		}

		// Material filter
		if (material) filter['materials.name'] = { $regex: material, $options: 'i' };

		// Size filter
		if (hasSize === 'true') filter['materials.sizeOptions.0'] = { $exists: true };

		// Finish filter
		if (finishId) filter.finishes = { $in: [finishId] };

		// Discount filter
		if (hasDiscount === 'true') {
			filter.discountPercentage = { $gt: 0 };
		}

		// Category filter
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

		// Subcategory filter
		if (subcategory || subcategoryId) {
			const subcategoryValue = subcategory || subcategoryId;
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

		// Build sort options
		const sortOptions = {};
		const order = sortOrder === 'asc' ? 1 : -1;
		
		if (sortBy === 'name') {
			sortOptions.name = order;
		} else if (sortBy === 'productID') {
			sortOptions.productID = order;
		} else if (sortBy === 'createdAt') {
			sortOptions.createdAt = order;
		} else if (sortBy === 'price' || sortBy === 'packagingPrice') {
			sortOptions.packagingPrice = order;
		} else {
			sortOptions.createdAt = -1; // Default
		}

		// Parse pagination parameters
		const limitNum = limit ? parseInt(limit, 10) : undefined;
		const skipNum = skip ? parseInt(skip, 10) : undefined;

		// Build query
		let query = Product.find(filter)
			.populate('category', 'name slug description subcategories')
			.sort(sortOptions);

		// Apply pagination
		if (skipNum !== undefined && skipNum >= 0) {
			query = query.skip(skipNum);
		}
		if (limitNum !== undefined && limitNum > 0) {
			query = query.limit(limitNum);
		}

		const items = await query.lean();
		const transformedItems = items.map(item => transformMongoTypes(item));
		return res.json(transformedItems);
	} catch (err) {
		console.error('Get collection products error:', err);
		return res.status(500).json({ message: err.message });
	}
}

module.exports = {
	createCollection,
	listCollections,
	getCollection,
	updateCollection,
	deleteCollection,
	addProductsToCollection,
	removeProductsFromCollection,
	getCollectionProducts,
};

