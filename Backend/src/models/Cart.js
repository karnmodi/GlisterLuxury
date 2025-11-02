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
		},
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
		offerID: { type: Schema.Types.ObjectId, ref: 'Offer' },
		total: { type: Schema.Types.Decimal128, default: 0 },
		status: { type: String, enum: ['active', 'checkout', 'completed'], default: 'active' },
	},
	{ timestamps: true }
);

// Calculate subtotal and total before saving
CartSchema.pre('save', function (next) {
	const subtotal = this.items.reduce((sum, item) => {
		const itemTotal = parseFloat(item.totalPrice?.toString() || 0);
		return sum + itemTotal;
	}, 0);
	this.subtotal = subtotal;
	
	// Calculate total with discount
	const discount = parseFloat(this.discountAmount?.toString() || 0);
	this.total = Math.max(0, subtotal - discount);
	next();
});

module.exports = mongoose.model('Cart', CartSchema);

