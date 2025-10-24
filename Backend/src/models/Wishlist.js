const mongoose = require('mongoose');

const { Schema } = mongoose;

const WishlistItemSchema = new Schema(
	{
		productID: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		addedAt: { type: Date, default: Date.now }
	},
	{ _id: true }
);

const WishlistSchema = new Schema(
	{
		sessionID: { type: String, index: true },
		userID: { type: Schema.Types.ObjectId, ref: 'User', index: true },
		items: [WishlistItemSchema]
	},
	{ timestamps: true }
);

// Ensure at least sessionID or userID is provided
WishlistSchema.pre('save', function (next) {
	if (!this.sessionID && !this.userID) {
		next(new Error('Either sessionID or userID must be provided'));
	}
	next();
});

// Create compound index for efficient queries
WishlistSchema.index({ sessionID: 1, userID: 1 });

module.exports = mongoose.model('Wishlist', WishlistSchema);

