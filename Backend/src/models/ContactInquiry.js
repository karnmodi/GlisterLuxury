const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactInquirySchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, trim: true, lowercase: true },
		phone: { type: String, trim: true },
		category: {
			type: String,
			enum: [
				'general_inquiry',
				'product_inquiry',
				'order_status',
				'refund_request',
				'bulk_order',
				'technical_support',
				'shipping_delivery',
				'payment_issue',
				'complaint',
				'other'
			],
			default: 'general_inquiry',
			index: true
		},
		subject: { type: String, required: true, trim: true },
		message: { type: String, required: true },
		status: {
			type: String,
			enum: ['new', 'read', 'replied', 'closed'],
			default: 'new',
			index: true
		},
		adminNotes: { type: String, trim: true },
	},
	{ timestamps: true }
);

// Add index for efficient querying
ContactInquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactInquiry', ContactInquirySchema);

