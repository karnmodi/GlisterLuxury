const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContactInfoSchema = new Schema(
	{
		type: {
			type: String,
			enum: ['address', 'phone', 'email', 'social'],
			required: true,
			index: true
		},
		label: { type: String, required: true, trim: true }, // e.g., "Head Office", "Sales", "Instagram"
		value: { type: String, required: true, trim: true }, // The actual contact info
		displayOrder: { type: Number, default: 0, index: true },
		isActive: { type: Boolean, default: true, index: true },
		// Social Media URLs
		socialMedia: {
			instagram: { type: String, trim: true, default: '' },
			facebook: { type: String, trim: true, default: '' },
			linkedin: { type: String, trim: true, default: '' },
			twitter: { type: String, trim: true, default: '' },
			youtube: { type: String, trim: true, default: '' },
			pinterest: { type: String, trim: true, default: '' },
			tiktok: { type: String, trim: true, default: '' },
		},
		// Business WhatsApp Number with country code (e.g., "+1234567890")
		businessWhatsApp: { 
			type: String, 
			trim: true, 
			default: '',
			validate: {
				validator: function(v) {
					// Allow empty string or validate WhatsApp number format (should start with +)
					if (!v || v === '') return true;
					return /^\+[1-9]\d{1,14}$/.test(v);
				},
				message: 'WhatsApp number must be in E.164 format (e.g., +1234567890)'
			}
		},
	},
	{ timestamps: true }
);

// Add compound index for efficient querying
ContactInfoSchema.index({ type: 1, displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('ContactInfo', ContactInfoSchema);

