// ============================================
// AGENT 1 — PRODUCT AGENT (Enhanced)
// Extracts complete product identity from URL
// ============================================
// Scraping priority:
//   1. JSON-LD structured data (most reliable)
//   2. Open Graph / product meta tags
//   3. Marketplace-specific CSS selectors
//   4. Intelligent heuristic fallback
// ============================================

const demoProducts = require('../data/demoProducts');

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
  if (lower.includes('.co.uk') || lower.includes('/en-gb')) return 'GBP';
  if (lower.includes('.de') || lower.includes('.fr') || lower.includes('.es') || lower.includes('.it')) return 'EUR';
  if (lower.includes('.cn') || lower.includes('.taobao') || lower.includes('aliexpress')) return 'USD';
  if (lower.includes('.jp') || lower.includes('.co.jp')) return 'JPY';
  if (lower.includes('.com.au')) return 'AUD';
  if (lower.includes('.ca') && !lower.includes('local')) return 'CAD';
  const map = {
    'Amazon UK': 'GBP', 'Amazon DE': 'EUR', 'Amazon CA': 'CAD', 'Amazon AU': 'AUD',
    'eBay UK': 'GBP',
  };
  return map[marketplace] || 'USD';
}

function detectCountry(marketplace, url) {
  const lower = url.toLowerCase();
  if (lower.includes('aliexpress') || lower.includes('.cn') || lower.includes('shein') || lower.includes('temu') || lower.includes('alibaba')) return 'China';
  if (lower.includes('.co.uk') || lower.includes('amazon.co.uk') || lower.includes('ebay.co.uk')) return 'UK';
  if (lower.includes('.de')) return 'Germany';
  if (lower.includes('.jp') || lower.includes('.co.jp')) return 'Japan';
  if (lower.includes('.com.au')) return 'Australia';
  if (lower.includes('.kr')) return 'South Korea';
  if (lower.includes('samsung.com')) return 'South Korea';
  if (marketplace === 'iHerb') return 'US';
  return 'US';
}

// ─── Currency Symbol → Code ───────────────────────────────────
const CURRENCY_SYMBOLS = {
  '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR',
  '₩': 'KRW', 'A$': 'AUD', 'C$': 'CAD', 'HK$': 'HKD', 'S$': 'SGD',
  'Fr': 'CHF', 'kr': 'SEK', 'NZ$': 'NZD', 'R$': 'BRL', '₺': 'TRY',
  'د.إ': 'AED', '﷼': 'SAR', 'RM': 'MYR', '฿': 'THB', '₱': 'PHP',
  'Rp': 'IDR', 'zł': 'PLN', 'Kč': 'CZK', 'Ft': 'HUF', 'lei': 'RON',
  'CN¥': 'CNY', 'CNY': 'CNY', 'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP',
};

function extractCurrencyFromText(text) {
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) return code;
  }
  const m = text.match(/\b(USD|EUR|GBP|JPY|CNY|AUD|CAD|HKD|SGD|CHF|KRW|INR|AED|SAR|MYR|THB|PHP|IDR|BRL|TRY|MXN)\b/);
  return m ? m[1] : null;
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

// ─── Brand Detection ─────────────────────────────────────────
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
  'NOW Foods': ['now foods', 'now supplements'],
  'SHEIN': ['shein'],
  'Temu': ['temu'],
  'New Balance': ['new balance'],
  'Puma': ['puma'],
  'Reebok': ['reebok'],
};

const APPLE_MODELS = [
  { p: /iphone\s*16\s*pro\s*max/i, m: 'iPhone 16 Pro Max' },
  { p: /iphone\s*16\s*pro/i, m: 'iPhone 16 Pro' },
  { p: /iphone\s*16\s*plus/i, m: 'iPhone 16 Plus' },
  { p: /iphone\s*16/i, m: 'iPhone 16' },
  { p: /iphone\s*15\s*pro\s*max/i, m: 'iPhone 15 Pro Max' },
  { p: /iphone\s*15\s*pro/i, m: 'iPhone 15 Pro' },
  { p: /iphone\s*15\s*plus/i, m: 'iPhone 15 Plus' },
  { p: /iphone\s*15/i, m: 'iPhone 15' },
  { p: /iphone\s*14\s*pro\s*max/i, m: 'iPhone 14 Pro Max' },
  { p: /iphone\s*14\s*pro/i, m: 'iPhone 14 Pro' },
  { p: /iphone\s*14/i, m: 'iPhone 14' },
  { p: /iphone\s*se/i, m: 'iPhone SE' },
  { p: /macbook\s*pro\s*16/i, m: 'MacBook Pro 16"' },
  { p: /macbook\s*pro\s*14/i, m: 'MacBook Pro 14"' },
  { p: /macbook\s*pro/i, m: 'MacBook Pro' },
  { p: /macbook\s*air\s*15/i, m: 'MacBook Air 15"' },
  { p: /macbook\s*air/i, m: 'MacBook Air' },
  { p: /ipad\s*pro\s*12/i, m: 'iPad Pro 12.9"' },
  { p: /ipad\s*pro\s*11/i, m: 'iPad Pro 11"' },
  { p: /ipad\s*pro/i, m: 'iPad Pro' },
  { p: /ipad\s*air/i, m: 'iPad Air' },
  { p: /ipad\s*mini/i, m: 'iPad Mini' },
  { p: /airpods\s*max/i, m: 'AirPods Max' },
  { p: /airpods\s*pro/i, m: 'AirPods Pro' },
  { p: /airpods\s*(3rd|3)/i, m: 'AirPods 3rd Gen' },
  { p: /airpods/i, m: 'AirPods' },
  { p: /apple\s*watch\s*ultra\s*2/i, m: 'Apple Watch Ultra 2' },
  { p: /apple\s*watch\s*ultra/i, m: 'Apple Watch Ultra' },
  { p: /apple\s*watch\s*series\s*(\d+)/i, m: 'Apple Watch Series $1' },
  { p: /apple\s*watch\s*se/i, m: 'Apple Watch SE' },
];

const STORAGE_RE = /\b(\d+)\s*(TB|GB|MB)\b/i;
const KNOWN_COLORS = [
  'Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium', 'Desert Titanium',
  'Space Black', 'Space Gray', 'Space Grey', 'Midnight', 'Starlight',
  'Blue', 'Pink', 'Green', 'Yellow', 'Red', 'Purple', 'Orange', 'Gold', 'Silver',
  'Rose Gold', 'Pacific Blue', 'Sierra Blue', 'Alpine Green', 'Deep Purple',
  'Graphite', 'Phantom Black', 'Cream', 'Lavender', 'Mint', 'White', 'Black',
  'Gray', 'Grey', 'Navy', 'Coral', 'Teal', 'Burgundy', 'Beige', 'Olive', 'Sage',
  'Multicolor', 'Multi-color',
];

function extractStorage(text) {
  const m = text.match(STORAGE_RE);
  if (m) {
    const val = parseInt(m[1]);
    const unit = m[2].toUpperCase();
    if (unit === 'TB') return `${val}TB`;
    if (unit === 'GB' && val >= 8) return `${val}GB`;
  }
  return null;
}

function extractColor(text) {
  const sorted = [...KNOWN_COLORS].sort((a, b) => b.length - a.length);
  for (const c of sorted) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c;
  }
  return null;
}

function extractBrand(text) {
  const lower = text.toLowerCase();
  for (const [brand, pats] of Object.entries(BRAND_DB)) {
    if (pats.some(p => lower.includes(p))) return brand;
  }
  const m = text.match(/^([A-Z][a-zA-Z]{2,})/);
  return m ? m[1] : null;
}

function extractAppleModel(text) {
  for (const entry of APPLE_MODELS) {
    const m = text.match(entry.p);
    if (m) return entry.m.replace('$1', m[1] || '');
  }
  return null;
}

function buildFullIdentity(brand, model, storage, color, variant, fallbackName) {
  const parts = [brand, model, storage, color, variant].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : fallbackName;
}

// ─── HTML Utilities ──────────────────────────────────────────
function decodeHTMLEntities(text) {
  return (text || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).trim();
}

function cleanPrice(str) {
  if (!str) return null;
  // Strip all except digits, dot, comma
  const cleaned = str.replace(/[^\d.,]/g, '');
  // Handle European format (1.234,56 → 1234.56)
  const isEuropean = /^\d{1,3}(\.\d{3})+(,\d{2})?$/.test(cleaned);
  const normalized = isEuropean
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const val = parseFloat(normalized);
  return (val > 0 && val < 1000000) ? val : null;
}

// ─── Scraping Functions ──────────────────────────────────────

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

/**
 * STEP 1 — JSON-LD Structured Data (Primary source of truth)
 */
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
          const rawPrice = offer.price ?? offer.lowPrice;
          if (rawPrice != null) {
            const p = cleanPrice(String(rawPrice));
            if (p) result.price = p;
          }
          if (offer.priceCurrency) result.currency = offer.priceCurrency.toUpperCase();
          if (offer.shippingDetails) {
            const shipping = offer.shippingDetails;
            if (shipping.shippingRate?.value) result.shippingPrice = parseFloat(shipping.shippingRate.value);
          }
        }
      }
    } catch (e) { /* invalid JSON-LD, skip */ }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * STEP 2 — Open Graph / Meta Tags
 */
function extractFromMetaTags(html) {
  const result = {};

  const meta = (property) => {
    const patterns = [
      new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) return decodeHTMLEntities(m[1]);
    }
    return null;
  };

  result.name = meta('og:title') || meta('twitter:title');
  result.image = meta('og:image') || meta('twitter:image');
  result.description = meta('og:description') || meta('description');

  // Price meta tags
  const priceAmt = meta('product:price:amount') || meta('og:price:amount');
  if (priceAmt) result.price = cleanPrice(priceAmt);

  const priceCur = meta('product:price:currency') || meta('og:price:currency');
  if (priceCur) result.currency = priceCur.toUpperCase();

  // Clean blog/site names from title
  if (result.name) {
    result.name = result.name
      .replace(/\s*[\-\|:]\s*(Amazon|eBay|AliExpress|Walmart|Shein|iHerb|Temu|Alibaba|Best Buy|Target|Etsy).*$/i, '')
      .trim();
  }

  return Object.keys(result).filter(k => result[k]).length > 0 ? result : null;
}

/**
 * STEP 3 — Marketplace-Specific CSS Selector Simulation (regex-based HTML parsing)
 */
function extractFromMarketplaceSelectors(html, marketplace) {
  const result = {};

  // Generic helper — extract content from a tag by id or class pattern
  const byId = (id) => {
    const m = html.match(new RegExp(`id=["']${id}["'][^>]*>([^<]{1,500})`, 'i'))
      || html.match(new RegExp(`id=["']${id}["'][^/]*/?>\\s*<[^>]+>([^<]{1,500})`, 'i'));
    return m ? decodeHTMLEntities(m[1]).trim() : null;
  };

  const byClass = (cls) => {
    const m = html.match(new RegExp(`class=["'][^"']*${cls}[^"']*["'][^>]*>([^<]{1,500})`, 'i'));
    return m ? decodeHTMLEntities(m[1]).trim() : null;
  };

  // ── AMAZON ──
  if (marketplace.startsWith('Amazon')) {
    // Title: #productTitle
    const title = byId('productTitle');
    if (title) result.name = title.trim();

    // Price: .a-price .a-offscreen  OR  #priceblock_ourprice
    const pricePatterns = [
      /"priceAmount"\s*:\s*"([\d.]+)"/,
      /class="a-offscreen"[^>]*>\s*\$?([\d,]+\.?\d*)/,
      /id="priceblock_ourprice"[^>]*>\s*\$?([\d,]+\.?\d*)/,
      /id="priceblock_dealprice"[^>]*>\s*\$?([\d,]+\.?\d*)/,
      /"buyingPrice"\s*:\s*([\d.]+)/,
      /"price"\s*:\s*([\d.]+)/,
      /"landingPage"\s*:[^}]*"currentPrice"\s*:\s*([\d.]+)/,
    ];
    for (const pat of pricePatterns) {
      const m = html.match(pat);
      if (m) {
        const p = cleanPrice(m[1]);
        if (p && !result.price) { result.price = p; break; }
      }
    }

    // Image: #landingImage
    const imgMatch = html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i)
      || html.match(/id=["']imgBlkFront["'][^>]*src=["']([^"']+)["']/i);
    if (imgMatch) result.image = imgMatch[1];
  }

  // ── EBAY ──
  else if (marketplace.startsWith('eBay')) {
    // Price: #prcIsum or .x-price-primary
    const ebayPrice = html.match(/id=["']prcIsum["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/class=["'][^"']*x-price-primary[^"']*["'][^>]*>([\$£€¥\d,. ]+)/i);
    if (ebayPrice) result.price = cleanPrice(ebayPrice[1]);

    const ebayTitle = html.match(/id=["']itemTitle["'][^>]*>[^:]+:\s*([^<]{1,200})/i)
      || html.match(/class=["'][^"']*x-item-title[^"']*["'][^>]*>([^<]{1,200})/i);
    if (ebayTitle) result.name = decodeHTMLEntities(ebayTitle[1]).trim();

    // Currency
    const ebayCur = html.match(/itemprop=["']priceCurrency["'][^>]*content=["']([A-Z]{3})["']/i);
    if (ebayCur) result.currency = ebayCur[1];
  }

  // ── ALIEXPRESS ──
  else if (marketplace === 'AliExpress') {
    // AliExpress often has data in window.detailData or similar JS objects
    const aliPrice = html.match(/"formatedActivityPrice"\s*:\s*"([^"]+)"/i)
      || html.match(/"formatedPrice"\s*:\s*"([^"]+)"/i)
      || html.match(/class=["'][^"']*product-price-value[^"']*["'][^>]*>([\d.]+)/i)
      || html.match(/"minAmount"\s*:\s*\{"value"\s*:\s*([\d.]+)/i);
    if (aliPrice) result.price = cleanPrice(aliPrice[1]);

    const aliTitle = html.match(/"subject"\s*:\s*"([^"]{5,300})"/i)
      || html.match(/class=["'][^"']*product-title[^"']*["'][^>]*>([^<]{5,200})/i);
    if (aliTitle) result.name = decodeHTMLEntities(aliTitle[1]).trim();

    const aliImg = html.match(/"imageUrl"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    if (aliImg) result.image = aliImg[1];

    result.currency = result.currency || 'USD';
  }

  // ── SHEIN ──
  else if (marketplace === 'Shein') {
    const sheinPrice = html.match(/class=["'][^"']*product-intro__head-price[^"']*["'][^>]*>[^<]*\$([\d.]+)/i)
      || html.match(/"salePrice"\s*:\s*\{"amount"\s*:\s*"([\d.]+)"/i)
      || html.match(/"retailPrice"\s*:\s*\{"amount"\s*:\s*"([\d.]+)"/i);
    if (sheinPrice) result.price = cleanPrice(sheinPrice[1]);

    const sheinTitle = html.match(/class=["'][^"']*product-intro__head-name[^"']*["'][^>]*>([^<]{5,200})/i);
    if (sheinTitle) result.name = decodeHTMLEntities(sheinTitle[1]).trim();
  }

  // ── IHERB ──
  else if (marketplace === 'iHerb') {
    const iherbPrice = html.match(/"priceValue"\s*:\s*([\d.]+)/i)
      || html.match(/class=["'][^"']*price[^"']*["'][^>]*>\$?([\d.]+)/i);
    if (iherbPrice) result.price = cleanPrice(iherbPrice[1]);
  }

  // ── TEMU ──
  else if (marketplace === 'Temu') {
    const temuPrice = html.match(/"originalPrice"\s*:\s*([\d.]+)/i)
      || html.match(/"displayPrice"\s*:\s*([\d.]+)/i);
    if (temuPrice) result.price = cleanPrice(temuPrice[1]);
  }

  // ── WALMART ──
  else if (marketplace === 'Walmart') {
    const walPrice = html.match(/"price"\s*:\s*([\d.]+)/i)
      || html.match(/\$\s*([\d,]+\.?\d*)/);
    if (walPrice) result.price = cleanPrice(walPrice[1]);
  }

  return Object.keys(result).filter(k => result[k]).length > 0 ? result : null;
}

/**
 * STEP 4 — Intelligent Price Heuristics (fallback)
 * Finds the most likely product price using page-level patterns
 */
function extractPriceHeuristic(html, preferredCurrency) {
  // Pattern: currency symbol followed by number, near buy/cart
  const currencySymbolMap = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₩': 'KRW', '₹': 'INR' };

  // Extract all prices from page
  const priceRegex = /(?:[\$€£¥₹₩]|USD|EUR|GBP|CNY)\s*([\d,]+(?:\.\d{1,2})?)/g;
  const allPrices = [];
  let m;
  while ((m = priceRegex.exec(html)) !== null) {
    const sym = m[0].replace(/[\d,. ]/g, '').trim();
    const val = cleanPrice(m[1]);
    const cur = currencySymbolMap[sym] || extractCurrencyFromText(sym) || preferredCurrency || 'USD';
    if (val && val > 0 && val < 100000) {
      // Score this price — prices near buy/add-to-cart context get higher weight
      const contextStart = Math.max(0, m.index - 200);
      const contextEnd = Math.min(html.length, m.index + 200);
      const context = html.substring(contextStart, contextEnd).toLowerCase();
      const isBuyContext = /buy|add to cart|add to bag|checkout|purchase|order now|price/.test(context);
      allPrices.push({ val, cur, isBuyContext });
    }
  }

  if (allPrices.length === 0) return null;

  // Prefer buy-context prices; among those, take the median (avoids outliers)
  const buyContextPrices = allPrices.filter(p => p.isBuyContext);
  const candidates = buyContextPrices.length > 0 ? buyContextPrices : allPrices;

  // Sort by value and pick the one in the "sweet spot" (not min or max, to avoid noise)
  candidates.sort((a, b) => a.val - b.val);
  const idx = Math.floor(candidates.length * 0.3); // 30th percentile — avoids huge prices
  return { price: candidates[idx].val, currency: candidates[idx].cur };
}

/**
 * STEP 5 — Extract image from page
 */
function extractImage(html, metaImage) {
  if (metaImage) return metaImage;
  const patterns = [
    /id=["']landingImage["'][^>]*src=["']([^"']+)["']/i,
    /class=["'][^"']*product-image[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /id=["']main-image["'][^>]*src=["']([^"']+)["']/i,
    /"mainImage"\s*:\s*\{"hiRes"\s*:\s*"([^"]+)"/i,
    /"mainImage"\s*:\s*\{"url"\s*:\s*"([^"]+)"/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1];
  }
  return null;
}

/**
 * STEP 6 — Extract title from standard HTML
 */
function extractTitle(html) {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleTag) return null;
  return decodeHTMLEntities(titleTag[1])
    .replace(/\s*[\-\|:]\s*(Amazon|eBay|AliExpress|Walmart|Shein|iHerb|Temu|Alibaba|Best Buy).*$/i, '')
    .trim();
}

/**
 * Extract product name from URL path
 */
function extractNameFromURL(url) {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname.replace(/^\/(dp|gp|product|item|i|p|products|shop|buy|detail)\//i, '/');
    const segments = path.split('/').filter(Boolean);
    let best = segments[segments.length - 1] || '';
    // Skip short alphanumeric IDs (e.g. Amazon ASIN)
    if (best.length <= 12 && /^[A-Z0-9]+$/i.test(best) && segments.length > 1) {
      best = segments[segments.length - 2] || best;
    }
    let name = best.replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').split('?')[0].trim();
    name = name.split(' ').filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return name.length > 3 ? name : null;
  } catch { return null; }
}

/**
 * STEP 7 — Extract shipping cost if available
 */
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

// ─── Demo Product Matching ───────────────────────────────────
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

  // ── 1. Demo product match ──
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

  // ── 2. Fetch and scrape the real page ──
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

  // ── 3. Extract from JSON-LD (primary) ──
  const jsonLD = extractFromJSONLD(html);
  console.log(`[ProductAgent] JSON-LD: ${jsonLD ? `name=${jsonLD.name?.substring(0, 40)}, price=${jsonLD.price}` : 'none found'}`);

  // ── 4. Extract from meta tags (secondary) ──
  const meta = extractFromMetaTags(html);
  console.log(`[ProductAgent] Meta tags: ${meta ? `name=${meta.name?.substring(0, 40)}, price=${meta.price}` : 'none found'}`);

  // ── 5. Marketplace-specific selectors ──
  const specific = extractFromMarketplaceSelectors(html, marketplace);
  console.log(`[ProductAgent] Marketplace selectors: ${specific ? `name=${specific.name?.substring(0, 40)}, price=${specific.price}` : 'none found'}`);

  // ── 6. Merge results (priority: JSON-LD > meta > specific) ──
  const name = jsonLD?.name || specific?.name || meta?.name || extractTitle(html) || extractNameFromURL(url) || 'International Product';
  let price = jsonLD?.price || specific?.price || meta?.price || null;
  let currency = jsonLD?.currency || specific?.currency || meta?.currency || null;
  const image = jsonLD?.image || meta?.image || extractImage(html, null) || specific?.image || null;
  const shippingPrice = jsonLD?.shippingPrice ?? extractShipping(html);
  const skuFromLD = jsonLD?.sku || jsonLD?.mpn;

  // Detect currency if still missing
  if (!currency) {
    currency = extractCurrencyFromText(name + ' ' + (html.substring(0, 5000)))
      || detectCurrency(marketplace, url);
  }

  // ── 7. Heuristic fallback if no price found yet ──
  if (!price) {
    console.log(`[ProductAgent] No price from structured sources — trying heuristics...`);
    const heuristic = extractPriceHeuristic(html, detectCurrency(marketplace, url));
    if (heuristic) {
      price = heuristic.price;
      currency = currency || heuristic.currency;
      console.log(`[ProductAgent] Heuristic price: ${currency} ${price}`);
    }
  }

  // ── 8. Build complete product identity ──
  const combined = `${name} ${url}`;
  const brand = jsonLD?.brand || extractBrand(combined);
  const isApple = brand === 'Apple';
  let model = jsonLD?.model || null;
  if (isApple && !model) model = extractAppleModel(combined) || extractBrand(combined);
  if (!isApple && !model) {
    // Extract model as text after brand
    if (brand) {
      const idx = name.toLowerCase().indexOf(brand.toLowerCase());
      if (idx >= 0) {
        model = name.substring(idx + brand.length).trim().split(/[,\-–|]/)[0].trim().substring(0, 60) || null;
      }
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
  const confidence = confidenceScore >= 65 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low';

  const fullIdentity = buildFullIdentity(brand, model, storage, color, null, name);
  const finalName = (fullIdentity && fullIdentity !== name) ? fullIdentity : name;

  console.log(`[ProductAgent] ✓ Final: "${finalName.substring(0, 80)}" | ${currency} ${price || '?'} | ${confidence} confidence`);

  if (!price) {
    console.log(`[ProductAgent] ⚠ Price not found — user will be prompted for manual input`);
  }

  return {
    agent: 'ProductAgent',
    success: true,
    data: {
      name: finalName.substring(0, 200),
      price,
      currency: currency || 'USD',
      category: detectCategory(url, finalName),
      country: detectCountry(marketplace, url),
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
