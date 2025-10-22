const mongoose = require('mongoose');

const { Schema } = mongoose;

const MaterialMasterSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		description: { type: String },
		unitOfMeasure: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('MaterialMaster', MaterialMasterSchema);


