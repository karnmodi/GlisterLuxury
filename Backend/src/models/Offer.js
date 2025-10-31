const mongoose = require('mongoose');

const { Schema } = mongoose;

const OfferSchema = new Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
			index: true
		},
		description: {
			type: String,
			required: true
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
		}
	},
	{ timestamps: true }
);

// Index for active offers with valid dates
OfferSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

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

