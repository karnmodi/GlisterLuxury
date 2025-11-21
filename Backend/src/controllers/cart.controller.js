const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Finish = require('../models/Finish');
const Offer = require('../models/Offer');
const { computePriceAndValidate, toNumber } = require('../utils/pricing');
const offerAutoApplyService = require('../services/offerAutoApply.service');

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
			selectedSizeName,
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

		// Get size details from product if size is provided
		let sizeDetail = null;
		if (selectedSize != null) {
			const materialMatch = priceData.resolved.materialMatch;
			const sizeOption = (materialMatch.sizeOptions || []).find(s => Number(s.sizeMM) === Number(selectedSize));
			if (sizeOption) {
				sizeDetail = {
					sizeID: null, // Size is embedded in product, no separate Size model
					name: sizeOption.name || selectedSizeName || `${selectedSize}mm`,
					sizeMM: Number(selectedSize),
					sizeCost: breakdown.size,
				};
			}
		}

		// Helper to convert to Decimal128 - explicitly handle the conversion
		const toDecimal128 = (value) => {
			if (value == null || value === undefined) {
				return mongoose.Types.Decimal128.fromString('0.00');
			}
			const num = typeof value === 'number' ? value : parseFloat(value);
			if (isNaN(num)) {
				return mongoose.Types.Decimal128.fromString('0.00');
			}
			// Round to 2 decimal places
			const rounded = Math.round(num * 100) / 100;
			return mongoose.Types.Decimal128.fromString(rounded.toFixed(2));
		};

		// Calculate material discount and net price from breakdown (always use backend calculation for consistency)
		const materialBase = parseFloat(breakdown.material || 0);
		const materialDiscount = parseFloat(breakdown.discount || 0);
		const materialNet = Math.max(0, materialBase - materialDiscount);

		console.log('Price breakdown:', {
			materialBase,
			materialDiscount,
			materialNet,
			unitPrice,
			totalAmount
		});

		// Convert materialID to ObjectId if needed
		let materialIDObj = null;
		if (selectedMaterial.materialID) {
			try {
				materialIDObj = typeof selectedMaterial.materialID === 'string'
					? new mongoose.Types.ObjectId(selectedMaterial.materialID)
					: selectedMaterial.materialID;
			} catch (error) {
				materialIDObj = priceData.resolved.materialMatch.materialID;
			}
		} else {
			materialIDObj = priceData.resolved.materialMatch.materialID;
		}

		// Create cart item with proper nested structure
		// Explicitly convert all Decimal128 fields
		const cartItem = {
			productID: product._id,
			productName: product.name,
			productCode: product.productID,
			selectedMaterial: {
				materialID: materialIDObj,
				name: selectedMaterial.name,
				basePrice: toDecimal128(materialBase),
				materialDiscount: toDecimal128(materialDiscount),
				netBasePrice: toDecimal128(materialNet),
			},
			selectedSize: sizeDetail ? {
				sizeID: sizeDetail.sizeID || null,
				name: sizeDetail.name,
				sizeMM: sizeDetail.sizeMM,
				sizeCost: toDecimal128(sizeDetail.sizeCost || 0)
			} : null,
			selectedFinish: finishDetail ? {
				finishID: finishDetail.finishID,
				name: finishDetail.name,
				priceAdjustment: toDecimal128(toNumber(finishDetail.priceAdjustment || 0))
			} : null,
			packagingPrice: toDecimal128(breakdown.packaging || 0),
			quantity,
			unitPrice: toDecimal128(unitPrice),
			totalPrice: toDecimal128(totalAmount),
			priceBreakdown: {
				materialBase: toDecimal128(materialBase),
				materialDiscount: toDecimal128(materialDiscount),
				materialNet: toDecimal128(materialNet),
				size: toDecimal128(breakdown.size || 0),
				finishes: toDecimal128(breakdown.finishes || 0),
				packaging: toDecimal128(breakdown.packaging || 0),
				totalItemDiscount: toDecimal128(materialDiscount),
			},
		};

		console.log('Cart item before save:', JSON.stringify(cartItem, null, 2));

		// Use Mongoose's create method for proper subdocument validation
		const createdItem = cart.items.create(cartItem);
		cart.items.push(createdItem);

		console.log('After creating subdocument, netBasePrice:', cart.items[cart.items.length - 1].selectedMaterial.netBasePrice);

		await cart.save();

		// Validate and cleanup discount if cart no longer meets requirements
		// (though adding items usually increases total, discount might have expired or become invalid)
		// Try to get userId from request if available (from auth middleware)
		const userId = req.user?.userId || cart.userID || null;
		await validateAndCleanupDiscount(cart, userId);

		// Apply best auto-apply offer after validation
		await offerAutoApplyService.applyBestAutoOffer(cart, userId);

		if (cart.isModified()) {
			await cart.save();
		}

		res.status(201).json({
			message: 'Item added to cart',
			cart: await Cart.findById(cart._id)
				.populate({
					path: 'items.productID',
					model: 'Product',
					select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
				})
				.populate('items.selectedFinish.finishID'),
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
		const userId = req.user?.userId || cart.userID || null;
		await validateAndCleanupDiscount(cart, userId);

		// Apply best auto-apply offer after validation
		await offerAutoApplyService.applyBestAutoOffer(cart, userId);

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
		const userId = req.user?.userId || cart.userID || null;
		await validateAndCleanupDiscount(cart, userId);

		// Apply best auto-apply offer after validation
		await offerAutoApplyService.applyBestAutoOffer(cart, userId);

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
		const itemsSummary = cart.items.map(item => {
			// Handle size display - read from nested selectedSize object
			let sizeDisplay = 'Standard';
			if (item.selectedSize) {
				if (item.selectedSize.name && item.selectedSize.sizeMM) {
					sizeDisplay = `${item.selectedSize.name} ${item.selectedSize.sizeMM}mm`;
				} else if (item.selectedSize.sizeMM) {
					sizeDisplay = `${item.selectedSize.sizeMM}mm`;
				} else if (item.selectedSize.name) {
					sizeDisplay = item.selectedSize.name;
				}
			}

			return {
				itemID: item._id,
				product: {
					code: item.productCode,
					name: item.productName,
				},
				selections: {
					material: item.selectedMaterial.name,
					size: sizeDisplay,
					finish: item.selectedFinish ? item.selectedFinish.name : 'None',
				},
				pricing: {
					materialCost: toNumber(item.priceBreakdown.materialNet || item.priceBreakdown.materialBase || 0),
					sizeCost: toNumber(item.priceBreakdown.size || 0),
					finishCost: toNumber(item.priceBreakdown.finishes || 0),
					packagingCost: toNumber(item.priceBreakdown.packaging || 0),
					unitPrice: toNumber(item.unitPrice),
				},
				quantity: item.quantity,
				totalPrice: toNumber(item.totalPrice),
			};
		});

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

			// Apply best auto-apply offer after validation (user eligibility may have changed)
			await offerAutoApplyService.applyBestAutoOffer(cart, userId);

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

		// Calculate discount for manual code
		const manualDiscount = offer.calculateDiscount(subtotal);

		// Check if there's a better auto-apply offer available
		const eligibleAutoOffers = await offerAutoApplyService.findEligibleAutoOffers(cart, userId);
		const bestAutoOffer = offerAutoApplyService.selectBestOffer(eligibleAutoOffers);

		let appliedOffer, appliedDiscount, isAuto = false;

		if (bestAutoOffer && bestAutoOffer.calculatedDiscount > manualDiscount) {
			// Auto-apply offer is better - inform user
			appliedOffer = bestAutoOffer.offer;
			appliedDiscount = bestAutoOffer.calculatedDiscount;
			isAuto = true;

			cart.discountCode = appliedOffer.code || `AUTO_${appliedOffer._id}`;
			cart.discountAmount = appliedDiscount;
			cart.offerID = appliedOffer._id;
			cart.isAutoApplied = true;
			cart.discountApplicationMethod = 'auto';
			cart.manualCodeLocked = false;

			// Increment auto-apply count
			await Offer.findByIdAndUpdate(appliedOffer._id, { $inc: { autoApplyCount: 1 } });

			await cart.save();

			return res.status(200).json({
				message: `We found a better discount for you! Automatically applied "${appliedOffer.displayName || appliedOffer.description}" (saves £${appliedDiscount.toFixed(2)})`,
				cart: await Cart.findById(cart._id).populate({
					path: 'items.productID',
					model: 'Product',
					select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
				}).populate('offerID'),
				betterOfferApplied: true
			});
		} else {
			// Manual code is better or equal
			appliedOffer = offer;
			appliedDiscount = manualDiscount;

			cart.discountCode = appliedOffer.code;
			cart.discountAmount = appliedDiscount;
			cart.offerID = appliedOffer._id;
			cart.isAutoApplied = false;
			cart.discountApplicationMethod = 'manual';
			cart.manualCodeLocked = true; // Lock to prevent auto-apply from overriding

			// Increment manual apply count
			await Offer.findByIdAndUpdate(appliedOffer._id, { $inc: { manualApplyCount: 1 } });

			await cart.save();

			res.json({
				message: 'Discount code applied successfully',
				cart: await Cart.findById(cart._id).populate({
					path: 'items.productID',
					model: 'Product',
					select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
				}).populate('offerID'),
				savings: appliedDiscount
			});
		}
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
		cart.isAutoApplied = false;
		cart.discountApplicationMethod = 'none';
		cart.manualCodeLocked = false;

		await cart.save();

		// After removing discount, check if auto-apply offers qualify
		const userId = cart.userID || null;
		await offerAutoApplyService.applyBestAutoOffer(cart, userId);

		if (cart.isModified()) {
			await cart.save();
		}

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

/**
 * Unlock manual discount and allow auto-apply to re-evaluate
 * POST /api/cart/:sessionID/unlock-discount
 */
async function unlockManualDiscount(req, res, next) {
	try {
		const { sessionID } = req.params;

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		// Unlock the manual code lock
		cart.manualCodeLocked = false;

		// Re-evaluate auto-apply offers
		const userId = cart.userID || null;
		await offerAutoApplyService.applyBestAutoOffer(cart, userId);

		if (cart.isModified()) {
			await cart.save();
		}

		res.json({
			message: 'Discount unlocked, re-evaluated offers',
			cart: await Cart.findById(cart._id).populate({
				path: 'items.productID',
				model: 'Product',
				select: 'productID name description category packagingPrice packagingUnit materials finishes imageURLs createdAt updatedAt subcategoryId'
			})
		});
	} catch (error) {
		next(error);
	}
}

/**
 * Get near-miss offers (offers customer is close to qualifying for)
 * GET /api/cart/:sessionID/near-miss-offers
 */
async function getNearMissOffers(req, res, next) {
	try {
		const { sessionID } = req.params;
		const { userId } = req.query;

		const cart = await Cart.findOne({ sessionID });
		if (!cart) {
			return res.status(404).json({ error: 'Cart not found' });
		}

		const nearMissOffers = await offerAutoApplyService.getNearMissOffers(cart, userId || cart.userID);

		res.json({
			nearMissOffers,
			currentSubtotal: cart.subtotal
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
	unlockManualDiscount,
	getNearMissOffers,
};

