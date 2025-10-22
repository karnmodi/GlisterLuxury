const mongoose = require('mongoose');

const { Schema } = mongoose;

const SelectedMaterialSchema = new Schema(
	{
		materialID: { type: Schema.Types.ObjectId, ref: 'MaterialMaster' },
		name: { type: String, required: true },
		basePrice: { type: Schema.Types.Decimal128, required: true },
	},
	{ _id: false }
);

const ProductConfigurationSchema = new Schema(
	{
		productID: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
		userID: { type: Schema.Types.ObjectId, ref: 'User' },
		selectedMaterial: { type: SelectedMaterialSchema, required: true },
		selectedSize: { type: Number },
		sizeCost: { type: Schema.Types.Decimal128, default: 0 },
		selectedFinishes: [{ type: Schema.Types.ObjectId, ref: 'Finish' }],
		finishTotalCost: { type: Schema.Types.Decimal128, default: 0 },
		quantity: { type: Number, default: 1, min: 1 },
		totalAmount: { type: Schema.Types.Decimal128, required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ProductConfiguration', ProductConfigurationSchema);


