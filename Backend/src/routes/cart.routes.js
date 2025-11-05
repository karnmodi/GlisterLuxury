const express = require('express');
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/cart.controller');

const router = express.Router();

// Add item to cart
router.post('/add', addToCart);

// Link cart to user (protected)
router.post('/link', protect, linkCartToUser);

// Get cart by sessionID
router.get('/:sessionID', getCart);

// Get checkout summary
router.get('/:sessionID/checkout', getCheckoutSummary);

// Update cart item quantity
router.put('/item/:itemId', updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', removeCartItem);

// Clear cart
router.delete('/:sessionID', clearCart);

// Apply discount code
router.post('/:sessionID/apply-discount', applyDiscountCode);

// Remove discount code
router.delete('/:sessionID/remove-discount', removeDiscountCode);

// Unlock manual discount (allow auto-apply to re-evaluate)
router.post('/:sessionID/unlock-discount', unlockManualDiscount);

// Get near-miss offers (offers customer is close to qualifying for)
router.get('/:sessionID/near-miss-offers', getNearMissOffers);

module.exports = router;

