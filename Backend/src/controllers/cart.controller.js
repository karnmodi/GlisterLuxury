const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Finish = require('../models/Finish');
const { computePriceAndValidate, toNumber } = require('../utils/pricing');

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

		res.status(201).json({
			message: 'Item added to cart',
			cart: await Cart.findById(cart._id).populate('items.productID'),
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
			.populate('items.productID')
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

		res.json({
			message: 'Cart item updated',
			cart: await Cart.findById(cart._id).populate('items.productID'),
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

		res.json({
			message: 'Item removed from cart',
			cart: await Cart.findById(cart._id).populate('items.productID'),
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
			.populate('items.productID')
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
			
			return res.json({
				message: 'Cart linked to user account',
				cart: await Cart.findById(cart._id).populate('items.productID')
			});
		}

		res.json({ message: 'No cart to link' });
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
};

