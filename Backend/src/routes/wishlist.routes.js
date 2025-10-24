const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
	addToWishlist,
	getWishlist,
	removeFromWishlist,
	syncWishlist,
	clearWishlist
} = require('../controllers/wishlist.controller');

// Routes that work for both guest and authenticated users
router.post('/', optionalAuth, addToWishlist);
router.get('/', optionalAuth, getWishlist);
router.delete('/item/:productId', optionalAuth, removeFromWishlist);
router.delete('/', optionalAuth, clearWishlist);

// Authenticated only - sync guest wishlist to user account
router.post('/sync', optionalAuth, syncWishlist);

module.exports = router;

