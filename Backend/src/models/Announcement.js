const mongoose = require('mongoose');

const { Schema } = mongoose;

const AnnouncementSchema = new Schema(
	{
		message: { type: String, required: true, trim: true },
		linkType: { 
			type: String, 
			enum: ['internal', 'external', 'none'], 
			default: 'none' 
		},
		linkUrl: { type: String, trim: true },
		linkText: { type: String, trim: true },
		backgroundColor: { type: String, default: '#1E1E1E' }, // Default charcoal
		textColor: { type: String, default: '#FFFFFF' }, // Default white
		order: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
		startDate: { type: Date },
		endDate: { type: Date },
	},
	{ timestamps: true }
);

// Add compound index for efficient querying
AnnouncementSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);

