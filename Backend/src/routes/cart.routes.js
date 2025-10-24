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

module.exports = router;

