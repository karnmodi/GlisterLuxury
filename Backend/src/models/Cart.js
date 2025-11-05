const mongoose = require('mongoose');

const { Schema } = mongoose;

const CartItemSchema = new Schema(
	{
		productID: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		productName: { type: String, required: true },
		productCode: { type: String, required: true },
		selectedMaterial: {
			materialID: { type: Schema.Types.ObjectId, ref: 'MaterialMaster' },
			name: { type: String, required: true },
			basePrice: { type: Schema.Types.Decimal128, required: true },
		},
		selectedSize: { type: Number },
		selectedSizeName: { type: String },
		sizeCost: { type: Schema.Types.Decimal128, default: 0 },
		selectedFinish: {
			finishID: { type: Schema.Types.ObjectId, ref: 'Finish' },
			name: { type: String },
			priceAdjustment: { type: Schema.Types.Decimal128, default: 0 },
		},
		finishCost: { type: Schema.Types.Decimal128, default: 0 },
		packagingPrice: { type: Schema.Types.Decimal128, default: 0 },
		quantity: { type: Number, default: 1, min: 1 },
		unitPrice: { type: Schema.Types.Decimal128, required: true },
		totalPrice: { type: Schema.Types.Decimal128, required: true },
		priceBreakdown: {
			material: { type: Schema.Types.Decimal128 },
			size: { type: Schema.Types.Decimal128 },
			finishes: { type: Schema.Types.Decimal128 },
			packaging: { type: Schema.Types.Decimal128 },
			discount: { type: Schema.Types.Decimal128, default: 0 },
			// VAT breakdown for each component
			materialVAT: { type: Schema.Types.Decimal128, default: 0 },
			sizeVAT: { type: Schema.Types.Decimal128, default: 0 },
			finishesVAT: { type: Schema.Types.Decimal128, default: 0 },
			packagingVAT: { type: Schema.Types.Decimal128, default: 0 },
			totalVAT: { type: Schema.Types.Decimal128, default: 0 }
		},
		// Item-level VAT amounts
		unitPriceVAT: { type: Schema.Types.Decimal128, default: 0 },
		totalPriceVAT: { type: Schema.Types.Decimal128, default: 0 }
	},
	{ _id: true }
);

const CartSchema = new Schema(
	{
		sessionID: { type: String, required: true, unique: true },
		userID: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for guest checkout
		items: [CartItemSchema],
		subtotal: { type: Schema.Types.Decimal128, default: 0 },
		discountCode: { type: String },
		discountAmount: { type: Schema.Types.Decimal128, default: 0 },
		discountType: { type: String, enum: ['percentage', 'fixed', null], default: null },
		discountValue: { type: Schema.Types.Decimal128, default: 0 },
		offerID: { type: Schema.Types.ObjectId, ref: 'Offer' },
		vat: { type: Schema.Types.Decimal128, default: 0 },
		total: { type: Schema.Types.Decimal128, default: 0 },
		status: { type: String, enum: ['active', 'checkout', 'completed'], default: 'active' },
		// ========== AUTO-APPLY TRACKING ==========
		// Track if current discount was auto-applied
		isAutoApplied: {
			type: Boolean,
			default: false
		},
		// Track application method
		discountApplicationMethod: {
			type: String,
			enum: ['manual', 'auto', 'none'],
			default: 'none'
		},
		// Store all eligible auto-apply offers (for UI hints)
		eligibleAutoOffers: [{
			offerID: {
				type: Schema.Types.ObjectId,
				ref: 'Offer'
			},
			calculatedDiscount: { type: Schema.Types.Decimal128 },
			priority: { type: Number }
		}],
		// Lock manual code (prevent auto-apply from overriding user choice)
		manualCodeLocked: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

// Calculate subtotal, VAT, and total before saving
CartSchema.pre('save', function (next) {
	const subtotal = this.items.reduce((sum, item) => {
		const itemTotal = parseFloat(item.totalPrice?.toString() || 0);
		return sum + itemTotal;
	}, 0);
	this.subtotal = subtotal;

	// Calculate total with discount
	const discount = parseFloat(this.discountAmount?.toString() || 0);
	const totalAfterDiscount = Math.max(0, subtotal - discount);

	// Calculate VAT (20% included in total)
	// VAT = total * (20/120) = total / 6
	const vat = totalAfterDiscount / 6;
	this.vat = vat;
	this.total = totalAfterDiscount;

	next();
});

module.exports = mongoose.model('Cart', CartSchema);

