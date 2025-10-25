const Wishlist = require('../models/Wishlist');
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

	// Handle Map (including MongoDB Maps)
	if (obj instanceof Map || (obj && obj.constructor && obj.constructor.name === 'Map')) {
		const plain = {};
		for (const [key, value] of obj.entries()) {
			plain[key] = transformMongoTypes(value);
		}
		return plain;
	}

	// Handle MongoDB Map-like objects that might be serialized differently
	if (obj && typeof obj === 'object' && obj.constructor?.name === 'Object' && 
		Object.keys(obj).some(key => key.startsWith('image_') || key.includes('image'))) {
		// This might be a serialized Map, check if it has Map-like structure
		const hasMapStructure = Object.values(obj).some(value => 
			value && typeof value === 'object' && 
			(value.url || value.mappedFinishID || value._id)
		);
		if (hasMapStructure) {
			// Transform each value in the Map-like object
			const transformed = {};
			for (const [key, value] of Object.entries(obj)) {
				transformed[key] = transformMongoTypes(value);
			}
			return transformed;
		}
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
 * Add item to wishlist
 * POST /api/wishlist
 */
exports.addToWishlist = async (req, res, next) => {
	try {
		const { sessionID, productID } = req.body;
		const userID = req.user ? req.user.userId : null;

		if (!sessionID && !userID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID or user authentication required'
			});
		}

		if (!productID) {
			return res.status(400).json({
				success: false,
				message: 'Product ID is required'
			});
		}

		// Verify product exists
		const product = await Product.findById(productID);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Product not found'
			});
		}

		// Find or create wishlist
		const query = userID ? { userID } : { sessionID, userID: null };
		let wishlist = await Wishlist.findOne(query);

		if (!wishlist) {
			wishlist = new Wishlist({
				sessionID,
				userID,
				items: []
			});
		}

		// Check if product already in wishlist
		const existingItem = wishlist.items.find(
			item => item.productID.toString() === productID
		);

		if (existingItem) {
			return res.status(400).json({
				success: false,
				message: 'Product already in wishlist'
			});
		}

		wishlist.items.push({
			productID,
			addedAt: new Date()
		});

		await wishlist.save();

		// Get the updated wishlist with proper transformation
		const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
			path: 'items.productID',
			model: 'Product',
			select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
		});
		const wishlistObj = transformMongoTypes(updatedWishlist.toJSON());

		res.status(201).json({
			success: true,
			message: 'Product added to wishlist',
			wishlist: wishlistObj
		});
	} catch (error) {
		console.error('Add to wishlist error:', error);
		res.status(500).json({
			success: false,
			message: 'Error adding to wishlist',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get wishlist
 * GET /api/wishlist
 */
exports.getWishlist = async (req, res, next) => {
	try {
		const { sessionID } = req.query;
		const userID = req.user ? req.user.userId : null;

		if (!sessionID && !userID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID or user authentication required'
			});
		}

		const query = userID ? { userID } : { sessionID, userID: null };
		const wishlist = await Wishlist.findOne(query).populate({
			path: 'items.productID',
			model: 'Product',
			select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
		});

		if (!wishlist) {
			return res.json({
				success: true,
				wishlist: {
					items: [],
					count: 0
				}
			});
		}

		// Convert the wishlist to object and transform all MongoDB types
		// Use toJSON() instead of toObject() to ensure Maps are properly serialized
		const wishlistObj = transformMongoTypes(wishlist.toJSON());
		
		// Debug: Log imageURLs to verify they're being populated
		if (wishlistObj.items && wishlistObj.items.length > 0) {
			console.log('Debug - First item imageURLs:', JSON.stringify(wishlistObj.items[0].productID?.imageURLs, null, 2));
		}

		res.json({
			success: true,
			wishlist: {
				...wishlistObj,
				count: wishlist.items.length
			}
		});
	} catch (error) {
		console.error('Get wishlist error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching wishlist',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Remove item from wishlist
 * DELETE /api/wishlist/item/:productId
 */
exports.removeFromWishlist = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const { sessionID } = req.body;
		const userID = req.user ? req.user.userId : null;

		if (!sessionID && !userID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID or user authentication required'
			});
		}

		const query = userID ? { userID } : { sessionID, userID: null };
		const wishlist = await Wishlist.findOne(query);

		if (!wishlist) {
			return res.status(404).json({
				success: false,
				message: 'Wishlist not found'
			});
		}

		const initialLength = wishlist.items.length;
		wishlist.items = wishlist.items.filter(
			item => item.productID.toString() !== productId
		);

		if (wishlist.items.length === initialLength) {
			return res.status(404).json({
				success: false,
				message: 'Product not found in wishlist'
			});
		}

		await wishlist.save();

		// Get the updated wishlist with proper transformation
		const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
			path: 'items.productID',
			model: 'Product',
			select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
		});
		const wishlistObj = transformMongoTypes(updatedWishlist.toJSON());

		res.json({
			success: true,
			message: 'Product removed from wishlist',
			wishlist: wishlistObj
		});
	} catch (error) {
		console.error('Remove from wishlist error:', error);
		res.status(500).json({
			success: false,
			message: 'Error removing from wishlist',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Sync guest wishlist to user account
 * POST /api/wishlist/sync
 */
exports.syncWishlist = async (req, res, next) => {
	try {
		const { sessionID } = req.body;
		const userID = req.user.userId;

		if (!sessionID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID is required'
			});
		}

		// Find guest wishlist
		const guestWishlist = await Wishlist.findOne({ 
			sessionID, 
			userID: null 
		});

		if (!guestWishlist || guestWishlist.items.length === 0) {
			return res.json({
				success: true,
				message: 'No guest wishlist to sync'
			});
		}

		// Find or create user wishlist
		let userWishlist = await Wishlist.findOne({ userID });

		if (!userWishlist) {
			// Create new user wishlist with guest items
			userWishlist = new Wishlist({
				userID,
				sessionID,
				items: guestWishlist.items
			});
		} else {
			// Merge guest items into user wishlist
			for (const guestItem of guestWishlist.items) {
				const exists = userWishlist.items.some(
					item => item.productID.toString() === guestItem.productID.toString()
				);
				if (!exists) {
					userWishlist.items.push(guestItem);
				}
			}
			userWishlist.sessionID = sessionID;
		}

		await userWishlist.save();

		// Delete guest wishlist
		await Wishlist.deleteOne({ _id: guestWishlist._id });

		// Get the updated wishlist with proper transformation
		const updatedWishlist = await Wishlist.findById(userWishlist._id).populate({
			path: 'items.productID',
			model: 'Product',
			select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
		});
		const wishlistObj = transformMongoTypes(updatedWishlist.toJSON());

		res.json({
			success: true,
			message: 'Wishlist synced successfully',
			wishlist: wishlistObj
		});
	} catch (error) {
		console.error('Sync wishlist error:', error);
		res.status(500).json({
			success: false,
			message: 'Error syncing wishlist',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Clear wishlist
 * DELETE /api/wishlist
 */
exports.clearWishlist = async (req, res, next) => {
	try {
		const { sessionID } = req.body;
		const userID = req.user ? req.user.userId : null;

		if (!sessionID && !userID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID or user authentication required'
			});
		}

		const query = userID ? { userID } : { sessionID, userID: null };
		const wishlist = await Wishlist.findOne(query);

		if (!wishlist) {
			return res.status(404).json({
				success: false,
				message: 'Wishlist not found'
			});
		}

		wishlist.items = [];
		await wishlist.save();

		res.json({
			success: true,
			message: 'Wishlist cleared',
			wishlist
		});
	} catch (error) {
		console.error('Clear wishlist error:', error);
		res.status(500).json({
			success: false,
			message: 'Error clearing wishlist',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

