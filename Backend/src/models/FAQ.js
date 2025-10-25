const mongoose = require('mongoose');

const { Schema } = mongoose;

const FAQSchema = new Schema(
	{
		question: { type: String, required: true, trim: true },
		answer: { type: String, required: true },
		linkType: { 
			type: String, 
			enum: ['internal', 'external', 'none'], 
			default: 'none' 
		},
		linkUrl: { type: String, trim: true },
		linkText: { type: String, trim: true },
		order: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
	},
	{ timestamps: true }
);

// Add compound index for efficient querying
FAQSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('FAQ', FAQSchema);
