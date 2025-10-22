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

