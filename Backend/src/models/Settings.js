const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for individual delivery tier
const DeliveryTierSchema = new Schema({
  minAmount: {
    type: Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  maxAmount: {
    type: Schema.Types.Decimal128,
    required: false, // null means infinity (no upper limit)
    min: 0
  },
  fee: {
    type: Schema.Types.Decimal128,
    required: true,
    min: 0
  }
}, { _id: false });

// Main Settings Schema
const SettingsSchema = new Schema({
  // Delivery configuration
  deliveryTiers: {
    type: [DeliveryTierSchema],
    default: []
  },

  freeDeliveryThreshold: {
    enabled: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Schema.Types.Decimal128,
      default: 100.00 // Default £100 for free delivery
    }
  },

  // VAT configuration
  // Note: VAT is INCLUSIVE in all prices (UK B2C standard)
  // The vatRate is used to extract/calculate the VAT component for display and reporting
  vatRate: {
    type: Number,
    required: true,
    default: 20.0, // UK standard VAT rate: 20%
    min: 0,
    max: 100
  },

  vatEnabled: {
    type: Boolean,
    default: true
  },

  // Auto-reply configuration
  autoReplySettings: {
    type: [{
      emailAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      },
      enabled: {
        type: Boolean,
        default: false
      },
      subject: {
        type: String,
        default: ''
      },
      message: {
        type: String,
        default: ''
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: String,
        default: 'system'
      }
    }],
    default: []
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Pre-save hook to update lastUpdated
SettingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Validate delivery tiers - ensure no overlaps and proper ordering
SettingsSchema.methods.validateDeliveryTiers = function() {
  const tiers = this.deliveryTiers;

  if (tiers.length === 0) {
    return { valid: true };
  }

  // Convert Decimal128 to numbers for comparison
  const tiersWithNumbers = tiers.map(tier => ({
    minAmount: parseFloat(tier.minAmount.toString()),
    maxAmount: tier.maxAmount ? parseFloat(tier.maxAmount.toString()) : Infinity,
    fee: parseFloat(tier.fee.toString())
  }));

  // Sort by minAmount
  tiersWithNumbers.sort((a, b) => a.minAmount - b.minAmount);

  // Check for overlaps (gaps are allowed)
  for (let i = 0; i < tiersWithNumbers.length - 1; i++) {
    const current = tiersWithNumbers[i];
    const next = tiersWithNumbers[i + 1];

    // Check if maxAmount is defined and greater than minAmount
    if (current.maxAmount !== Infinity && current.maxAmount <= current.minAmount) {
      return {
        valid: false,
        error: `Tier ${i + 1}: maxAmount must be greater than minAmount`
      };
    }

    // Check for overlaps (only overlaps are invalid, gaps are fine)
    if (current.maxAmount !== Infinity && current.maxAmount > next.minAmount) {
      return {
        valid: false,
        error: `Overlap detected between tier ${i + 1} and tier ${i + 2}`
      };
    }

    // Note: Gaps between tiers are allowed - orders in gap ranges will use the next tier's fee
  }

  return { valid: true };
};

// Static method to get or create settings (Singleton pattern)
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();

  if (!settings) {
    // Create default settings if none exist
    const defaultAutoReplyMessage = `Thank you for reaching out to Glister Luxury! 💛

We're thrilled to hear from you and delighted to welcome you into the Glister family. Your enquiry is important to us, and our dedicated Enquiries Team will personally get back to you within 3 business days.

At Glister Luxury, every product we craft reflects timeless design, superior quality, and the elegance you deserve. From luxurious bathroom accessories to our full range of premium hardware solutions, we are committed to bringing beauty and distinction into your home.

We can't wait to assist you and make your experience with Glister Luxury truly exceptional. Your journey with us is just beginning, and we're excited to share it with you! ✨

Warm regards,

The Glister Luxury Enquiries Team

Crafted for those who value distinction.

+44 7767 198433 | enquiries@glisterluxury.com

https://www.glisterlondon.com/`;

    settings = await this.create({
      deliveryTiers: [
        { minAmount: 0, maxAmount: 49.99, fee: 5.99 },
        { minAmount: 50, maxAmount: 99.99, fee: 3.99 },
        { minAmount: 100, maxAmount: null, fee: 0 } // Free delivery for £100+
      ],
      freeDeliveryThreshold: {
        enabled: true,
        amount: 100.00
      },
      vatRate: 20.0,
      vatEnabled: true,
      autoReplySettings: [
        {
          emailAddress: 'enquiries@glisterluxury.com',
          enabled: false,
          subject: 'Thank you for contacting Glister Luxury',
          message: defaultAutoReplyMessage,
          lastUpdated: new Date(),
          updatedBy: 'system'
        },
        {
          emailAddress: 'sales@glisterluxury.com',
          enabled: false,
          subject: '',
          message: '',
          lastUpdated: new Date(),
          updatedBy: 'system'
        },
        {
          emailAddress: 'orders@glisterluxury.com',
          enabled: false,
          subject: '',
          message: '',
          lastUpdated: new Date(),
          updatedBy: 'system'
        },
        {
          emailAddress: 'noreply@glisterluxury.com',
          enabled: false,
          subject: '',
          message: '',
          lastUpdated: new Date(),
          updatedBy: 'system'
        },
        {
          emailAddress: 'admin@glisterluxury.com',
          enabled: false,
          subject: '',
          message: '',
          lastUpdated: new Date(),
          updatedBy: 'system'
        }
      ]
    });
  }

  return settings;
};

// Static method to update settings
SettingsSchema.statics.updateSettings = async function(updates) {
  console.log('=== MODEL: Starting updateSettings ===');
  
  let settings = await this.getSettings();
  console.log('Current settings ID:', settings._id);
  console.log('Current settings before update:', {
    deliveryTiers: settings.deliveryTiers.length,
    freeDeliveryAmount: settings.freeDeliveryThreshold.amount.toString(),
    vatRate: settings.vatRate,
    vatEnabled: settings.vatEnabled
  });

  // Update fields
  if (updates.deliveryTiers !== undefined) {
    console.log('Updating deliveryTiers:', updates.deliveryTiers.length, 'tiers');
    settings.deliveryTiers = updates.deliveryTiers;
  }

  if (updates.freeDeliveryThreshold !== undefined) {
    console.log('Updating freeDeliveryThreshold:', updates.freeDeliveryThreshold);
    settings.freeDeliveryThreshold = updates.freeDeliveryThreshold;
  }

  if (updates.vatRate !== undefined) {
    console.log('Updating vatRate:', updates.vatRate);
    settings.vatRate = updates.vatRate;
  }

  if (updates.vatEnabled !== undefined) {
    console.log('Updating vatEnabled:', updates.vatEnabled);
    settings.vatEnabled = updates.vatEnabled;
  }

  if (updates.autoReplySettings !== undefined) {
    console.log('Updating autoReplySettings:', updates.autoReplySettings.length, 'configs');
    // Update lastUpdated and updatedBy for each auto-reply config
    const updatedAutoReplySettings = updates.autoReplySettings.map(config => ({
      ...config,
      lastUpdated: config.lastUpdated ? new Date(config.lastUpdated) : new Date(),
      updatedBy: config.updatedBy || updates.updatedBy || 'system'
    }));
    settings.autoReplySettings = updatedAutoReplySettings;
  }

  if (updates.updatedBy !== undefined) {
    settings.updatedBy = updates.updatedBy;
  }

  // Mark document as modified to ensure save
  settings.markModified('deliveryTiers');
  settings.markModified('freeDeliveryThreshold');
  settings.markModified('vatRate');
  settings.markModified('vatEnabled');
  settings.markModified('autoReplySettings');

  // Validate tiers before saving
  const validation = settings.validateDeliveryTiers();
  if (!validation.valid) {
    console.error('Validation failed:', validation.error);
    throw new Error(validation.error);
  }

  console.log('=== MODEL: Saving to database ===');
  const saveResult = await settings.save();
  console.log('=== MODEL: Save completed ===');
  console.log('Saved settings ID:', saveResult._id);
  
  // Fetch fresh data from database to verify persistence
  const verifiedSettings = await this.findById(saveResult._id);
  console.log('=== MODEL: Verified settings from DB ===');
  console.log('Verified settings:', {
    deliveryTiers: verifiedSettings.deliveryTiers.length,
    freeDeliveryAmount: verifiedSettings.freeDeliveryThreshold.amount.toString(),
    vatRate: verifiedSettings.vatRate,
    vatEnabled: verifiedSettings.vatEnabled,
    lastUpdated: verifiedSettings.lastUpdated
  });
  
  return verifiedSettings;
};

const Settings = mongoose.model('Settings', SettingsSchema);

module.exports = Settings;
