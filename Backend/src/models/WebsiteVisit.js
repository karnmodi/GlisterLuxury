const mongoose = require('mongoose');

const { Schema } = mongoose;

const WebsiteVisitSchema = new Schema(
	{
		sessionID: { 
			type: String, 
			required: true, 
			index: true 
		},
		userID: { 
			type: Schema.Types.ObjectId, 
			ref: 'User',
			index: true 
		},
		page: { 
			type: String, 
			required: true 
		},
		referrer: { 
			type: String 
		},
		userAgent: { 
			type: String 
		},
		ipAddress: { 
			type: String 
		},
		deviceType: { 
			type: String, 
			enum: ['mobile', 'tablet', 'desktop', 'unknown'],
			default: 'unknown'
		},
		timestamp: { 
			type: Date, 
			default: Date.now,
			index: true 
		}
	},
	{ timestamps: true }
);

// Compound indexes for efficient queries
WebsiteVisitSchema.index({ timestamp: 1, sessionID: 1 });
WebsiteVisitSchema.index({ timestamp: 1, page: 1 });
WebsiteVisitSchema.index({ userID: 1, timestamp: -1 });

// TTL index to automatically delete records older than 90 days
WebsiteVisitSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('WebsiteVisit', WebsiteVisitSchema);

