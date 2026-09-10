// ============================================
// AGENT 1 — PRODUCT AGENT (Architecture Refactored)
// Extracts complete product identity from URL
// Powered by Cheerio DOM parsing & central validation gate
// ============================================
// Scraping priority:
//   1. JSON-LD structured data (most reliable)
//   2. Open Graph / product meta tags (via Cheerio DOM)
//   3. Marketplace CSS selectors (via Cheerio DOM)
//   4. Intelligent heuristic fallback (via Cheerio DOM)
// ============================================

const cheerio = require('cheerio');
const demoProducts = require('../data/demoProducts');
const {
  validateExtractedPrice,
  isPricePlausible,
  currencyMatchesCountry,
  EXPECTED_CURRENCY_BY_COUNTRY,
} = require('../utils/priceValidation');

// ─── Marketplace Detection ───────────────────────────────────
function identifyMarketplace(url) {
  const lower = url.toLowerCase();
  if (lower.includes('aliexpress')) return 'AliExpress';
  if (lower.includes('amazon.com') && !lower.includes('amazon.in')) return 'Amazon US';
  if (lower.includes('amazon.co.uk')) return 'Amazon UK';
  if (lower.includes('amazon.de')) return 'Amazon DE';
  if (lower.includes('amazon.ca')) return 'Amazon CA';
  if (lower.includes('amazon.com.au')) return 'Amazon AU';
  if (lower.includes('ebay.com')) return 'eBay US';
  if (lower.includes('ebay.co.uk')) return 'eBay UK';
  if (lower.includes('shein')) return 'Shein';
  if (lower.includes('iherb')) return 'iHerb';
  if (lower.includes('temu')) return 'Temu';
  if (lower.includes('alibaba')) return 'Alibaba';
  if (lower.includes('walmart')) return 'Walmart';
  if (lower.includes('bestbuy')) return 'Best Buy';
  if (lower.includes('apple.com')) return 'Apple Store';
  if (lower.includes('samsung.com')) return 'Samsung Store';
  if (lower.includes('newegg')) return 'Newegg';
  if (lower.includes('bhphotovideo')) return 'B&H Photo';
  if (lower.includes('nike.com')) return 'Nike';
  if (lower.includes('adidas')) return 'Adidas';
  if (lower.includes('target.com')) return 'Target';
  if (lower.includes('costco')) return 'Costco';
  if (lower.includes('etsy')) return 'Etsy';
  return 'International Store';
}

function detectCurrency(marketplace, url) {
  const lower = url.toLowerCase();
  if (lower.includes('.co.uk') || lower.includes('/en-gb') || lower.includes('amazon.co.uk') || lower.includes('ebay.co.uk')) return 'GBP';
  if (lower.includes('.de') || lower.includes('.fr') || lower.includes('.es') || lower.includes('.it') || lower.includes('.nl') || lower.includes('.eu') || lower.includes('.be') || lower.includes('.at') || lower.includes('.pt') || lower.includes('.fi') || lower.includes('.ie') || lower.includes('.gr')) return 'EUR';
  if (lower.includes('.co.jp') || lower.includes('.jp') || lower.includes('amazon.co.jp')) return 'JPY';
  if (lower.includes('.cn') || lower.includes('taobao.com') || lower.includes('1688.com') || lower.includes('tmall.com')) return 'CNY';
  if (lower.includes('.com.au') || lower.includes('amazon.com.au')) return 'AUD';
  if (lower.includes('.ca') || lower.includes('amazon.ca')) return 'CAD';
  if (lower.includes('.co.kr') || lower.includes('.kr') || lower.includes('coupang.com')) return 'KRW';
  if (lower.includes('.com.sg') || lower.includes('.sg') || lower.includes('shopee.sg') || lower.includes('lazada.sg')) return 'SGD';
  if (lower.includes('.com.hk') || lower.includes('.hk')) return 'HKD';
  if (lower.includes('.com.tw') || lower.includes('.tw')) return 'TWD';
  if (lower.includes('amazon.ae') || lower.includes('.ae') || lower.includes('noon.com')) return 'AED';
  if (lower.includes('amazon.sa') || lower.includes('.sa')) return 'SAR';
  if (lower.includes('.com.br') || lower.includes('.br')) return 'BRL';
  if (lower.includes('.com.mx') || lower.includes('.mx')) return 'MXN';
  if (lower.includes('.com.tr') || lower.includes('.tr')) return 'TRY';
  if (lower.includes('.ch')) return 'CHF';
  if (lower.includes('.se')) return 'SEK';
  if (lower.includes('.no')) return 'NOK';
  if (lower.includes('.dk')) return 'DKK';
  if (lower.includes('.pl')) return 'PLN';
  if (lower.includes('.cz')) return 'CZK';
  if (lower.includes('.hu')) return 'HUF';
  if (lower.includes('.my') || lower.includes('shopee.com.my')) return 'MYR';
  if (lower.includes('.th') || lower.includes('shopee.co.th')) return 'THB';
  if (lower.includes('.vn') || lower.includes('shopee.vn')) return 'VND';
  if (lower.includes('.ph') || lower.includes('shopee.ph')) return 'PHP';
  if (lower.includes('.co.id') || lower.includes('.id')) return 'IDR';

  const map = {
    'Amazon UK': 'GBP', 'Amazon DE': 'EUR', 'Amazon CA': 'CAD', 'Amazon AU': 'AUD',
    'eBay UK': 'GBP',
  };
  return map[marketplace] || 'USD';
}

function detectCountry(marketplace, url) {
  const lower = url.toLowerCase();
  if (lower.includes('aliexpress') || lower.includes('.cn') || lower.includes('shein') || lower.includes('temu') || lower.includes('alibaba') || lower.includes('taobao') || lower.includes('1688')) return 'China';
  if (lower.includes('.co.uk') || lower.includes('amazon.co.uk') || lower.includes('ebay.co.uk')) return 'UK';
  if (lower.includes('.de')) return 'Germany';
  if (lower.includes('.fr')) return 'France';
  if (lower.includes('.it')) return 'Italy';
  if (lower.includes('.es')) return 'Spain';
  if (lower.includes('.jp') || lower.includes('.co.jp')) return 'Japan';
  if (lower.includes('.com.au') || lower.includes('amazon.com.au')) return 'Australia';
  if (lower.includes('.ca') || lower.includes('amazon.ca')) return 'Canada';
  if (lower.includes('.kr') || lower.includes('samsung.com') || lower.includes('coupang')) return 'South Korea';
  if (lower.includes('.sg') || lower.includes('shopee.sg')) return 'Singapore';
  if (lower.includes('.ae') || lower.includes('amazon.ae') || lower.includes('noon.com')) return 'UAE';
  if (lower.includes('.sa') || lower.includes('amazon.sa')) return 'Saudi Arabia';
  if (lower.includes('.tw')) return 'Taiwan';
  if (lower.includes('.hk')) return 'Hong Kong';
  if (lower.includes('.my')) return 'Malaysia';
  if (lower.includes('.th')) return 'Thailand';
  if (lower.includes('.vn')) return 'Vietnam';
  if (lower.includes('.ph')) return 'Philippines';
  if (lower.includes('.id')) return 'Indonesia';
  if (lower.includes('.br')) return 'Brazil';
  if (lower.includes('.mx')) return 'Mexico';
  if (lower.includes('.tr')) return 'Turkey';
  if (marketplace === 'iHerb') return 'US';
  return 'US';
}

// ─── Currency Symbol Mapping ─────────────────────────────────
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

// ─── Category Detection ──────────────────────────────────────
const CATEGORY_KEYWORDS = {
  Electronics: ['phone', 'laptop', 'tablet', 'headphone', 'earphone', 'earbud', 'airpod', 'earbuds',
    'watch', 'smartwatch', 'camera', 'speaker', 'bluetooth', 'charger', 'cable',
    'keyboard', 'mouse', 'monitor', 'gpu', 'cpu', 'ssd', 'ram', 'pc', 'gaming',
    'console', 'playstation', 'xbox', 'nintendo', 'drone', 'gopro', 'tv', 'television',
    'iphone', 'samsung', 'pixel', 'macbook', 'thinkpad', 'ipad', 'mac',
    'jbl', 'bose', 'sony', 'anker', 'usb', 'adapter', 'power bank', 'router',
    'alexa', 'echo', 'projector', 'microphone', 'webcam', 'printer'],
  Clothing: ['shirt', 'tshirt', 't-shirt', 'dress', 'jeans', 'pant', 'jacket', 'hoodie',
    'sweater', 'coat', 'blazer', 'skirt', 'top', 'blouse', 'clothing', 'fashion', 'apparel'],
  Footwear: ['shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'heel', 'loafer',
    'trainer', 'footwear', 'running shoe', 'jordan', 'yeezy'],
  Supplements: ['vitamin', 'supplement', 'protein', 'whey', 'creatine', 'omega',
    'probiotic', 'collagen', 'bcaa', 'multivitamin', 'ashwagandha', 'melatonin'],
  Health: ['medicine', 'medical', 'health', 'wellness', 'skincare', 'thermometer',
    'oximeter', 'bandage', 'first-aid', 'face mask'],
  Beauty: ['makeup', 'cosmetic', 'lipstick', 'foundation', 'mascara', 'perfume',
    'fragrance', 'serum', 'moisturizer', 'beauty', 'lotion', 'cream', 'sunscreen'],
  Accessories: ['bag', 'handbag', 'wallet', 'belt', 'sunglasses', 'jewelry',
    'necklace', 'bracelet', 'earring', 'backpack', 'luggage', 'suitcase', 'hat', 'cap'],
  Sports: ['fitness', 'gym', 'yoga', 'cycling', 'tennis', 'badminton', 'cricket',
    'football', 'basketball', 'dumbbell', 'treadmill', 'sports', 'athletic'],
  Books: ['book', 'novel', 'textbook', 'ebook', 'kindle', 'paperback', 'hardcover'],
  Toys: ['toy', 'lego', 'puzzle', 'action-figure', 'board-game', 'collectible', 'plush', 'nerf'],
  HomeAppliances: ['vacuum', 'washing machine', 'blender', 'mixer', 'coffee maker',
    'air purifier', 'humidifier', 'dehumidifier', 'refrigerator', 'dishwasher'],
};

function detectCategory(url, title) {
  const text = (url + ' ' + title).toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (text.includes(kw)) return cat;
    }
  }
  return 'Other';
}

// ─── Brand & Product Identifiers ─────────────────────────────
const BRAND_DB = {
  'Apple': ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'imac', 'apple watch', 'airtag'],
  'Samsung': ['samsung', 'galaxy'],
  'Sony': ['sony', 'playstation', 'wh-1000', 'wf-1000'],
  'Logitech': ['logitech', 'logi', 'mx master', 'mx keys'],
  'Nike': ['nike', 'air max', 'air force', 'jordan'],
  'Adidas': ['adidas', 'yeezy', 'ultraboost', 'nmd'],
  'Bose': ['bose', 'quietcomfort', 'soundlink'],
  'JBL': ['jbl'],
  'Dell': ['dell', 'alienware', 'inspiron', 'xps', 'latitude'],
  'Lenovo': ['lenovo', 'thinkpad', 'ideapad', 'legion'],
  'ASUS': ['asus', 'rog', 'zenbook', 'vivobook'],
  'Microsoft': ['microsoft', 'surface', 'xbox'],
  'Google': ['google', 'pixel', 'nest', 'chromecast'],
  'OnePlus': ['oneplus'],
  'Xiaomi': ['xiaomi', 'redmi', 'poco'],
  'Dyson': ['dyson'],
  'GoPro': ['gopro'],
  'Anker': ['anker', 'soundcore', 'eufy'],
  'Razer': ['razer'],
};

function extractBrand(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_DB)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return brand;
    }
  }
  return null;
}

function extractAppleModel(text) {
  if (!text) return null;
  const patterns = [
    /iPhone\s+(15\s+Pro\s+Max|15\s+Pro|15\s+Plus|15|14\s+Pro\s+Max|14\s+Pro|14\s+Plus|14|13\s+mini|13\s+Pro\s+Max|13\s+Pro|13|12|SE)/i,
    /MacBook\s+(Air|Pro)\s*(M1|M2|M3)?\s*(13|14|15|16)?/i,
    /iPad\s+(Pro|Air|mini)?\s*(M1|M2|M3)?\s*(11|12\.9|10\.9)?/i,
    /AirPods\s+(Pro\s+2nd\s+Gen|Pro|Max|3rd\s+Gen|2nd\s+Gen)?/i,
    /Apple\s+Watch\s+(Ultra\s+2|Ultra|Series\s+9|Series\s+8|SE)/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[0].trim();
  }
  return null;
}

function extractStorage(text) {
  if (!text) return null;
  const m = text.match(/\b(64\s*GB|128\s*GB|256\s*GB|512\s*GB|1\s*TB|2\s*TB)\b/i);
  return m ? m[1].replace(/\s+/g, '').toUpperCase() : null;
}

function extractColor(text) {
  if (!text) return null;
  const colors = ['space gray', 'space black', 'midnight', 'starlight', 'silver', 'gold',
    'deep purple', 'sierra blue', 'natural titanium', 'blue titanium', 'black titanium',
    'white titanium', 'rose gold', 'cosmic gray', 'phantom black', 'black', 'white', 'blue', 'green', 'red'];
  const lower = text.toLowerCase();
  for (const c of colors) {
    if (lower.includes(c)) return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return null;
}

function buildFullIdentity(brand, model, storage, color, variant, fallbackName) {
  const parts = [brand, model, storage, color, variant].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : fallbackName;
}

function decodeHTMLEntities(text) {
  return (text || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).trim();
}

function cleanPrice(str, currencyHint) {
  if (!str) return null;
  let cleaned = str.replace(/[^\d.,'\ \u00A0\u202F]/g, '').trim();
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

// ─── Fetch Page ──────────────────────────────────────────────
async function fetchPageHTML(url) {
  const ua = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': ua[Math.floor(Math.random() * ua.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      console.log(`[ProductAgent] HTTP ${resp.status} for ${url}`);
      return null;
    }
    return await resp.text();
  } catch (err) {
    clearTimeout(timeout);
    console.log(`[ProductAgent] Fetch failed: ${err.message}`);
    return null;
  }
}

// ─── STEP 1: JSON-LD Structured Data ──────────────────────────
function extractFromJSONLD(html) {
  const result = {};
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  for (const block of blocks) {
    try {
      const raw = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      const json = JSON.parse(raw);

      const findProduct = (obj) => {
        if (!obj) return null;
        if (obj['@type'] === 'Product') return obj;
        if (Array.isArray(obj)) {
          for (const item of obj) { const f = findProduct(item); if (f) return f; }
        }
        if (obj['@graph']) {
          const f = (obj['@graph'] || []).find(g => g['@type'] === 'Product');
          if (f) return f;
        }
        return null;
      };

      const product = findProduct(json);
      if (!product) continue;

      if (product.name && !result.name) result.name = decodeHTMLEntities(product.name);
      if (product.image && !result.image) {
        result.image = Array.isArray(product.image) ? product.image[0] : product.image;
      }
      if (product.brand && !result.brand) {
        result.brand = typeof product.brand === 'string' ? product.brand : product.brand?.name;
      }
      if (product.sku && !result.sku) result.sku = product.sku;
      if (product.mpn && !result.mpn) result.mpn = product.mpn;
      if (product.color && !result.color) result.color = product.color;
      if (product.model && !result.model) result.model = product.model;

      const offers = product.offers;
      if (offers && !result.price) {
        const offer = Array.isArray(offers) ? offers[0] : offers;
        if (offer) {
          if (offer.priceCurrency) result.currency = offer.priceCurrency.toUpperCase();
          const rawPrice = offer.price ?? offer.lowPrice;
          if (rawPrice != null) {
            const p = cleanPrice(String(rawPrice), result.currency);
            if (p) result.price = p;
          }
          if (offer.shippingDetails) {
            const shipping = offer.shippingDetails;
            if (shipping.shippingRate?.value) result.shippingPrice = parseFloat(shipping.shippingRate.value);
          }
        }
      }
    } catch (e) { /* skip invalid JSON-LD */ }
  }

  return Object.keys(result).length > 0 ? { ...result, source: 'jsonLD' } : null;
}

// ─── STEP 2: Meta Tags via Cheerio DOM ────────────────────────
function extractFromMetaTags($) {
  const result = {};

  const getMeta = (prop) => {
    return $(`meta[property="${prop}"], meta[name="${prop}"]`).attr('content') || null;
  };

  result.name = getMeta('og:title') || getMeta('twitter:title');
  result.image = getMeta('og:image') || getMeta('twitter:image');
  result.description = getMeta('og:description') || getMeta('description');

  const priceCur = getMeta('product:price:currency') || getMeta('og:price:currency');
  if (priceCur) result.currency = priceCur.toUpperCase();

  const priceAmt = getMeta('product:price:amount') || getMeta('og:price:amount');
  if (priceAmt) result.price = cleanPrice(priceAmt, result.currency);

  if (result.name) {
    result.name = result.name
      .replace(/\s*[\-\|:]\s*(Amazon|eBay|AliExpress|Walmart|Shein|iHerb|Temu|Alibaba|Best Buy|Target|Etsy).*$/i, '')
      .trim();
  }

  return Object.keys(result).filter(k => result[k]).length > 0 ? { ...result, source: 'meta' } : null;
}

// ─── STEP 3: Marketplace CSS Selectors via Cheerio DOM ────────
function extractFromMarketplaceSelectors($, marketplace, url) {
  const result = {};
  const domainCurrency = detectCurrency(marketplace, url);

  if (marketplace.startsWith('Amazon')) {
    result.name = $('#productTitle').text().trim() || null;

    const priceText = $('.a-price .a-offscreen').first().text().trim()
      || $('#priceblock_ourprice').text().trim()
      || $('#priceblock_dealprice').text().trim()
      || $('.a-price span.a-price-whole').first().text().trim();

    if (priceText) {
      const parsedPrice = cleanPrice(priceText, domainCurrency);
      if (parsedPrice) {
        result.price = parsedPrice;
        result.currency = domainCurrency;
      }
    }

    result.image = $('#landingImage').attr('src')
      || $('#imgBlkFront').attr('src')
      || $('.main-image img').first().attr('src')
      || null;
  }
  else if (marketplace.startsWith('eBay')) {
    result.name = $('#itemTitle').text().replace(/^Details about\s*/i, '').trim()
      || $('.x-item-title__mainTitle').first().text().trim()
      || null;

    const priceText = $('#prcIsum').text().trim()
      || $('[itemprop="price"]').attr('content')
      || $('.x-price-primary').first().text().trim();

    const currencyAttr = $('[itemprop="priceCurrency"]').attr('content');
    result.currency = currencyAttr ? currencyAttr.toUpperCase() : domainCurrency;

    if (priceText) {
      result.price = cleanPrice(priceText, result.currency);
    }

    result.image = $('#icImg').attr('src') || $('.ux-image-carousel-item img').first().attr('src') || null;
  }
  else if (marketplace === 'AliExpress') {
    result.name = $('.product-title-text').first().text().trim()
      || $('.product-title').first().text().trim()
      || null;

    const priceText = $('.product-price-value').first().text().trim()
      || $('.price--currentPrice').first().text().trim();

    result.currency = domainCurrency || 'USD';
    if (priceText) {
      result.price = cleanPrice(priceText, result.currency);
    }

    result.image = $('.magnifier-image').first().attr('src') || null;
  }
  else if (marketplace === 'Shein') {
    result.name = $('.product-intro__head-name').text().trim() || null;
    const priceText = $('.product-intro__head-price').text().trim();
    result.currency = domainCurrency || 'USD';
    if (priceText) result.price = cleanPrice(priceText, result.currency);
  }
  else if (marketplace === 'iHerb') {
    result.name = $('#name').text().trim() || null;
    const priceText = $('.price').first().text().trim();
    result.currency = domainCurrency || 'USD';
    if (priceText) result.price = cleanPrice(priceText, result.currency);
  }
  else if (marketplace === 'Walmart') {
    result.name = $('h1[itemprop="name"]').text().trim() || $('h1.title').text().trim() || null;
    const priceText = $('span[itemprop="price"]').text().trim() || $('.price-characteristic').first().text().trim();
    result.currency = 'USD';
    if (priceText) result.price = cleanPrice(priceText, result.currency);
  }

  return Object.keys(result).filter(k => result[k]).length > 0 ? { ...result, source: 'specific' } : null;
}

// ─── STEP 4: Intelligent Price Heuristics via Cheerio DOM ─────
const ALL_CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOLS)
  .filter(s => !/^[A-Z]{3}$/.test(s))
  .sort((a, b) => b.length - a.length);

const ESCAPED_SYMBOLS = ALL_CURRENCY_SYMBOLS
  .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const ISO_CODES_FOR_REGEX = [
  'USD','EUR','GBP','JPY','CNY','AUD','CAD','HKD','SGD','CHF',
  'KRW','AED','SAR','MYR','THB','PHP','IDR','BRL','TRY','MXN',
  'VND','SEK','NOK','DKK','PLN','CZK','HUF','NZD','ZAR','QAR',
  'KWD','RON','TWD','RUB','UAH','INR','PKR','BDT','LKR','NPR',
  'EGP','ILS','NGN','KES','PEN','COP','CLP','ARS',
].join('|');

const HEURISTIC_PRICE_REGEX = new RegExp(
  `(?:${ESCAPED_SYMBOLS}|\\b(?:${ISO_CODES_FOR_REGEX})\\b)\\s*([\\d,.\\s'\\u00A0]+)`,
  'g'
);

function extractPriceHeuristic($, preferredCurrency, marketplace, url) {
  const allPrices = [];

  // Scoped text parsing: search product containers first, fallback to body text
  const targetContainers = $('#main-content, #product-detail, .product-info, #centerCol, body');
  const containerText = targetContainers.text();

  let m;
  HEURISTIC_PRICE_REGEX.lastIndex = 0;

  while ((m = HEURISTIC_PRICE_REGEX.exec(containerText)) !== null) {
    const sym = m[0].replace(/[\d,.\s'\u00A0]/g, '').trim();
    const cur = resolveSymbolCurrency(sym, marketplace || '', url || '') || preferredCurrency || 'USD';
    const val = cleanPrice(m[1], cur);
    if (val && val > 0 && val < 100000000) {
      const contextStart = Math.max(0, m.index - 200);
      const contextEnd = Math.min(containerText.length, m.index + 200);
      const context = containerText.substring(contextStart, contextEnd).toLowerCase();
      const isBuyContext = /buy|add to cart|add to bag|checkout|purchase|order now|price/.test(context);
      allPrices.push({ val, cur, isBuyContext });
    }
  }

  if (allPrices.length === 0) return null;

  const buyContextPrices = allPrices.filter(p => p.isBuyContext);
  const candidates = buyContextPrices.length > 0 ? buyContextPrices : allPrices;

  candidates.sort((a, b) => a.val - b.val);
  const idx = Math.floor(candidates.length * 0.3);
  return { price: candidates[idx].val, currency: candidates[idx].cur, source: 'heuristic' };
}

// ─── STEP 5 & 6: Image / Title extraction ──────────────────────
function extractImage($, metaImage) {
  if (metaImage) return metaImage;
  return $('#landingImage').attr('src')
    || $('.product-image img').first().attr('src')
    || $('#main-image').attr('src')
    || $('img[itemprop="image"]').first().attr('src')
    || null;
}

function extractTitle($) {
  const titleText = $('title').first().text().trim();
  if (!titleText) return null;
  return decodeHTMLEntities(titleText)
    .replace(/\s*[\-\|:]\s*(Amazon|eBay|AliExpress|Walmart|Shein|iHerb|Temu|Alibaba|Best Buy).*$/i, '')
    .trim();
}

function extractNameFromURL(url) {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname.replace(/^\/(dp|gp|product|item|i|p|products|shop|buy|detail)\//i, '/');
    const segments = path.split('/').filter(Boolean);
    let best = segments[segments.length - 1] || '';
    if (best.length <= 12 && /^[A-Z0-9]+$/i.test(best) && segments.length > 1) {
      best = segments[segments.length - 2] || best;
    }
    let name = best.replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').split('?')[0].trim();
    name = name.split(' ').filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return name.length > 3 ? name : null;
  } catch { return null; }
}

function extractShipping(html) {
  const patterns = [
    /"shippingCost"\s*:\s*([\d.]+)/i,
    /"deliveryCost"\s*:\s*\{"value"\s*:\s*([\d.]+)/i,
    /FREE\s+(?:Shipping|Delivery)/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      if (/FREE/i.test(m[0])) return 0;
      const val = parseFloat(m[1]);
      if (!isNaN(val)) return val;
    }
  }
  return null;
}

function matchDemoProduct(url) {
  const lower = url.toLowerCase();
  for (const product of demoProducts) {
    if (product.keywords.some(kw => lower.includes(kw))) return product;
  }
  return null;
}

// ─── MAIN PRODUCT AGENT ─────────────────────────────────────
async function productAgent(url) {
  console.log(`\n[ProductAgent] ─── Analyzing: ${url}`);

  const marketplace = identifyMarketplace(url);
  const demoMatch = matchDemoProduct(url);

  if (demoMatch) {
    console.log(`[ProductAgent] ✓ Demo match: ${demoMatch.name}`);
    return {
      agent: 'ProductAgent',
      success: true,
      data: {
        name: demoMatch.name,
        price: demoMatch.price,
        currency: demoMatch.currency,
        category: demoMatch.category,
        country: demoMatch.country,
        marketplace,
        imageUrl: demoMatch.imageUrl,
        originalUrl: url,
        shippingPrice: null,
        identity: {
          brand: demoMatch.brand,
          model: demoMatch.model,
          variant: demoMatch.variant,
          storage: demoMatch.storage,
          color: demoMatch.color,
          sku: demoMatch.sku,
          fullIdentity: demoMatch.name,
          identityConfidence: 'high',
        },
      },
    };
  }

  console.log(`[ProductAgent] Fetching page from ${marketplace}...`);
  const html = await fetchPageHTML(url);

  if (!html) {
    console.log(`[ProductAgent] ✗ Could not fetch page — returning partial data from URL`);
    const urlName = extractNameFromURL(url);
    const detectedCurrency = detectCurrency(marketplace, url);
    return {
      agent: 'ProductAgent',
      success: true,
      data: {
        name: urlName || 'International Product',
        price: null,
        currency: detectedCurrency,
        category: detectCategory(url, urlName || ''),
        country: detectCountry(marketplace, url),
        marketplace,
        imageUrl: null,
        originalUrl: url,
        shippingPrice: null,
        priceExtracted: false,
        scrapeStatus: 'page_fetch_failed',
        identity: { brand: null, model: null, storage: null, color: null, fullIdentity: urlName, identityConfidence: 'low' },
      },
    };
  }

  // Load Cheerio DOM instance
  const $ = cheerio.load(html);

  // Collect extraction candidates from all sources
  const candidates = [
    extractFromJSONLD(html),
    extractFromMetaTags($),
    extractFromMarketplaceSelectors($, marketplace, url),
  ].filter(Boolean);

  const domainCurrency = detectCurrency(marketplace, url);
  const detectedCountry = detectCountry(marketplace, url);

  const rawName = candidates.find(c => c.name)?.name || extractTitle($) || extractNameFromURL(url) || 'International Product';
  const category = detectCategory(url, rawName);

  // Central Validation Gate: Validate all candidates
  const validCandidates = [];
  for (const candidate of candidates) {
    if (!candidate.price) continue;
    const candCur = candidate.currency || domainCurrency;
    const validation = validateExtractedPrice({
      price: candidate.price,
      currency: candCur,
      category,
      country: detectedCountry,
      marketplace,
      source: candidate.source,
    });

    if (validation.valid) {
      validCandidates.push({
        price: candidate.price,
        currency: candCur,
        source: candidate.source,
      });
    } else {
      console.log(`[ProductAgent] Candidate from "${candidate.source}" (${candCur} ${candidate.price}) rejected: ${validation.issues.join(', ')}`);
    }
  }

  // Fallback to Heuristic candidate if no valid candidate yet
  if (validCandidates.length === 0) {
    const heuristic = extractPriceHeuristic($, domainCurrency, marketplace, url);
    if (heuristic && heuristic.price) {
      const validation = validateExtractedPrice({
        price: heuristic.price,
        currency: heuristic.currency,
        category,
        country: detectedCountry,
        marketplace,
        source: 'heuristic',
      });
      if (validation.valid) {
        validCandidates.push({
          price: heuristic.price,
          currency: heuristic.currency,
          source: 'heuristic',
        });
      }
    }
  }

  // Select winning price & currency from highest priority valid candidate
  const winner = validCandidates[0] || null;
  let price = winner ? winner.price : null;
  let currency = winner ? winner.currency : domainCurrency;

  const image = candidates.find(c => c.image)?.image || extractImage($, null);
  const shippingPrice = candidates.find(c => c.shippingPrice)?.shippingPrice ?? extractShipping(html);
  const skuFromLD = candidates.find(c => c.sku)?.sku;

  // Build product identity
  const combined = `${rawName} ${url}`;
  const brand = candidates.find(c => c.brand)?.brand || extractBrand(combined);
  const isApple = brand === 'Apple';
  let model = candidates.find(c => c.model)?.model || null;
  if (isApple && !model) model = extractAppleModel(combined) || extractBrand(combined);
  if (!isApple && !model && brand) {
    const idx = rawName.toLowerCase().indexOf(brand.toLowerCase());
    if (idx >= 0) {
      model = rawName.substring(idx + brand.length).trim().split(/[,\-–|]/)[0].trim().substring(0, 60) || null;
    }
  }
  const storage = extractStorage(combined);
  const color = extractColor(combined);

  let confidenceScore = 0;
  if (brand) confidenceScore += 25;
  if (model) confidenceScore += 25;
  if (price) confidenceScore += 20;
  if (storage || color) confidenceScore += 15;
  if (skuFromLD) confidenceScore += 15;

  const confidence = (price && confidenceScore >= 65) ? 'high' : (price && confidenceScore >= 40) ? 'medium' : 'low';
  const fullIdentity = buildFullIdentity(brand, model, storage, color, null, rawName);
  const finalName = (fullIdentity && fullIdentity !== rawName) ? fullIdentity : rawName;

  let finalCurrency = (currency || 'USD').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(finalCurrency)) {
    finalCurrency = domainCurrency || 'USD';
  }

  return {
    agent: 'ProductAgent',
    success: true,
    data: {
      name: finalName.substring(0, 200),
      price,
      currency: finalCurrency,
      category,
      country: detectedCountry,
      marketplace,
      imageUrl: image,
      originalUrl: url,
      shippingPrice,
      priceExtracted: price !== null,
      scrapeStatus: price ? 'success' : 'price_not_found',
      identity: {
        brand,
        model,
        storage,
        color,
        sku: skuFromLD || null,
        fullIdentity: finalName,
        identityConfidence: confidence,
      },
    },
  };
}

module.exports = productAgent;
