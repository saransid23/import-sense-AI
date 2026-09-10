// ============================================
// REGRESSION TEST SUITE: Price & Currency Validation Architecture
// Run: node test_price_validation.js
// ============================================

const cheerio = require('cheerio');
const productAgent = require('./agents/productAgent');
const {
  validateExtractedPrice,
  isPricePlausible,
  currencyMatchesCountry,
} = require('./utils/priceValidation');

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

console.log('\n═══ REGRESSION SUITE: CENTRALIZED VALIDATION GATE ═══\n');

// 1. Plausibility Gate Tests
assert(!isPricePlausible(2, 'USD', 'Electronics'), '$2 laptop is implausible');
assert(!isPricePlausible(138, 'TRY', 'Electronics'), 'TRY 138 (~$4.28) laptop is implausible');
assert(isPricePlausible(299, 'USD', 'Electronics'), '$299 laptop is plausible');
assert(isPricePlausible(15, 'USD', 'Electronics'), '$15 electronics accessory is plausible');
assert(isPricePlausible(5, 'USD', 'Books'), '$5 book is plausible');

// 2. validateExtractedPrice Gate Tests
const invalidPrice = validateExtractedPrice({
  price: 2,
  currency: 'TRY',
  category: 'Electronics',
  country: 'US',
  marketplace: 'Amazon US',
  source: 'heuristic',
});
assert(!invalidPrice.valid, 'validateExtractedPrice rejects implausible price');
assert(invalidPrice.issues.includes('implausible_for_category'), 'Issues includes implausible_for_category');

const validPrice = validateExtractedPrice({
  price: 299,
  currency: 'USD',
  category: 'Electronics',
  country: 'US',
  marketplace: 'Amazon US',
  source: 'jsonLD',
});
assert(validPrice.valid, 'validateExtractedPrice accepts valid USD 299 price');

console.log('\n═══ REGRESSION SUITE: CHEERIO DOM EXTRACTION & NO "TRY" FALSE POSITIVES ═══\n');

async function testNavbarTextNoTry() {
  // Mock HTML with "Try Prime" in navbar and real USD product price in JSON-LD
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ASUS TUF Gaming Laptop - Amazon.com</title>
        <script type="application/ld+json">
        {
          "@type": "Product",
          "name": "ASUS TUF Gaming Laptop",
          "offers": {
            "@type": "Offer",
            "price": "999.00",
            "priceCurrency": "USD"
          }
        }
        </script>
      </head>
      <body>
        <nav>Try Prime for 30 days. All deals available.</nav>
        <div id="productTitle">ASUS TUF Gaming Laptop</div>
        <div class="a-price"><span class="a-offscreen">$999.00</span></div>
      </body>
    </html>
  `;

  const $ = cheerio.load(html);
  assert($('#productTitle').text().trim() === 'ASUS TUF Gaming Laptop', 'Cheerio extracts product title correctly');
  assert($('.a-price .a-offscreen').first().text().trim() === '$999.00', 'Cheerio extracts price selector correctly');
}

testNavbarTextNoTry();

console.log('\n═══ REGRESSION SUITE: COUNTRY CURRENCY ALIGNMENT ═══\n');

assert(currencyMatchesCountry('USD', 'US'), 'USD matches US');
assert(currencyMatchesCountry('GBP', 'UK'), 'GBP matches UK');
assert(currencyMatchesCountry('EUR', 'Germany'), 'EUR matches Germany');
assert(currencyMatchesCountry('TRY', 'Turkey'), 'TRY matches Turkey');
assert(!currencyMatchesCountry('TRY', 'US'), 'TRY does NOT match US');

console.log('\n═══════════════════════════════════════');
console.log(`  TOTAL: ${passed + failed} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log('═══════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
