const Settings = require('../models/Settings');
const mongoose = require('mongoose');

/**
 * Get current settings
 * Public endpoint - needed for cart/checkout to calculate delivery
 * @route GET /api/settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Return settings with Decimal128 converted to numbers for frontend
    const response = {
      deliveryTiers: settings.deliveryTiers.map(tier => ({
        minAmount: parseFloat(tier.minAmount.toString()),
        maxAmount: tier.maxAmount ? parseFloat(tier.maxAmount.toString()) : null,
        fee: parseFloat(tier.fee.toString())
      })),
      freeDeliveryThreshold: {
        enabled: settings.freeDeliveryThreshold.enabled,
        amount: parseFloat(settings.freeDeliveryThreshold.amount.toString())
      },
      vatRate: settings.vatRate,
      vatEnabled: settings.vatEnabled,
      autoReplySettings: settings.autoReplySettings || [],
      lastUpdated: settings.lastUpdated,
      updatedBy: settings.updatedBy
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      details: error.message
    });
  }
};

/**
 * Update settings
 * Admin-only endpoint
 * @route PUT /api/settings
 */
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Validate delivery tiers if provided
    if (updates.deliveryTiers) {
      // Ensure tiers are properly formatted
      if (!Array.isArray(updates.deliveryTiers)) {
        return res.status(400).json({
          error: 'deliveryTiers must be an array'
        });
      }

      // Validate each tier
      for (let i = 0; i < updates.deliveryTiers.length; i++) {
        const tier = updates.deliveryTiers[i];

        if (tier.minAmount === undefined || tier.minAmount === null) {
          return res.status(400).json({
            error: `Tier ${i + 1}: minAmount is required`
          });
        }

        if (tier.fee === undefined || tier.fee === null) {
          return res.status(400).json({
            error: `Tier ${i + 1}: fee is required`
          });
        }

        if (tier.minAmount < 0) {
          return res.status(400).json({
            error: `Tier ${i + 1}: minAmount cannot be negative`
          });
        }

        if (tier.fee < 0) {
          return res.status(400).json({
            error: `Tier ${i + 1}: fee cannot be negative`
          });
        }

        if (tier.maxAmount !== null && tier.maxAmount !== undefined) {
          if (tier.maxAmount < 0) {
            return res.status(400).json({
              error: `Tier ${i + 1}: maxAmount cannot be negative`
            });
          }

          if (tier.maxAmount <= tier.minAmount) {
            return res.status(400).json({
              error: `Tier ${i + 1}: maxAmount must be greater than minAmount`
            });
          }
        }
      }
    }

    // Validate free delivery threshold if provided
    if (updates.freeDeliveryThreshold) {
      if (updates.freeDeliveryThreshold.enabled !== undefined &&
          typeof updates.freeDeliveryThreshold.enabled !== 'boolean') {
        return res.status(400).json({
          error: 'freeDeliveryThreshold.enabled must be a boolean'
        });
      }

      if (updates.freeDeliveryThreshold.amount !== undefined) {
        const amount = parseFloat(updates.freeDeliveryThreshold.amount);
        if (isNaN(amount) || amount < 0) {
          return res.status(400).json({
            error: 'freeDeliveryThreshold.amount must be a positive number'
          });
        }
      }
    }

    // Validate VAT rate if provided
    if (updates.vatRate !== undefined) {
      const vatRate = parseFloat(updates.vatRate);
      if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
        return res.status(400).json({
          error: 'vatRate must be a number between 0 and 100'
        });
      }
    }

    // Validate VAT enabled if provided
    if (updates.vatEnabled !== undefined && typeof updates.vatEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'vatEnabled must be a boolean'
      });
    }

    // Validate auto-reply settings if provided
    if (updates.autoReplySettings !== undefined) {
      if (!Array.isArray(updates.autoReplySettings)) {
        return res.status(400).json({
          error: 'autoReplySettings must be an array'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailAddresses = new Set();

      for (let i = 0; i < updates.autoReplySettings.length; i++) {
        const config = updates.autoReplySettings[i];

        // Validate emailAddress
        if (!config.emailAddress || typeof config.emailAddress !== 'string') {
          return res.status(400).json({
            error: `Auto-reply config ${i + 1}: emailAddress is required and must be a string`
          });
        }

        if (!emailRegex.test(config.emailAddress)) {
          return res.status(400).json({
            error: `Auto-reply config ${i + 1}: emailAddress must be a valid email address`
          });
        }

        // Normalize email address
        const normalizedEmail = config.emailAddress.toLowerCase().trim();
        
        // Check for duplicates
        if (emailAddresses.has(normalizedEmail)) {
          return res.status(400).json({
            error: `Auto-reply config: Duplicate email address ${normalizedEmail}`
          });
        }
        emailAddresses.add(normalizedEmail);

        // Update config with normalized email
        config.emailAddress = normalizedEmail;

        // Validate enabled
        if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
          return res.status(400).json({
            error: `Auto-reply config ${i + 1}: enabled must be a boolean`
          });
        }

        // If enabled, validate subject and message
        if (config.enabled === true) {
          if (!config.subject || typeof config.subject !== 'string' || config.subject.trim() === '') {
            return res.status(400).json({
              error: `Auto-reply config ${i + 1}: subject is required when enabled is true`
            });
          }

          if (!config.message || typeof config.message !== 'string' || config.message.trim() === '') {
            return res.status(400).json({
              error: `Auto-reply config ${i + 1}: message is required when enabled is true`
            });
          }
        }
      }
    }

    // Add updatedBy from user info if available
    // TODO: Add proper authentication middleware to get user email/id
    if (req.user && req.user.email) {
      updates.updatedBy = req.user.email;
    } else {
      updates.updatedBy = 'admin';
    }

    // Check database connection status
    console.log('=== DATABASE CONNECTION STATUS ===');
    console.log('Connection state:', mongoose.connection.readyState); // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    console.log('Connection name:', mongoose.connection.name);
    
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected! State:', mongoose.connection.readyState);
      return res.status(503).json({
        error: 'Database connection not available',
        details: 'Please try again in a moment'
      });
    }

    // Log the updates being sent to the model
    console.log('=== SETTINGS UPDATE REQUEST ===');
    console.log('Updates to be saved:', JSON.stringify(updates, null, 2));

    // Update settings
    const updatedSettings = await Settings.updateSettings(updates);

    console.log('=== SETTINGS UPDATE RESPONSE ===');
    console.log('Settings after update:', {
      deliveryTiers: updatedSettings.deliveryTiers.length,
      freeDeliveryEnabled: updatedSettings.freeDeliveryThreshold.enabled,
      freeDeliveryAmount: updatedSettings.freeDeliveryThreshold.amount.toString(),
      vatRate: updatedSettings.vatRate,
      vatEnabled: updatedSettings.vatEnabled,
      lastUpdated: updatedSettings.lastUpdated
    });

    // Return updated settings with Decimal128 converted to numbers
    const response = {
      deliveryTiers: updatedSettings.deliveryTiers.map(tier => ({
        minAmount: parseFloat(tier.minAmount.toString()),
        maxAmount: tier.maxAmount ? parseFloat(tier.maxAmount.toString()) : null,
        fee: parseFloat(tier.fee.toString())
      })),
      freeDeliveryThreshold: {
        enabled: updatedSettings.freeDeliveryThreshold.enabled,
        amount: parseFloat(updatedSettings.freeDeliveryThreshold.amount.toString())
      },
      vatRate: updatedSettings.vatRate,
      vatEnabled: updatedSettings.vatEnabled,
      autoReplySettings: updatedSettings.autoReplySettings || [],
      lastUpdated: updatedSettings.lastUpdated,
      updatedBy: updatedSettings.updatedBy
    };

    console.log('=== SETTINGS RESPONSE TO CLIENT ===');
    console.log('Sending to frontend:', JSON.stringify(response, null, 2));

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: response
    });
  } catch (error) {
    console.error('Error updating settings:', error);

    // Handle validation errors from model
    if (error.message && error.message.includes('Tier')) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update settings',
      details: error.message
    });
  }
};

/**
 * Reset settings to default
 * Admin-only endpoint
 * @route POST /api/settings/reset
 */
const resetSettings = async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});

    // Create new default settings
    const defaultSettings = await Settings.getSettings();

    // Return default settings
    const response = {
      deliveryTiers: defaultSettings.deliveryTiers.map(tier => ({
        minAmount: parseFloat(tier.minAmount.toString()),
        maxAmount: tier.maxAmount ? parseFloat(tier.maxAmount.toString()) : null,
        fee: parseFloat(tier.fee.toString())
      })),
      freeDeliveryThreshold: {
        enabled: defaultSettings.freeDeliveryThreshold.enabled,
        amount: parseFloat(defaultSettings.freeDeliveryThreshold.amount.toString())
      },
      vatRate: defaultSettings.vatRate,
      vatEnabled: defaultSettings.vatEnabled,
      autoReplySettings: defaultSettings.autoReplySettings || [],
      lastUpdated: defaultSettings.lastUpdated,
      updatedBy: defaultSettings.updatedBy
    };

    res.status(200).json({
      message: 'Settings reset to default',
      settings: response
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      error: 'Failed to reset settings',
      details: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings
};
