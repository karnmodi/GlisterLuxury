const mongoose = require('mongoose');

const { Schema } = mongoose;

const AboutUsSchema = new Schema(
	{
		section: {
			type: String,
			enum: ['about', 'vision', 'philosophy', 'promise', 'coreValues'],
			required: true,
			index: true
		},
		title: { type: String, required: true, trim: true },
		content: { type: String, required: true },
		subtitle: { type: String, trim: true }, // For Vision/Philosophy subsections
		order: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
	},
	{ timestamps: true }
);

// Add compound index for efficient querying
AboutUsSchema.index({ section: 1, order: 1, isActive: 1 });

module.exports = mongoose.model('AboutUs', AboutUsSchema);

