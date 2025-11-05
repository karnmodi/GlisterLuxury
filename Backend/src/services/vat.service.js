/**
 * VAT Calculation Service
 *
 * Centralized service for all VAT-related calculations.
 * This ensures consistency across the entire application.
 *
 * UK VAT Rate: 20%
 * All product prices include VAT.
 */

const VAT_RATE = 0.20; // 20%

class VATService {
	/**
	 * Calculate VAT from gross amount (VAT already included in price)
	 * Formula: VAT = gross × (VAT_RATE / (1 + VAT_RATE))
	 *          VAT = gross × (20/120) = gross / 6
	 *
	 * @param {number} grossAmount - Price including VAT
	 * @returns {Object} { gross, net, vat, vatRate }
	 */
	static calculateVATFromGross(grossAmount) {
		const gross = parseFloat(grossAmount || 0);
		const vat = gross / 6; // 20% included calculation
		const net = gross - vat;

		return {
			gross: gross,
			net: net,
			vat: vat,
			vatRate: VAT_RATE
		};
	}

	/**
	 * Calculate VAT for a cart item's price components
	 *
	 * @param {Object} item - Cart item with price breakdown
	 * @returns {Object} VAT breakdown for all components
	 */
	static calculateItemVAT(item) {
		// Extract component prices
		const materialPrice = parseFloat(item.selectedMaterial?.basePrice?.toString() || item.selectedMaterial?.basePrice || 0);
		const sizePrice = parseFloat(item.sizeCost?.toString() || item.sizeCost || 0);
		const finishPrice = parseFloat(item.finishCost?.toString() || item.finishCost || 0);
		const packagingPrice = parseFloat(item.packagingPrice?.toString() || item.packagingPrice || 0);

		// Calculate VAT for each component
		const materialVAT = this.calculateVATFromGross(materialPrice);
		const sizeVAT = this.calculateVATFromGross(sizePrice);
		const finishVAT = this.calculateVATFromGross(finishPrice);
		const packagingVAT = this.calculateVATFromGross(packagingPrice);

		// Calculate total VAT for the item
		const unitPrice = parseFloat(item.unitPrice?.toString() || item.unitPrice || 0);
		const totalPrice = parseFloat(item.totalPrice?.toString() || item.totalPrice || 0);

		const unitVAT = this.calculateVATFromGross(unitPrice);
		const totalVAT = this.calculateVATFromGross(totalPrice);

		return {
			priceBreakdown: {
				materialVAT: materialVAT.vat,
				sizeVAT: sizeVAT.vat,
				finishesVAT: finishVAT.vat,
				packagingVAT: packagingVAT.vat,
				totalVAT: materialVAT.vat + sizeVAT.vat + finishVAT.vat + packagingVAT.vat
			},
			unitPriceVAT: unitVAT.vat,
			totalPriceVAT: totalVAT.vat
		};
	}

	/**
	 * Calculate cart-level VAT (after discount)
	 *
	 * @param {number} subtotal - Cart subtotal
	 * @param {number} discount - Discount amount
	 * @returns {number} VAT amount
	 */
	static calculateCartVAT(subtotal, discount = 0) {
		const totalAfterDiscount = Math.max(0, parseFloat(subtotal) - parseFloat(discount));
		return totalAfterDiscount / 6;
	}

	/**
	 * Get VAT rate as percentage string
	 * @returns {string} "20%"
	 */
	static getVATRateString() {
		return `${VAT_RATE * 100}%`;
	}

	/**
	 * Get VAT rate as decimal
	 * @returns {number} 0.20
	 */
	static getVATRate() {
		return VAT_RATE;
	}
}

module.exports = VATService;
