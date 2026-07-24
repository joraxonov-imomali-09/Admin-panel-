/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Currency formatting utilities for consistent display across the application.
 */

import { CurrencyType } from '../types';

/**
 * Format a price according to currency type and locale
 * @param price - The price amount
 * @param currency - Currency type ('USD' or 'UZS')
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: CurrencyType): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(price);
  } else {
    // UZS: display as "1,234,567 so'm" (Uzbek currency symbol)
    return new Intl.NumberFormat('uz-UZ', { 
      style: 'decimal', 
      maximumFractionDigits: 0 
    }).format(price) + " so'm";
  }
};

/**
 * Get currency symbol for display
 * @param currency - Currency type
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: CurrencyType): string => {
  return currency === 'USD' ? '$' : "so'm";
};

/**
 * Get currency label for forms/selects
 * @param currency - Currency type
 * @returns Currency label with symbol
 */
export const getCurrencyLabel = (currency: CurrencyType): string => {
  return currency === 'USD' ? 'USD ($)' : "UZS (so'm)";
};
