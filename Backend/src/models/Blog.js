const mongoose = require('mongoose');

const { Schema } = mongoose;

const BlogSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		shortDescription: { type: String, required: true, trim: true },
		content: { type: String, required: true },
		tags: [{ type: String, trim: true }],
		seoTitle: { type: String, trim: true },
		seoDescription: { type: String, trim: true },
		featuredImage: { type: String, trim: true },
		order: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
	},
	{ timestamps: true }
);

// Add indexes for efficient querying
BlogSchema.index({ isActive: 1, order: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ title: 'text', content: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Blog', BlogSchema);


