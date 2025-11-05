/**
 * Convert MongoDB Decimal128 to number
 * Handles both plain numbers and Decimal128 objects
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) return 0
  
  // If it's already a number, return it
  if (typeof value === 'number') return value
  
  // If it's a Decimal128 object from MongoDB
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal)
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

/**
 * Format number as currency
 */
export function formatCurrency(value: any, currency: string = 'GBP'): string {
  const num = toNumber(value)
  return `£${num.toFixed(2)}`
}

/**
 * Format discount label based on discount type and value
 * @param discountType - 'percentage' | 'fixed' | null
 * @param discountValue - The discount value (e.g., 20 for 20% or £20)
 * @returns Formatted discount label (e.g., "20% OFF" or "£20 OFF")
 */
export function formatDiscountLabel(
  discountType: 'percentage' | 'fixed' | null | undefined,
  discountValue: any
): string {
  if (!discountType || !discountValue) return ''

  const value = toNumber(discountValue)

  if (discountType === 'percentage') {
    return `${value}% OFF`
  } else if (discountType === 'fixed') {
    return `${formatCurrency(value)} OFF`
  }

  return ''
}

/**
 * Calculate VAT from gross amount (VAT already included)
 * UK VAT Rate: 20% included in price
 * Formula: VAT = gross / 6
 * @param grossAmount - Price including VAT
 * @returns Object with gross, net, vat, and vatRate
 */
export function calculateVAT(grossAmount: any): {
  gross: number
  net: number
  vat: number
  vatRate: number
} {
  const gross = toNumber(grossAmount)
  const vat = gross / 6 // 20% included = gross * (20/120) = gross / 6
  const net = gross - vat

  return {
    gross,
    net,
    vat,
    vatRate: 0.20
  }
}

/**
 * Format VAT string for display
 * @param vatAmount - The VAT amount
 * @returns Formatted string like "£16.67 @ 20%"
 */
export function formatVATString(vatAmount: any): string {
  const vat = toNumber(vatAmount)
  return `${formatCurrency(vat)} @ 20%`
}

/**
 * Get VAT breakdown for a price component
 * @param amount - The component amount (material, size, finish, packaging)
 * @returns Formatted breakdown string
 */
export function formatVATBreakdown(amount: any): string {
  const { net, vat } = calculateVAT(amount)
  return `Excl. VAT: ${formatCurrency(net)}, VAT: ${formatCurrency(vat)}`
}

