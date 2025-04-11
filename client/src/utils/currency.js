// Currency formatting utility functions

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'INR')
 * @param {string} locale - The locale to use for formatting (default: 'en-IN')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Parse a currency string back to a number
 * @param {string} currencyString - The currency string to parse
 * @param {string} locale - The locale to use for parsing (default: 'en-IN')
 * @returns {number} The parsed number
 */
export const parseCurrency = (currencyString, locale = 'en-IN') => {
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(0);
  const decimalSeparator = parts.find(part => part.type === 'decimal')?.value || '.';
  const groupSeparator = parts.find(part => part.type === 'group')?.value || ',';
  
  // Remove currency symbol and group separators, then parse
  const cleanString = currencyString
    .replace(/[^\d\-.,]/g, '') // Remove all non-numeric characters except decimal and group separators
    .replace(new RegExp(`\\${groupSeparator}`, 'g'), '') // Remove group separators
    .replace(decimalSeparator, '.'); // Convert decimal separator to standard format
    
  return parseFloat(cleanString);
}; 