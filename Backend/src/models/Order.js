const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrderItemSchema = new Schema(
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
		},
	},
	{ _id: true }
);

const OrderSchema = new Schema(
	{
		orderNumber: { 
			type: String, 
			required: true, 
			unique: true
		},
		userID: { 
			type: Schema.Types.ObjectId, 
			ref: 'User', 
			required: true, 
			index: true 
		},
		sessionID: { type: String },
		items: [OrderItemSchema],
		customerInfo: {
			name: { type: String, required: true },
			email: { type: String, required: true },
			phone: { type: String },
		},
		deliveryAddress: {
			label: { type: String },
			addressLine1: { type: String, required: true },
			addressLine2: { type: String },
			city: { type: String, required: true },
			county: { type: String },
			postcode: { type: String, required: true },
			country: { type: String, default: 'United Kingdom' },
		},
		orderNotes: { type: String },
		discountCode: { type: String },
		discountAmount: { type: Schema.Types.Decimal128, default: 0 },
		offerID: { type: Schema.Types.ObjectId, ref: 'Offer' },
		pricing: {
			subtotal: { type: Schema.Types.Decimal128, required: true },
			discount: { type: Schema.Types.Decimal128, default: 0 },
			shipping: { type: Schema.Types.Decimal128, default: 0 },
			tax: { type: Schema.Types.Decimal128, default: 0 },
			total: { type: Schema.Types.Decimal128, required: true },
		},
	status: {
		type: String,
		enum: [
			'pending',
			'confirmed',
			'processing',
			'shipped',
			'delivered',
			'refund_requested',
			'refund_processing',
			'refund_completed',
			'cancelled'
		],
		default: 'pending',
		index: true
	},
	orderStatusHistory: [
		{
			status: { type: String, required: true },
			note: { type: String },
			updatedAt: { type: Date, default: Date.now },
			updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
		}
	],
	paymentStatusHistory: [
		{
			status: { type: String, required: true },
			note: { type: String },
			updatedAt: { type: Date, default: Date.now },
			updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
		}
	],
		refundInfo: {
			reason: { type: String },
			requestedAt: { type: Date },
			processedAt: { type: Date },
			completedAt: { type: Date },
			refundAmount: { type: Schema.Types.Decimal128 },
			notes: { type: String }
		},
	paymentInfo: {
		method: { type: String },
		status: { 
			type: String, 
			enum: ['pending', 'awaiting_payment', 'paid', 'partially_paid', 'payment_failed', 'payment_pending_confirmation', 'refunded'],
			default: 'pending'
		},
		paidAt: { type: Date },
		transactionId: { type: String }
	},
	adminMessages: [
		{
			message: { type: String, required: true },
			createdAt: { type: Date, default: Date.now },
			createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
		}
	]
	},
	{ timestamps: true }
);

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
	if (this.isNew && !this.orderNumber) {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		
		// Find the last order of the day
		const lastOrder = await this.constructor.findOne({
			orderNumber: new RegExp(`^GL${year}${month}${day}`)
		}).sort({ orderNumber: -1 });
		
		let sequence = 1;
		if (lastOrder) {
			const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
			sequence = lastSequence + 1;
		}
		
		this.orderNumber = `GL${year}${month}${day}${String(sequence).padStart(4, '0')}`;
	}
	
	// Add order status to history if changed
	if (this.isModified('status') && !this.isNew) {
		this.orderStatusHistory.push({
			status: this.status,
			note: this._statusNote || undefined,
			updatedAt: new Date(),
			updatedBy: this._statusUpdatedBy || undefined
		});
		// Clean up temporary properties
		delete this._statusNote;
		delete this._statusUpdatedBy;
	}
	
	// Add payment status to history if changed
	if (this.isModified('paymentInfo.status') && !this.isNew) {
		this.paymentStatusHistory.push({
			status: this.paymentInfo.status,
			note: this._paymentStatusNote || undefined,
			updatedAt: new Date(),
			updatedBy: this._paymentStatusUpdatedBy || undefined
		});
		// Clean up temporary properties
		delete this._paymentStatusNote;
		delete this._paymentStatusUpdatedBy;
	}
	
	next();
});

// Calculate total before saving
OrderSchema.pre('save', function (next) {
	const subtotal = parseFloat(this.pricing.subtotal?.toString() || 0);
	const discount = parseFloat(this.pricing.discount?.toString() || 0);
	const shipping = parseFloat(this.pricing.shipping?.toString() || 0);
	const tax = parseFloat(this.pricing.tax?.toString() || 0);
	this.pricing.total = Math.max(0, subtotal - discount + shipping + tax);
	next();
});

module.exports = mongoose.model('Order', OrderSchema);

