const mongoose = require('mongoose');

const { Schema } = mongoose;

const SizeOptionSchema = new Schema(
	{
		name: { type: String },
		sizeMM: { type: Number, required: true },
		additionalCost: { type: Schema.Types.Decimal128, default: 0 },
		isOptional: { type: Boolean, default: true },
	},
	{ _id: false }
);

const MaterialSchema = new Schema(
	{
		materialID: { type: Schema.Types.ObjectId, ref: 'MaterialMaster' },
		name: { type: String, required: true },
		basePrice: { type: Schema.Types.Decimal128, required: true },
		sizeOptions: { type: [SizeOptionSchema], default: [] },
	},
	{ _id: false }
);

const FinishOptionSchema = new Schema(
	{
		finishID: { type: Schema.Types.ObjectId, ref: 'Finish', required: true },
		priceAdjustment: { type: Schema.Types.Decimal128, default: 0 },
	},
	{ _id: false }
);

const ProductSchema = new Schema(
	{
		productID: { type: String, required: true, unique: true },
		productUID: { type: String, index: true },
		name: { type: String, required: true },
		description: { type: String },
		category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
		subcategoryId: { type: Schema.Types.ObjectId },
		packagingPrice: { type: Schema.Types.Decimal128, default: 0 },
		packagingUnit: { type: String, default: 'Set' },
		materials: { type: [MaterialSchema], default: [] },
		finishes: { type: [FinishOptionSchema], default: [] },
		imageURLs: { 
			type: Map, 
			of: {
				url: { type: String, required: true },
				mappedFinishID: { type: Schema.Types.ObjectId, ref: 'Finish' }
			},
			default: new Map()
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);


