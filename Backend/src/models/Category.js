const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubcategorySchema = new Schema(
	{
		name: { type: String, required: true },
		slug: { type: String },
		description: { type: String },
	},
	{ _id: true }
);

const CategorySchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, unique: true, index: true },
		description: { type: String },
		subcategories: { type: [SubcategorySchema], default: [] },
	},
	{ timestamps: true }
);

// Generate slug from name before saving
CategorySchema.pre('save', function(next) {
	if (this.isModified('name') && !this.slug) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}
	
	// Generate slugs for subcategories
	if (this.subcategories && this.subcategories.length > 0) {
		this.subcategories.forEach(sub => {
			if (!sub.slug && sub.name) {
				sub.slug = sub.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '');
			}
		});
	}
	
	next();
});

module.exports = mongoose.model('Category', CategorySchema);


