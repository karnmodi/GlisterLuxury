/**
 * Shipping Calculation Utility
 *
 * Calculates delivery fees based on tiered pricing structure
 * and free delivery threshold
 */

/**
 * Calculate shipping fee based on order total and settings
 * @param {number} orderTotal - The total order amount (after discount)
 * @param {Object} settings - Settings object from database
 * @returns {number} - Calculated shipping fee
 */
function calculateShippingFee(orderTotal, settings) {
  // If no settings provided, return 0 (backward compatible)
  if (!settings) {
    return 0;
  }

  // Convert to number if it's Decimal128
  const total = typeof orderTotal === 'number'
    ? orderTotal
    : parseFloat(orderTotal.toString());

  // Check free delivery threshold first
  if (settings.freeDeliveryThreshold && settings.freeDeliveryThreshold.enabled) {
    const threshold = parseFloat(settings.freeDeliveryThreshold.amount.toString());
    if (total >= threshold) {
      return 0; // Free delivery
    }
  }

  // If no tiers configured, return 0
  if (!settings.deliveryTiers || settings.deliveryTiers.length === 0) {
    return 0;
  }

  // Find matching tier
  for (const tier of settings.deliveryTiers) {
    const minAmount = parseFloat(tier.minAmount.toString());
    const maxAmount = tier.maxAmount ? parseFloat(tier.maxAmount.toString()) : Infinity;
    const fee = parseFloat(tier.fee.toString());

    // Check if order total falls within this tier
    if (total >= minAmount && total <= maxAmount) {
      return fee;
    }
  }

  // If no tier matches, check if it's above all tiers (use highest tier's fee)
  const sortedTiers = [...settings.deliveryTiers].sort((a, b) => {
    const aMax = a.maxAmount ? parseFloat(a.maxAmount.toString()) : Infinity;
    const bMax = b.maxAmount ? parseFloat(b.maxAmount.toString()) : Infinity;
    return bMax - aMax;
  });

  const highestTier = sortedTiers[0];
  if (highestTier) {
    return parseFloat(highestTier.fee.toString());
  }

  // Fallback to 0 if nothing matches
  return 0;
}

/**
 * Extract VAT from VAT-inclusive prices
 * Note: All prices are VAT-inclusive (UK B2C standard)
 * @param {number} taxableAmount - The VAT-inclusive amount (subtotal - discount + shipping)
 * @param {Object} settings - Settings object from database
 * @returns {number} - Extracted VAT amount
 */
function calculateVAT(taxableAmount, settings) {
  // If no settings or VAT disabled, return 0
  if (!settings || !settings.vatEnabled) {
    return 0;
  }

  // Convert to number if it's Decimal128
  const amount = typeof taxableAmount === 'number'
    ? taxableAmount
    : parseFloat(taxableAmount.toString());

  const vatRate = settings.vatRate || 20.0; // Default to 20% UK VAT

  // Extract VAT from inclusive price
  // Formula: VAT = price × (rate / (100 + rate))
  // For 20% VAT: VAT = price × (20/120) = price × 0.16666667
  return (amount * vatRate) / (100 + vatRate);
}

/**
 * Calculate complete order pricing with VAT-inclusive prices
 * Note: All prices are VAT-inclusive. VAT is extracted for display/reporting only.
 * @param {number} subtotal - Order subtotal (VAT included, before discount)
 * @param {number} discount - Discount amount
 * @param {Object} settings - Settings object from database
 * @returns {Object} - Complete pricing breakdown
 */
function calculateOrderPricing(subtotal, discount, settings) {
  const subtotalNum = typeof subtotal === 'number'
    ? subtotal
    : parseFloat(subtotal.toString());

  const discountNum = typeof discount === 'number'
    ? discount
    : parseFloat(discount.toString());

  // Total after discount (used for shipping tier calculation)
  const totalAfterDiscount = Math.max(0, subtotalNum - discountNum);

  // Calculate shipping
  const shipping = calculateShippingFee(totalAfterDiscount, settings);

  // Calculate VAT (extract from VAT-inclusive prices)
  // All prices already include VAT, so total doesn't change
  const taxableAmount = totalAfterDiscount + shipping;

  // Extract VAT amount for reporting
  const tax = calculateVAT(taxableAmount, settings);

  // Calculate final total (VAT already included in prices)
  const total = Math.max(0, subtotalNum - discountNum + shipping);

  return {
    subtotal: subtotalNum,
    discount: discountNum,
    shipping,
    tax,
    total,
    breakdown: {
      totalAfterDiscount,
      taxableAmount,
      vatRate: settings?.vatRate || 0
    }
  };
}

/**
 * Get delivery tier description for display
 * @param {number} orderTotal - The total order amount
 * @param {Object} settings - Settings object from database
 * @returns {Object} - Tier information and messaging
 */
function getDeliveryTierInfo(orderTotal, settings) {
  if (!settings || !settings.deliveryTiers || settings.deliveryTiers.length === 0) {
    return {
      currentFee: 0,
      tierMessage: 'No delivery fees configured',
      isFree: true
    };
  }

  const total = typeof orderTotal === 'number'
    ? orderTotal
    : parseFloat(orderTotal.toString());

  const shippingFee = calculateShippingFee(total, settings);
  const isFree = shippingFee === 0;

  // Check if free due to threshold
  if (settings.freeDeliveryThreshold && settings.freeDeliveryThreshold.enabled) {
    const threshold = parseFloat(settings.freeDeliveryThreshold.amount.toString());

    if (total >= threshold) {
      return {
        currentFee: 0,
        tierMessage: `Free delivery (order over £${threshold.toFixed(2)})`,
        isFree: true
      };
    } else {
      const remaining = threshold - total;
      return {
        currentFee: shippingFee,
        tierMessage: `Add £${remaining.toFixed(2)} more for free delivery`,
        isFree: false,
        amountToFreeDelivery: remaining
      };
    }
  }

  return {
    currentFee: shippingFee,
    tierMessage: isFree ? 'Free delivery' : `Delivery fee: £${shippingFee.toFixed(2)}`,
    isFree
  };
}

module.exports = {
  calculateShippingFee,
  calculateVAT,
  calculateOrderPricing,
  getDeliveryTierInfo
};
