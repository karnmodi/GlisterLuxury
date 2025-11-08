const mongoose = require('mongoose');

const { Schema } = mongoose;

const CollectionSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, unique: true, index: true },
		description: { type: String },
		products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
		isActive: { type: Boolean, default: true, index: true },
		displayOrder: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

// Generate slug from name before saving
CollectionSchema.pre('save', function(next) {
	if (this.isModified('name') && !this.slug) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}
	next();
});

module.exports = mongoose.model('Collection', CollectionSchema);

