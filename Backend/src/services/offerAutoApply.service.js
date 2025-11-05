const Offer = require('../models/Offer');
const Order = require('../models/Order');

/**
 * Helper function to convert Decimal128 to number
 */
const toNumber = (decimal) => {
	if (!decimal) return 0;
	if (typeof decimal === 'number') return decimal;
	return parseFloat(decimal.toString());
};

class OfferAutoApplyService {

	/**
	 * Find all eligible auto-apply offers for a cart
	 * @param {Object} cart - Cart document
	 * @param {String} userId - User ID (optional)
	 * @returns {Array} Array of eligible offers with calculated discounts
	 */
	async findEligibleAutoOffers(cart, userId = null) {
		const currentDate = new Date();
		const subtotal = toNumber(cart.subtotal);

		// Build query for active auto-apply offers
		const query = {
			autoApply: true,
			isActive: true,
			minOrderAmount: { $lte: subtotal }
		};

		// Fetch all potentially eligible offers, sorted by priority and discount value
		let offers = await Offer.find(query).sort({ priority: -1, discountValue: -1 });

		// Filter based on validity and user eligibility
		const eligibleOffers = [];

		for (const offer of offers) {
			// Check date validity
			if (offer.validFrom && currentDate < offer.validFrom) {
				continue; // Not started yet
			}

			if (offer.validTo && currentDate > offer.validTo) {
				continue; // Expired
			}

			// Check usage limit
			if (offer.maxUses !== null && offer.usedCount >= offer.maxUses) {
				continue; // Max uses reached
			}

			// Check user eligibility
			if (offer.applicableTo === 'new_users') {
				if (!userId) {
					// Guest user - treat as new
					eligibleOffers.push(offer);
				} else {
					// Check if user has completed orders
					const orderCount = await Order.countDocuments({
						userID: userId,
						status: { $ne: 'cancelled' }
					});

					if (orderCount === 0) {
						eligibleOffers.push(offer);
					}
				}
			} else {
				// 'all' users
				eligibleOffers.push(offer);
			}
		}

		// Calculate discount for each eligible offer
		const offersWithDiscounts = eligibleOffers.map(offer => {
			const discount = this.calculateOfferDiscount(offer, subtotal);
			return {
				offer,
				calculatedDiscount: discount,
				priority: offer.priority || 0
			};
		});

		return offersWithDiscounts;
	}

	/**
	 * Calculate discount amount for an offer
	 * @param {Object} offer - Offer document
	 * @param {Number} amount - Cart subtotal
	 * @returns {Number} Calculated discount amount
	 */
	calculateOfferDiscount(offer, amount) {
		if (offer.discountType === 'percentage') {
			const discount = (amount * toNumber(offer.discountValue)) / 100;
			return Math.round(discount * 100) / 100;
		} else {
			// Fixed amount - can't exceed cart total
			return Math.min(toNumber(offer.discountValue), amount);
		}
	}

	/**
	 * Select the best offer from eligible offers
	 * Selection strategy: Highest discount amount, then highest priority
	 * @param {Array} offersWithDiscounts - Array of {offer, calculatedDiscount, priority}
	 * @returns {Object|null} Best offer object or null
	 */
	selectBestOffer(offersWithDiscounts) {
		if (!offersWithDiscounts || offersWithDiscounts.length === 0) {
			return null;
		}

		// Sort by discount amount (descending), then priority (descending)
		const sorted = offersWithDiscounts.sort((a, b) => {
			if (b.calculatedDiscount !== a.calculatedDiscount) {
				return b.calculatedDiscount - a.calculatedDiscount;
			}
			return b.priority - a.priority;
		});

		return sorted[0];
	}

	/**
	 * Compare two offers and return the better one
	 * @param {Object} currentOffer - Current applied offer {offer, calculatedDiscount}
	 * @param {Object} newOffer - New offer to compare {offer, calculatedDiscount}
	 * @returns {Object} Better offer
	 */
	compareOffers(currentOffer, newOffer) {
		if (!currentOffer) return newOffer;
		if (!newOffer) return currentOffer;

		// Compare discount amounts first
		if (newOffer.calculatedDiscount > currentOffer.calculatedDiscount) {
			return newOffer;
		} else if (newOffer.calculatedDiscount < currentOffer.calculatedDiscount) {
			return currentOffer;
		}

		// If equal, compare priority
		const currentPriority = currentOffer.priority || 0;
		const newPriority = newOffer.priority || 0;

		return newPriority > currentPriority ? newOffer : currentOffer;
	}

	/**
	 * Apply the best auto-apply offer to cart
	 * @param {Object} cart - Cart document
	 * @param {String} userId - User ID (optional)
	 * @returns {Object} Updated cart with applied offer
	 */
	async applyBestAutoOffer(cart, userId = null) {
		// Don't override if user manually applied a code and it's locked
		if (cart.manualCodeLocked && cart.discountApplicationMethod === 'manual') {
			return cart;
		}

		// Find all eligible offers
		const eligibleOffers = await this.findEligibleAutoOffers(cart, userId);

		// Store eligible offers for UI hints
		cart.eligibleAutoOffers = eligibleOffers.map(eo => ({
			offerID: eo.offer._id,
			calculatedDiscount: eo.calculatedDiscount,
			priority: eo.priority
		}));

		// Select best offer
		const bestOffer = this.selectBestOffer(eligibleOffers);

		if (!bestOffer) {
			// No eligible auto-apply offers
			// Only clear if current discount was auto-applied
			if (cart.isAutoApplied) {
				cart.discountCode = undefined;
				cart.discountAmount = 0;
				cart.offerID = undefined;
				cart.isAutoApplied = false;
				cart.discountApplicationMethod = 'none';
			}
			return cart;
		}

		// Check if we should apply this offer
		const shouldApply = this.shouldApplyOffer(cart, bestOffer);

		if (shouldApply) {
			cart.discountCode = bestOffer.offer.code || `AUTO_${bestOffer.offer._id}`;
			cart.discountAmount = bestOffer.calculatedDiscount;
			cart.offerID = bestOffer.offer._id;
			cart.isAutoApplied = true;
			cart.discountApplicationMethod = 'auto';

			// Increment auto-apply count on offer
			await Offer.findByIdAndUpdate(bestOffer.offer._id, {
				$inc: { autoApplyCount: 1 }
			});
		}

		return cart;
	}

	/**
	 * Determine if offer should be applied
	 * @param {Object} cart - Cart document
	 * @param {Object} newOffer - New offer to apply {offer, calculatedDiscount}
	 * @returns {Boolean} Should apply or not
	 */
	shouldApplyOffer(cart, newOffer) {
		// No current discount - apply new offer
		if (!cart.offerID) {
			return true;
		}

		// Current discount is manual and locked - don't override
		if (cart.manualCodeLocked && cart.discountApplicationMethod === 'manual') {
			return false;
		}

		// Current discount is auto-applied - check if new offer is better
		if (cart.isAutoApplied) {
			const currentDiscount = toNumber(cart.discountAmount);
			return newOffer.calculatedDiscount > currentDiscount;
		}

		// Current discount is manual but not locked
		// Compare and apply if new offer is significantly better (e.g., 10% more savings)
		const currentDiscount = toNumber(cart.discountAmount);
		const improvementThreshold = 1.1; // 10% better
		return newOffer.calculatedDiscount >= currentDiscount * improvementThreshold;
	}

	/**
	 * Get near-miss offers (offers customer is close to qualifying for)
	 * @param {Object} cart - Cart document
	 * @param {String} userId - User ID (optional)
	 * @returns {Array} Array of near-miss offers with gap amount
	 */
	async getNearMissOffers(cart, userId = null) {
		const currentDate = new Date();
		const subtotal = toNumber(cart.subtotal);

		// Find offers where cart is close to minOrderAmount (within £20)
		const query = {
			autoApply: true,
			isActive: true,
			showInCart: true,
			minOrderAmount: {
				$gt: subtotal,
				$lte: subtotal + 20 // Within £20 of qualifying
			},
			validFrom: { $lte: currentDate },
			$or: [
				{ validTo: { $exists: false } },
				{ validTo: null },
				{ validTo: { $gte: currentDate } }
			]
		};

		const nearMissOffers = await Offer.find(query)
			.sort({ minOrderAmount: 1 })
			.limit(3); // Show top 3

		return nearMissOffers.map(offer => ({
			offer,
			gapAmount: toNumber(offer.minOrderAmount) - subtotal,
			potentialDiscount: this.calculateOfferDiscount(offer, toNumber(offer.minOrderAmount))
		}));
	}
}

module.exports = new OfferAutoApplyService();
