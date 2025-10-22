const express = require('express');
const {
	addToCart,
	getCart,
	updateCartItem,
	removeCartItem,
	clearCart,
	getCheckoutSummary,
} = require('../controllers/cart.controller');

const router = express.Router();

// Add item to cart
router.post('/add', addToCart);

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

