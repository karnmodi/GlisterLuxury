const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Finish = require('../models/Finish');
const Offer = require('../models/Offer');
const { computePriceAndValidate, toNumber } = require('../utils/pricing');

/**
 * Validate and auto-remove discount if cart no longer meets requirements
 * This should be called after any cart modification (add, update, remove items)
 */
async function validateAndCleanupDiscount(cart, userId) {
	if (!cart.discountCode || !cart.offerID) {
		return; // No discount applied
	}

	try {
		const offer = await Offer.findById(cart.offerID);
		if (!offer) {
			// Offer no longer exists, remove discount
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}

		// Check if offer is still active
		if (!offer.isActive) {
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}

		// Check date validity
		const now = new Date();
		if (offer.validFrom && now < offer.validFrom) {
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}
		if (offer.validTo && now > offer.validTo) {
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}

		// Check usage limit
		if (offer.maxUses !== null && offer.maxUses > 0 && offer.usedCount >= offer.maxUses) {
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}

		// Check minimum order amount - CRITICAL for the bug fix
		const subtotal = parseFloat(cart.subtotal?.toString() || 0);
		const minAmount = parseFloat(offer.minOrderAmount?.toString() || 0);
		if (subtotal < minAmount) {
			// Cart total is below minimum, remove discount
			cart.discountCode = undefined;
			cart.discountAmount = 0;
			cart.offerID = undefined;
			return;
		}

		// Check user eligibility (for new_users only offers)
		if (offer.applicableTo === 'new_users') {
			let userIsNew = false;
			if (userId) {
				const User = require('../models/User');
				const user = await User.findById(userId);
				if (user) {
					const Order = require('../models/Order');
					const nonCancelledOrders = await Order.countDocuments({ 
						userID: userId,
						status: { $ne: 'cancelled' }
					});
					userIsNew = nonCancelledOrders === 0;
				}
			} else {
				// No userId provided, assume guest (not a new user)
				userIsNew = false;
			}

			if (!userIsNew) {
				cart.discountCode = undefined;
				cart.discountAmount = 0;
				cart.offerID = undefined;
				return;
			}
		}

		// If we reach here, discount is still valid, recalculate it based on current subtotal
		const discount = offer.calculateDiscount(subtotal);
		cart.discountAmount = discount;
	} catch (error) {
		console.error('[Validate Discount] Error:', error);
		// On error, remove discount to be safe
		cart.discountCode = undefined;
		cart.discountAmount = 0;
		cart.offerID = undefined;
	}
}

/**
 * Add item to cart
 * POST /api/cart/add
 * Body: {
 *   sessionID: string (required),
 *   productID: ObjectId,
 *   selectedMaterial: { materialID?, name, basePrice? },
 *   selectedSize?: number,
 *   selectedFinish?: ObjectId (only one finish allowed),
 *   quantity?: number
 * }
 */
async function addToCart(req, res, next) {
	try {
		const {
			sessionID,
			productID,
			selectedMaterial,
			selectedSize,
			selectedFinish,
			quantity = 1,
			includePackaging = true,
		} = req.body;

		if (!sessionID) {
			return res.status(400).json({ error: 'sessionID is required' });
		}

		if (!productID) {
			return res.status(400).json({ error: 'productID is required' });
		}

		if (!selectedMaterial || !selectedMaterial.name) {
			return res.status(400).json({ error: 'selectedMaterial with name is required' });
		}

		// Validate finish is required
		if (!selectedFinish) {
			return res.status(400).json({ error: 'selectedFinish is required' });
		}

		// Validate and compute price (convert single finish to array for validation)
		const selectedFinishes = selectedFinish ? [selectedFinish] : [];
		const priceData = await computePriceAndValidate({
			productID,
			selectedMaterial,
			selectedSize,
			selectedFinishes,
			quantity,
			includePackaging,
		});

		const { product, breakdown, unitPrice, totalAmount } = priceData;

		// Fetch finish details (only one)
		let finishDetail = null;
		if (selectedFinish) {
			const finish = await Finish.findById(selectedFinish).lean();
			const finishOption = product.finishes.find(f => String(f.finishID) === String(selectedFinish));
			if (finish && finishOption) {
				finishDetail = {
					finishID: finish._id,
					name: finish.name,
					priceAdjustment: finishOption.priceAdjustment,
				};
			}
		}

		// Find or create cart
		let cart = await Cart.findOne({ sessionID });
		if (!cart) {
			cart = new Cart({ sessionID, items: [] });
		}

		// Create cart item
		const cartItem = {
			productID: product._id,
			productName: product.name,
			productCode: product.productID,
			selectedMaterial: {
				materialID: selectedMaterial.materialID || priceData.resolved.materialMatch.materialID,
				name: selectedMaterial.name,
				basePrice: breakdown.material,
			},
			selectedSize,
			sizeCost: breakdown.size,
			selectedFinish: finishDetail,
			finishCost: breakdown.finishes,
			packagingPrice: breakdown.packaging,
			quantity,
			unitPrice,
			totalPrice: totalAmount,
			priceBreakdown: breakdown,
		};

		cart.items.push(cartItem);
		await cart.save();

		// Validate and cleanup discount if cart no longer meets requirements
		// (though adding items usually increases total, discount might have expired or become invalid)
		// Try to get userId from request if available (from auth middleware)
		const userId = req.user?.userId || null;
		await validateAndCleanupDiscount(cart, userId);
		if (cart.isModified()) {
			await cart.save();
		}

		res.status(201).json({
			message: 'Item added to cart',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			}),
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get cart details
 * GET /api/cart/:sessionID
 */
async function getCart(req, res, next) {
	try {
		const { sessionID } = req.params;

		const cart = await Cart.findOne({ sessionID })
			.populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			})
			.populate('items.selectedFinish.finishID');

		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		res.json(cart);
	} catch (error) {
		next(error);
	}
}

/**
 * Update cart item quantity
 * PUT /api/cart/item/:itemId
 * Body: { sessionID: string, quantity: number }
 */
async function updateCartItem(req, res, next) {
	try {
		const { itemId } = req.params;
		const { sessionID, quantity } = req.body;

		if (!sessionID) {
			return res.status(400).json({ error: 'sessionID is required' });
		}

		if (!quantity || quantity < 1) {
			return res.status(400).json({ error: 'Valid quantity is required' });
		}

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		const item = cart.items.id(itemId);
		if (!item) {
			return res.status(404).json({ error: 'Item not found in cart' });
		}

		// Update quantity and recalculate total
		item.quantity = quantity;
		const unitPrice = toNumber(item.unitPrice);
		item.totalPrice = unitPrice * quantity;

		await cart.save();

		// Validate and cleanup discount if cart no longer meets requirements
		// Try to get userId from request if available (from auth middleware)
		const userId = req.user?.userId || null;
		await validateAndCleanupDiscount(cart, userId);
		if (cart.isModified()) {
			await cart.save();
		}

		res.json({
			message: 'Cart item updated',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			}),
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Remove item from cart
 * DELETE /api/cart/item/:itemId
 * Body: { sessionID: string }
 */
async function removeCartItem(req, res, next) {
	try {
		const { itemId } = req.params;
		const { sessionID } = req.body;

		if (!sessionID) {
			return res.status(400).json({ error: 'sessionID is required' });
		}

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		cart.items.pull(itemId);
		await cart.save();

		// Validate and cleanup discount if cart no longer meets requirements
		// Try to get userId from request if available (from auth middleware)
		const userId = req.user?.userId || null;
		await validateAndCleanupDiscount(cart, userId);
		if (cart.isModified()) {
			await cart.save();
		}

		res.json({
			message: 'Item removed from cart',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			}),
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Clear entire cart
 * DELETE /api/cart/:sessionID
 */
async function clearCart(req, res, next) {
	try {
		const { sessionID } = req.params;

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		cart.items = [];
		// Clear discount when cart is cleared
		cart.discountCode = undefined;
		cart.discountAmount = 0;
		cart.offerID = undefined;
		await cart.save();

		res.json({ message: 'Cart cleared', cart });
	} catch (error) {
		next(error);
	}
}

/**
 * Get checkout summary
 * GET /api/cart/:sessionID/checkout
 */
async function getCheckoutSummary(req, res, next) {
	try {
		const { sessionID } = req.params;

		const cart = await Cart.findOne({ sessionID })
			.populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			})
			.populate('items.selectedFinish.finishID');

		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		if (cart.items.length === 0) {
			return res.status(400).json({ error: 'Cart is empty' });
		}

		// Prepare detailed summary
		const itemsSummary = cart.items.map(item => ({
			itemID: item._id,
			product: {
				code: item.productCode,
				name: item.productName,
			},
			selections: {
				material: item.selectedMaterial.name,
				size: item.selectedSize ? `${item.selectedSize}mm` : 'Standard',
				finish: item.selectedFinish ? item.selectedFinish.name : 'None',
			},
			pricing: {
				materialCost: toNumber(item.priceBreakdown.material),
				sizeCost: toNumber(item.priceBreakdown.size),
				finishCost: toNumber(item.priceBreakdown.finishes),
				packagingCost: toNumber(item.priceBreakdown.packaging),
				unitPrice: toNumber(item.unitPrice),
			},
			quantity: item.quantity,
			totalPrice: toNumber(item.totalPrice),
		}));

		const summary = {
			sessionID: cart.sessionID,
			items: itemsSummary,
			totalItems: cart.items.length,
			totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
			subtotal: toNumber(cart.subtotal),
			currency: 'GBP',
			timestamp: new Date().toISOString(),
		};

		res.json(summary);
	} catch (error) {
		next(error);
	}
}

/**
 * Link cart to user account (on login)
 * POST /api/cart/link
 */
async function linkCartToUser(req, res, next) {
	try {
		const { sessionID } = req.body;
		const userId = req.user.userId;

		if (!sessionID) {
			return res.status(400).json({ error: 'sessionID is required' });
		}

		const cart = await Cart.findOne({ sessionID });
		
		if (cart) {
			cart.userID = userId;
			await cart.save();

			// Validate discount now that we have userId (user eligibility might have changed)
			await validateAndCleanupDiscount(cart, userId);
			if (cart.isModified()) {
				await cart.save();
			}
			
			return res.json({
				message: 'Cart linked to user account',
				cart: await Cart.findById(cart._id).populate({
					path: 'items.productID',
					model: 'Product',
					select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
				})
			});
		}

		res.json({ message: 'No cart to link' });
	} catch (error) {
		next(error);
	}
}

/**
 * Apply discount code to cart
 * POST /api/cart/:sessionID/apply-discount
 * Body: { code: string, userId?: string }
 */
async function applyDiscountCode(req, res, next) {
	try {
		const { sessionID } = req.params;
		const { code, userId } = req.body;

		if (!code) {
			return res.status(400).json({ error: 'Discount code is required' });
		}

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		if (cart.items.length === 0) {
			return res.status(400).json({ error: 'Cart is empty' });
		}

		// Validate offer code
		const offer = await Offer.findOne({ code: code.toUpperCase().trim() });
		if (!offer) {
			return res.status(404).json({ error: 'Invalid discount code' });
		}

		// Check if user is new (for applicableTo: 'new_users')
		// User is considered "new" if they have NO orders OR only cancelled orders
		let userIsNew = false;
		if (userId) {
			const User = require('../models/User');
			const user = await User.findById(userId);
			if (user) {
				const Order = require('../models/Order');
				// Check for any order excluding cancelled orders
				const nonCancelledOrders = await Order.countDocuments({ 
					userID: userId,
					status: { $ne: 'cancelled' }
				});
				userIsNew = nonCancelledOrders === 0;
			}
		}

		// Validate offer
		const validation = offer.isValid(userIsNew);
		if (!validation.valid) {
			return res.status(400).json({ error: validation.reason });
		}

		// Check if cart already has a different discount applied (same code is allowed to recalculate)
		const codeUpper = code.toUpperCase().trim();
		if (cart.discountCode && cart.discountCode !== codeUpper) {
			return res.status(400).json({ 
				error: `A discount code (${cart.discountCode}) is already applied. Please remove it first to apply a new one.` 
			});
		}

		// Check minimum order amount
		const subtotal = parseFloat(cart.subtotal?.toString() || 0);
		const minAmount = parseFloat(offer.minOrderAmount?.toString() || 0);
		if (subtotal < minAmount) {
			return res.status(400).json({ 
				error: `Minimum order amount of £${minAmount.toFixed(2)} is required for this offer` 
			});
		}

		// Calculate discount
		const discount = offer.calculateDiscount(subtotal);

		// Apply discount to cart (only one discount allowed)
		cart.discountCode = offer.code;
		cart.discountAmount = discount; // Mongoose will convert number to Decimal128 if needed
		cart.offerID = offer._id;
		
		await cart.save();

		res.json({
			message: 'Discount code applied successfully',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			}).populate('offerID'),
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Remove discount code from cart
 * DELETE /api/cart/:sessionID/remove-discount
 */
async function removeDiscountCode(req, res, next) {
	try {
		const { sessionID } = req.params;

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		cart.discountCode = undefined;
		cart.discountAmount = 0;
		cart.offerID = undefined;
		
		await cart.save();

		res.json({
			message: 'Discount code removed',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			}),
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	addToCart,
	getCart,
	updateCartItem,
	removeCartItem,
	clearCart,
	getCheckoutSummary,
	linkCartToUser,
	applyDiscountCode,
	removeDiscountCode,
};

