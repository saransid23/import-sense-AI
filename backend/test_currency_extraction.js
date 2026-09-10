// ============================================
// TEST: Multi-Currency Extraction Verification
// Tests all fixes in productAgent.js:
//   Fix 1: No false-positive currency codes from page text
//   Fix 2: Price plausibility gate
//   Fix 3: Currency-aware number parsing + dynamic regex
// Run: node test_currency_extraction.js
// ============================================

// ─── Constants (copies from productAgent.js) ───
const CURRENCY_SYMBOLS = {
  'A$': 'AUD', 'C$': 'CAD', 'HK$': 'HKD', 'S$': 'SGD', 'NT$': 'TWD', 'NZ$': 'NZD',
  'R$': 'BRL', 'CN¥': 'CNY', 'RMB': 'CNY', 'RM': 'MYR', 'د.إ': 'AED', '﷼': 'SAR',
  '€': 'EUR', '£': 'GBP', '₹': 'INR', '₩': 'KRW', 'Fr': 'CHF', 'kr': 'SEK',
  '₺': 'TRY', '฿': 'THB', '₱': 'PHP', 'Rp': 'IDR', 'zł': 'PLN', 'Kč': 'CZK',
  'Ft': 'HUF', 'lei': 'RON', '¥': 'JPY', '$': 'USD',
  'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP', 'JPY': 'JPY', 'CNY': 'CNY',
  'AUD': 'AUD', 'CAD': 'CAD', 'HKD': 'HKD', 'SGD': 'SGD', 'CHF': 'CHF',
  'KRW': 'KRW', 'AED': 'AED', 'SAR': 'SAR', 'MYR': 'MYR', 'THB': 'THB',
  'PHP': 'PHP', 'IDR': 'IDR', 'BRL': 'BRL', 'TRY': 'TRY', 'MXN': 'MXN',
  'VND': 'VND', 'SEK': 'SEK', 'NOK': 'NOK', 'DKK': 'DKK', 'PLN': 'PLN',
};

const COMMA_DECIMAL_CURRENCIES = new Set([
  'EUR', 'TRY', 'PLN', 'CZK', 'HUF', 'RON', 'RUB', 'UAH', 'SEK', 'NOK', 'DKK',
  'BRL', 'ARS', 'CLP', 'COP', 'IDR', 'VND',
]);

const AMBIGUOUS_SYMBOLS = new Set(['$', '¥', 'kr', 'Fr']);

const APPROXIMATE_USD_RATES = {
  USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0067, CHF: 1.13, CAD: 0.74,
  AUD: 0.65, NZD: 0.60, CNY: 0.14, HKD: 0.13, SGD: 0.75, KRW: 0.00076,
  SEK: 0.095, NOK: 0.094, DKK: 0.145, INR: 0.012,
  AED: 0.27, SAR: 0.27, QAR: 0.27, KWD: 3.26, TRY: 0.031,
  THB: 0.028, VND: 0.000040, IDR: 0.000064, PHP: 0.018, MYR: 0.22,
  TWD: 0.031, BRL: 0.20, MXN: 0.058, PLN: 0.25, CZK: 0.044,
  HUF: 0.0028, RON: 0.22, RUB: 0.011,
};

const MIN_PLAUSIBLE_PRICE_USD = {
  Electronics: 15, Footwear: 8, Clothing: 5, Supplements: 5, Health: 5,
  Beauty: 3, Accessories: 5, Sports: 5, Books: 3, Toys: 3,
  HomeAppliances: 15, Other: 3,
};

// ─── Functions (copies from productAgent.js) ───
function detectCurrency(marketplace, url) {
  const lower = (url || '').toLowerCase();
  if (lower.includes('.co.uk')) return 'GBP';
  if (lower.includes('.de') || lower.includes('.fr') || lower.includes('.es') || lower.includes('.it')) return 'EUR';
  if (lower.includes('.co.jp') || lower.includes('.jp')) return 'JPY';
  if (lower.includes('.com.au')) return 'AUD';
  if (lower.includes('.ca')) return 'CAD';
  if (lower.includes('.co.kr') || lower.includes('.kr')) return 'KRW';
  if (lower.includes('.com.sg') || lower.includes('.sg')) return 'SGD';
  if (lower.includes('.com.hk') || lower.includes('.hk')) return 'HKD';
  if (lower.includes('.ae') || lower.includes('noon.com')) return 'AED';
  if (lower.includes('.sa')) return 'SAR';
  if (lower.includes('.com.br') || lower.includes('.br')) return 'BRL';
  if (lower.includes('.com.mx') || lower.includes('.mx')) return 'MXN';
  if (lower.includes('.com.tr') || lower.includes('.tr')) return 'TRY';
  if (lower.includes('.ch')) return 'CHF';
  if (lower.includes('.se')) return 'SEK';
  if (lower.includes('.pl')) return 'PLN';
  if (lower.includes('.cz')) return 'CZK';
  if (lower.includes('.hu')) return 'HUF';
  if (lower.includes('.th')) return 'THB';
  if (lower.includes('.co.id') || lower.includes('.id')) return 'IDR';
  return 'USD';
}

function cleanPrice(str, currencyHint) {
  if (!str) return null;
  let cleaned = str.replace(/[^\d.,'\s\u00A0\u202F]/g, '').trim();
  if (!cleaned) return null;
  cleaned = cleaned.replace(/[\s'\u00A0\u202F]/g, '');
  if (!cleaned) return null;
  const useCommaDecimal = currencyHint && COMMA_DECIMAL_CURRENCIES.has(currencyHint.toUpperCase());
  let normalized;
  if (useCommaDecimal) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const val = parseFloat(normalized);
  return (val > 0 && val < 100000000) ? val : null;
}

function resolveSymbolCurrency(symbol, marketplace, url) {
  if (!symbol) return null;
  const trimmed = symbol.trim();
  if (/^[A-Z]{3}$/i.test(trimmed)) return trimmed.toUpperCase();
  const tableCurrency = CURRENCY_SYMBOLS[trimmed];
  if (tableCurrency && !AMBIGUOUS_SYMBOLS.has(trimmed)) return tableCurrency;
  if (AMBIGUOUS_SYMBOLS.has(trimmed)) {
    const domainCurrency = detectCurrency(marketplace, url);
    if (domainCurrency && domainCurrency !== 'USD') return domainCurrency;
    return tableCurrency || domainCurrency || 'USD';
  }
  return tableCurrency || null;
}

function extractCurrencySymbolNearContext(text) {
  if (!text) return null;
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (sym.length > 1 && !/^[A-Z]{3}$/i.test(sym) && text.includes(sym)) return code;
  }
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (sym.length === 1 && !/[A-Za-z]/.test(sym) && text.includes(sym)) return code;
  }
  return null;
}

function isPricePlausible(price, currency, category) {
  if (!price || price <= 0) return false;
  const rateToUSD = APPROXIMATE_USD_RATES[(currency || 'USD').toUpperCase()] || 0.05;
  const priceInUSD = price * rateToUSD;
  const minPrice = MIN_PLAUSIBLE_PRICE_USD[category] || MIN_PLAUSIBLE_PRICE_USD.Other;
  return priceInUSD >= minPrice;
}

// ============================================
// TEST RUNNER
// ============================================
let passed = 0;
let failed = 0;

function assert(testName, actual, expected) {
  if (actual === expected) {
    console.log(`  \u2705 ${testName}: ${actual}`);
    passed++;
  } else {
    console.log(`  \u274C ${testName}: expected ${expected}, got ${actual}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════
// FIX 1: No false-positive currency codes
// ═══════════════════════════════════════════════
console.log('\n\u2550\u2550\u2550 FIX 1: extractCurrencySymbolNearContext (no TRY false-positives) \u2550\u2550\u2550\n');

// "Try Prime" should NOT produce TRY
assert('"Try Prime" -> null (no false TRY)', extractCurrencySymbolNearContext('Try Prime for free'), null);
assert('"Try it now" -> null', extractCurrencySymbolNearContext('Try it now and save'), null);
assert('"All items" -> null (no false ALL)', extractCurrencySymbolNearContext('All items on sale'), null);
assert('"Cop this look" -> null (no false COP)', extractCurrencySymbolNearContext('Cop this look for summer'), null);

// Real currency symbols SHOULD still be detected
assert('"\u20ac1,234" -> EUR', extractCurrencySymbolNearContext('Price: \u20ac1,234.56'), 'EUR');
assert('"\u00a3999" -> GBP', extractCurrencySymbolNearContext('Only \u00a3999.99'), 'GBP');
assert('"\u20b9" -> INR', extractCurrencySymbolNearContext('MRP \u20b912,345'), 'INR');
assert('"\u20ba" -> TRY', extractCurrencySymbolNearContext('\u20ba2.999,90'), 'TRY');
assert('"HK$" -> HKD', extractCurrencySymbolNearContext('HK$1,234'), 'HKD');
assert('"A$" -> AUD', extractCurrencySymbolNearContext('A$499'), 'AUD');
assert('"Rp" -> IDR', extractCurrencySymbolNearContext('Rp 1.500.000'), 'IDR');
assert('"z\u0142" -> PLN', extractCurrencySymbolNearContext('z\u0142 249,99'), 'PLN');
assert('"K\u010d" -> CZK', extractCurrencySymbolNearContext('K\u010d 6.499'), 'CZK');

console.log('\n\u2550\u2550\u2550 FIX 1: $ disambiguation (domain wins for ambiguous symbols) \u2550\u2550\u2550\n');

assert('$ on .com.au -> AUD', resolveSymbolCurrency('$', 'Amazon AU', 'https://www.amazon.com.au/x'), 'AUD');
assert('$ on .ca -> CAD', resolveSymbolCurrency('$', 'Amazon CA', 'https://www.amazon.ca/x'), 'CAD');
assert('$ on .com -> USD', resolveSymbolCurrency('$', 'Amazon US', 'https://www.amazon.com/product'), 'USD');
assert('\u00a5 on .jp -> JPY', resolveSymbolCurrency('\u00a5', 'Store', 'https://shop.example.co.jp/item'), 'JPY');
assert('\u20b9 always -> INR', resolveSymbolCurrency('\u20b9', 'Amazon US', 'https://www.amazon.com/x'), 'INR');
assert('\u00a3 always -> GBP', resolveSymbolCurrency('\u00a3', 'Amazon US', 'https://www.amazon.com/x'), 'GBP');
assert('\u20ba always -> TRY', resolveSymbolCurrency('\u20ba', 'Amazon US', 'https://www.amazon.com/x'), 'TRY');
assert('AED code -> AED', resolveSymbolCurrency('AED', 'Amazon US', 'https://www.amazon.com/x'), 'AED');

// ═══════════════════════════════════════════════
// FIX 2: Price plausibility gate
// ═══════════════════════════════════════════════
console.log('\n\u2550\u2550\u2550 FIX 2: isPricePlausible() \u2550\u2550\u2550\n');

// Implausible prices — should be rejected
assert('$2 laptop -> implausible', isPricePlausible(2, 'USD', 'Electronics'), false);
assert('$0 anything -> implausible', isPricePlausible(0, 'USD', 'Electronics'), false);
assert('$5 laptop -> implausible', isPricePlausible(5, 'USD', 'Electronics'), false);
assert('TRY 2 laptop -> implausible', isPricePlausible(2, 'TRY', 'Electronics'), false);
assert('TRY 138 (~$4.28) laptop -> implausible', isPricePlausible(138, 'TRY', 'Electronics'), false);

// Plausible prices — should pass
assert('$299 laptop -> plausible', isPricePlausible(299, 'USD', 'Electronics'), true);
assert('$999 laptop -> plausible', isPricePlausible(999, 'USD', 'Electronics'), true);
assert('$15 Electronics -> plausible', isPricePlausible(15, 'USD', 'Electronics'), true);
assert('$5 Book -> plausible', isPricePlausible(5, 'USD', 'Books'), true);
assert('$3 Book -> plausible', isPricePlausible(3, 'USD', 'Books'), true);
assert('\u20ba1000 Electronics -> plausible', isPricePlausible(1000, 'TRY', 'Electronics'), true);
assert('\u00a310 Clothing -> plausible', isPricePlausible(10, 'GBP', 'Clothing'), true);
assert('Rp 500000 Electronics -> plausible', isPricePlausible(500000, 'IDR', 'Electronics'), true);
assert('\u00a515800 Electronics -> plausible', isPricePlausible(15800, 'JPY', 'Electronics'), true);
assert('AED 459 Electronics -> plausible', isPricePlausible(459, 'AED', 'Electronics'), true);

// Edge cases
assert('$2 Book -> implausible', isPricePlausible(2, 'USD', 'Books'), false);
assert('null price -> implausible', isPricePlausible(null, 'USD', 'Electronics'), false);

// ═══════════════════════════════════════════════
// FIX 3: Currency-aware cleanPrice
// ═══════════════════════════════════════════════
console.log('\n\u2550\u2550\u2550 FIX 3: cleanPrice() currency-aware parsing \u2550\u2550\u2550\n');

assert('EUR 1.234,56', cleanPrice('1.234,56', 'EUR'), 1234.56);
assert('TRY 2.999,90', cleanPrice('2.999,90', 'TRY'), 2999.90);
assert('USD 1,234.56', cleanPrice('1,234.56', 'USD'), 1234.56);
assert('GBP 999.99', cleanPrice('999.99', 'GBP'), 999.99);
assert('JPY 15,800', cleanPrice('15,800', 'JPY'), 15800);
assert('AED 459.00', cleanPrice('459.00', 'AED'), 459.00);
assert('IDR 1.500.000', cleanPrice('1.500.000', 'IDR'), 1500000);
assert('PLN 249,99', cleanPrice('249,99', 'PLN'), 249.99);
assert('EUR space thousands', cleanPrice('1 234,56', 'EUR'), 1234.56);
assert('CHF apostrophe', cleanPrice("1'234.56", 'CHF'), 1234.56);
assert('INR Indian grouping', cleanPrice('1,23,456.78', 'INR'), 123456.78);
assert('EUR 2.500 -> 2500', cleanPrice('2.500', 'EUR'), 2500);
assert('USD 2.500 -> 2.5', cleanPrice('2.500', 'USD'), 2.5);
assert('HUF 89.990 -> 89990', cleanPrice('89.990', 'HUF'), 89990);
assert('VND 1.500.000 -> 1500000', cleanPrice('1.500.000', 'VND'), 1500000);
assert('CZK 6.499,00 -> 6499', cleanPrice('6.499,00', 'CZK'), 6499.00);

// ═══════════════════════════════════════════════
// FIX 3 (cont): Dynamic regex coverage
// ═══════════════════════════════════════════════
console.log('\n\u2550\u2550\u2550 FIX 3: Dynamic HEURISTIC_PRICE_REGEX coverage \u2550\u2550\u2550\n');

const ALL_SYM = Object.keys(CURRENCY_SYMBOLS)
  .filter(s => !/^[A-Z]{3}$/.test(s))
  .sort((a, b) => b.length - a.length);
const ESCAPED = ALL_SYM
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const ISO_CODES = [
  'USD','EUR','GBP','JPY','CNY','AUD','CAD','HKD','SGD','CHF',
  'KRW','AED','SAR','MYR','THB','PHP','IDR','BRL','TRY','MXN',
  'VND','SEK','NOK','DKK','PLN','CZK','HUF','NZD','ZAR','QAR',
  'KWD','RON','TWD','RUB','UAH','INR','PKR','BDT','LKR','NPR',
  'EGP','ILS','NGN','KES','PEN','COP','CLP','ARS',
].join('|');
const HEURISTIC_PRICE_REGEX = new RegExp(
  `(?:${ESCAPED}|\\b(?:${ISO_CODES})\\b)\\s*([\\d,.\\s'\\u00A0]+)`,
  'g'
);

const regexTests = [
  { input: '\u20ba2.999,90', desc: 'Turkish Lira' },
  { input: '\u20b11,234.56', desc: 'Philippine Peso' },
  { input: 'Rp 1.500.000', desc: 'Indonesian Rupiah' },
  { input: 'z\u01421 249,99', desc: 'Polish Zloty' },
  { input: 'K\u010d 6.499', desc: 'Czech Koruna' },
  { input: 'Ft 89990', desc: 'Hungarian Forint' },
  { input: 'lei 449,99', desc: 'Romanian Leu' },
  { input: '\u0e3f1,234', desc: 'Thai Baht' },
  { input: 'AED 459.00', desc: 'UAE Dirham (code)' },
  { input: 'SAR 150.00', desc: 'Saudi Riyal (code)' },
  { input: 'HK$1,234.00', desc: 'Hong Kong Dollar' },
  { input: 'kr 2.499', desc: 'Swedish Krona' },
  { input: 'R$1.234,56', desc: 'Brazilian Real' },
  { input: 'RM 599.00', desc: 'Malaysian Ringgit' },
  { input: '\u20ac1.234,56', desc: 'Euro' },
  { input: '\u00a3999.99', desc: 'British Pound' },
  { input: '\u20b912,345', desc: 'Indian Rupee' },
  { input: '\u20a915800', desc: 'Korean Won' },
  { input: '$1,234.56', desc: 'Dollar' },
  { input: '\u00a515800', desc: 'Yen' },
];

for (const { input, desc } of regexTests) {
  HEURISTIC_PRICE_REGEX.lastIndex = 0;
  const match = HEURISTIC_PRICE_REGEX.exec(input);
  if (match) {
    console.log(`  \u2705 Regex matches ${desc}: "${input}"`);
    passed++;
  } else {
    console.log(`  \u274C Regex MISSES ${desc}: "${input}"`);
    failed++;
  }
}

// CRITICAL: "Try Prime" should NOT match the heuristic regex for TRY
console.log('\n\u2550\u2550\u2550 FIX 1+3: Heuristic regex does NOT false-match "Try" \u2550\u2550\u2550\n');
HEURISTIC_PRICE_REGEX.lastIndex = 0;
const tryPrimeMatch = HEURISTIC_PRICE_REGEX.exec('Try Prime for free today');
assert('"Try Prime" does NOT match as TRY', tryPrimeMatch, null);

HEURISTIC_PRICE_REGEX.lastIndex = 0;
const tryNowMatch = HEURISTIC_PRICE_REGEX.exec('Try it now — free shipping');
assert('"Try it now" does NOT match as TRY', tryNowMatch, null);

// But "TRY 2999" (standalone code with digits) SHOULD match
HEURISTIC_PRICE_REGEX.lastIndex = 0;
const realTryMatch = HEURISTIC_PRICE_REGEX.exec('TRY 2999.90');
assert('"TRY 2999.90" DOES match', realTryMatch !== null, true);

// ─── SUMMARY ───
console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
console.log(`  TOTAL: ${passed + failed} tests | \u2705 ${passed} passed | \u274C ${failed} failed`);
console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');

process.exit(failed > 0 ? 1 : 0);
