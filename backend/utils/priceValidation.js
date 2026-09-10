// ============================================
// CENTRALIZED PRICE & CURRENCY VALIDATION GATE
// ============================================

const APPROXIMATE_USD_RATES = {
  USD: 1.0, EUR: 1.08, GBP: 1.27, JPY: 0.0067, CNY: 0.14,
  AUD: 0.65, CAD: 0.74, HKD: 0.13, SGD: 0.74, CHF: 1.13,
  KRW: 0.00075, SEK: 0.095, NOK: 0.094, DKK: 0.145, INR: 0.012,
  AED: 0.27, SAR: 0.27, QAR: 0.27, KWD: 3.26, BHD: 2.65, OMR: 2.60,
  TRY: 0.031, EGP: 0.021, ZAR: 0.055, ILS: 0.27,
  THB: 0.028, VND: 0.000040, IDR: 0.000064, PHP: 0.018, MYR: 0.22,
  TWD: 0.031, BRL: 0.20, MXN: 0.058, ARS: 0.0011,
  PLN: 0.25, CZK: 0.044, HUF: 0.0028, RON: 0.22,
  RUB: 0.011, UAH: 0.024, PKR: 0.0036,
};

const MIN_PLAUSIBLE_PRICE_USD = {
  Electronics: 15, Footwear: 8, Clothing: 5, Supplements: 5, Health: 5,
  Beauty: 3, Accessories: 5, Sports: 5, Books: 3, Toys: 3,
  HomeAppliances: 15, Other: 3,
};

const EXPECTED_CURRENCY_BY_COUNTRY = {
  'US': 'USD', 'UK': 'GBP', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR',
  'Spain': 'EUR', 'Japan': 'JPY', 'China': 'CNY', 'Australia': 'AUD',
  'Canada': 'CAD', 'South Korea': 'KRW', 'Singapore': 'SGD', 'Hong Kong': 'HKD',
  'UAE': 'AED', 'Saudi Arabia': 'SAR', 'Brazil': 'BRL', 'Mexico': 'MXN',
  'Turkey': 'TRY', 'Taiwan': 'TWD', 'Malaysia': 'MYR', 'Thailand': 'THB',
  'Vietnam': 'VND', 'Philippines': 'PHP', 'Indonesia': 'IDR',
};

/**
 * Check whether a price makes sense for the given category.
 */
function isPricePlausible(price, currency, category) {
  if (!price || price <= 0) return false;
  const rateToUSD = APPROXIMATE_USD_RATES[(currency || 'USD').toUpperCase()] || 0.05;
  const priceInUSD = price * rateToUSD;
  const minPrice = MIN_PLAUSIBLE_PRICE_USD[category] || MIN_PLAUSIBLE_PRICE_USD.Other;
  return priceInUSD >= minPrice;
}

/**
 * Check whether an extracted currency matches the expected currency for a country.
 */
function currencyMatchesCountry(currency, country) {
  if (!currency || !country) return true;
  const expected = EXPECTED_CURRENCY_BY_COUNTRY[country];
  if (!expected) return true;
  return currency.toUpperCase() === expected.toUpperCase();
}

/**
 * Single centralized validation gate every extracted candidate must pass through.
 *
 * @param {Object} candidate - { price, currency, category, country, marketplace, source }
 * @returns {Object} { valid: boolean, issues: string[], confidenceImpact: number }
 */
function validateExtractedPrice({ price, currency, category, country, marketplace, source }) {
  const issues = [];

  if (price == null || isNaN(price) || price <= 0) {
    issues.push('missing_or_zero_price');
  }

  if (price != null && !isPricePlausible(price, currency, category)) {
    issues.push('implausible_for_category');
  }

  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    issues.push('invalid_currency_code');
  }

  const isStructured = ['jsonLD', 'meta'].includes(source);
  if (currency && country && !isStructured && !currencyMatchesCountry(currency, country)) {
    issues.push('currency_country_mismatch');
  }

  const valid = issues.length === 0;

  return {
    valid,
    issues,
    confidenceImpact: valid ? 0 : -100,
  };
}

module.exports = {
  validateExtractedPrice,
  isPricePlausible,
  currencyMatchesCountry,
  APPROXIMATE_USD_RATES,
  MIN_PLAUSIBLE_PRICE_USD,
  EXPECTED_CURRENCY_BY_COUNTRY,
};
