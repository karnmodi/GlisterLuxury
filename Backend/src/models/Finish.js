const mongoose = require('mongoose');

const { Schema } = mongoose;

const FinishSchema = new Schema(
	{
		name: { type: String, required: true, unique: true },
		photoURL: { type: String },
		description: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Finish', FinishSchema);


