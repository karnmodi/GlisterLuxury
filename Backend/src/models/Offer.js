const mongoose = require('mongoose');

const { Schema } = mongoose;

const OfferSchema = new Schema(
	{
		code: {
			type: String,
			required: function() {
				return !this.autoApply; // Code is required only for manual-apply offers
			},
			unique: true,
			sparse: true, // Allows multiple null values for auto-apply offers
			uppercase: true,
			trim: true,
			index: true
		},
		description: {
			type: String,
			required: true
		},
		// Display name shown to customers when auto-applied
		displayName: {
			type: String,
			default: function() {
				return this.description;
			}
		},
		discountType: {
			type: String,
			enum: ['percentage', 'fixed'],
			required: true,
			default: 'percentage'
		},
		discountValue: {
			type: Schema.Types.Decimal128,
			required: true,
			min: 0
		},
		minOrderAmount: {
			type: Schema.Types.Decimal128,
			default: 0
		},
		maxUses: {
			type: Number,
			default: null // null means unlimited
		},
		usedCount: {
			type: Number,
			default: 0
		},
		validFrom: {
			type: Date,
			default: Date.now
		},
		validTo: {
			type: Date,
			default: null // null means no expiration
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true
		},
		applicableTo: {
			type: String,
			enum: ['all', 'new_users'],
			default: 'all'
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		// ========== AUTO-APPLY CONFIGURATION ==========
		autoApply: {
			type: Boolean,
			default: false,
			index: true
		},
		// Priority when multiple auto-apply offers qualify (higher = wins)
		priority: {
			type: Number,
			default: 0,
			index: true
		},
		// Application scope (for future scalability)
		applicationScope: {
			type: String,
			enum: ['cart', 'products', 'categories', 'shipping'],
			default: 'cart'
		},
		// Target specific products (future feature)
		applicableProducts: [{
			type: Schema.Types.ObjectId,
			ref: 'Product'
		}],
		// Target specific categories (future feature)
		applicableCategories: [{
			type: String
		}],
		// Exclusions
		excludedProducts: [{
			type: Schema.Types.ObjectId,
			ref: 'Product'
		}],
		excludedCategories: [{
			type: String
		}],
		// Combinability rules (future: allow multiple discounts to stack)
		isStackable: {
			type: Boolean,
			default: false
		},
		// Offer presentation
		showInCart: {
			type: Boolean,
			default: true
		},
		// Analytics tracking
		autoApplyCount: {
			type: Number,
			default: 0
		},
		manualApplyCount: {
			type: Number,
			default: 0
		}
	},
	{ timestamps: true }
);

// Index for active offers with valid dates
OfferSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });
// Index for auto-apply offers with priority
OfferSchema.index({ autoApply: 1, isActive: 1, priority: -1 });
// Index for minimum order amount filtering
OfferSchema.index({ minOrderAmount: 1, autoApply: 1 });

// Pre-save validation
OfferSchema.pre('save', function(next) {
	// If autoApply is true and no displayName, use description
	if (this.autoApply && !this.displayName) {
		this.displayName = this.description;
	}

	// Ensure priority is set for auto-apply offers
	if (this.autoApply && this.priority === undefined) {
		this.priority = 0;
	}

	next();
});

// Method to check if offer is valid
OfferSchema.methods.isValid = function(userIsNew = false) {
	const now = new Date();
	
	// Check if active
	if (!this.isActive) {
		return { valid: false, reason: 'Offer is not active' };
	}
	
	// Check date validity
	if (this.validFrom && now < this.validFrom) {
		return { valid: false, reason: 'Offer has not started yet' };
	}
	
	if (this.validTo && now > this.validTo) {
		return { valid: false, reason: 'Offer has expired' };
	}
	
	// Check usage limit
	if (this.maxUses !== null && this.usedCount >= this.maxUses) {
		return { valid: false, reason: 'Offer has reached maximum usage limit' };
	}
	
	// Check applicable to
	if (this.applicableTo === 'new_users' && !userIsNew) {
		return { valid: false, reason: 'Offer is only valid for new users' };
	}
	
	return { valid: true };
};

// Method to calculate discount
OfferSchema.methods.calculateDiscount = function(amount) {
	if (this.discountType === 'percentage') {
		const discount = (parseFloat(amount) * parseFloat(this.discountValue.toString())) / 100;
		return Math.round(discount * 100) / 100; // Round to 2 decimal places
	} else {
		// Fixed amount
		return Math.min(parseFloat(this.discountValue.toString()), parseFloat(amount));
	}
};

module.exports = mongoose.model('Offer', OfferSchema);

