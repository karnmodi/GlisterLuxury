const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactInfoSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['address', 'phone', 'email', 'social'],
			required: true,
			index: true
		},
		label: { type: String, required: true, trim: true }, // e.g., "Head Office", "Sales", "Instagram"
		value: { type: String, required: true, trim: true }, // The actual contact info
		displayOrder: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
	},
	{ timestamps: true }
);

// Add compound index for efficient querying
ContactInfoSchema.index({ type: 1, displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('ContactInfo', ContactInfoSchema);

