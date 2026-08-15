// Currency formatting utilities for Nepali Rupee (NPR)

export const CURRENCY = {
  NPR: 'NPR',
  SYMBOL: 'Rs.',
}

/**
 * Format a number as Nepali Rupee
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show Rs. or NPR (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return 'Rs. 0'

  const num = parseFloat(amount)
  if (isNaN(num)) return 'Rs. 0'

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num))

  return showSymbol ? `Rs. ${formatted}` : formatted
}

/**
 * Format currency with decimals (for detailed pricing)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show Rs. or NPR
 * @returns {string} Formatted currency string with decimals
 */
export const formatCurrencyWithDecimals = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return 'Rs. 0.00'

  const num = parseFloat(amount)
  if (isNaN(num)) return 'Rs. 0.00'

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)

  return showSymbol ? `Rs. ${formatted}` : formatted
}

/**
 * Parse currency input and return numeric value
 * @param {string} input - Currency input string (e.g., "Rs. 1500" or "1500")
 * @returns {number} Numeric value
 */
export const parseCurrency = (input) => {
  if (!input) return 0
  // Remove Rs., NPR, and other non-numeric characters (except dot)
  const cleaned = input.replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format range of currency values
 * @param {number} min - Minimum amount
 * @param {number} max - Maximum amount
 * @returns {string} Formatted range
 */
export const formatCurrencyRange = (min, max) => {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

/**
 * Format large numbers with abbreviations (e.g., 1.5K, 2.3M)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted abbreviated currency
 */
export const formatCurrencyAbbreviated = (amount) => {
  if (amount === null || amount === undefined) return 'Rs. 0'

  const num = parseFloat(amount)
  if (isNaN(num)) return 'Rs. 0'

  let displayNum = num
  let suffix = ''

  if (Math.abs(num) >= 1000000) {
    displayNum = (num / 1000000).toFixed(1)
    suffix = 'M'
  } else if (Math.abs(num) >= 1000) {
    displayNum = (num / 1000).toFixed(1)
    suffix = 'K'
  }

  return `Rs. ${displayNum}${suffix}`
}

/**
 * Check if a value is a valid currency amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid currency amount
 */
export const isValidCurrency = (amount) => {
  const num = parseFloat(amount)
  return !isNaN(num) && isFinite(num) && num >= 0
}
