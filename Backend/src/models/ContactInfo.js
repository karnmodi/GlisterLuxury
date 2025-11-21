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
		value: { type: String, trim: true }, // The actual contact info (optional for backward compatibility)
		// Multiple phone numbers array (for type: 'phone')
		phones: [{
			type: {
				type: String,
				enum: ['landline', 'contact'],
				required: true
			},
			number: { type: String, required: true, trim: true },
			label: { type: String, trim: true } // Optional label like "Main Office", "Sales Department"
		}],
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

// Validation: phones array should only be used when type is 'phone'
ContactInfoSchema.pre('validate', function(next) {
	// If phones array is provided, it should only be for phone type
	if (this.phones && this.phones.length > 0 && this.type !== 'phone') {
		return next(new Error('phones array can only be used when type is "phone"'));
	}
	
	// For phone type, either value or phones should be provided (for backward compatibility)
	if (this.type === 'phone') {
		if (!this.value && (!this.phones || this.phones.length === 0)) {
			return next(new Error('Either value or phones array must be provided for phone type'));
		}
	} else {
		// For non-phone types, value should be provided
		if (!this.value) {
			return next(new Error('value is required for non-phone types'));
		}
	}
	
	next();
});

module.exports = mongoose.model('ContactInfo', ContactInfoSchema);

