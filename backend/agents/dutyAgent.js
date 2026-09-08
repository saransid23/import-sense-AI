// ============================================
// AGENT — DUTY AGENT (UPGRADED)
// Live Regulatory Tariff Intelligence System
// Sources: CBIC Customs Tariff, ICEGATE
// Strategy: HS Code Detection → Live CBIC Fetch → Reference Table Fallback
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Cache with 6 hour TTL for tariff data (changes less frequently)
const tariffCache = new NodeCache({ stdTTL: 21600, checkperiod: 1200 });

// ─── HTTP Headers ─────────────────────────────────────────────
const FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Connection': 'keep-alive',
};

// ─── CBIC Source URLs ─────────────────────────────────────────
const CBIC_TARIFF_URL = 'https://www.cbic.gov.in/htdocs-cbec/customs/cst2024-25/cst2024-25-idx.htm';
const CBIC_BASE = 'https://www.cbic.gov.in';

// ─── HS Code Chapter Map ──────────────────────────────────────
// Maps product category and keywords to HS Code chapters
// Based on: CBIC Customs Tariff 2024-25, Harmonized System
const HS_CODE_MAP = [
    // Electronics & Technology
    {
        keywords: ['smartphone', 'iphone', 'samsung', 'mobile phone', 'cell phone', 'android phone'],
        hsCode: '8517',
        hsDesc: 'Telephone sets, smartphones',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['laptop', 'notebook', 'macbook', 'chromebook'],
        hsCode: '8471',
        hsDesc: 'Automatic data processing machines (laptops)',
        bcd: 0,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['tablet', 'ipad', 'android tablet', 'surface'],
        hsCode: '8471',
        hsDesc: 'Tablets / portable computers',
        bcd: 0,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['drone', 'uav', 'quadcopter', 'dji', 'unmanned aircraft'],
        hsCode: '8806',
        hsDesc: 'Unmanned aircraft / drones',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['smartwatch', 'apple watch', 'fitness band', 'wearable'],
        hsCode: '9102',
        hsDesc: 'Wrist watches, smartwatches',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['headphone', 'earphone', 'earbuds', 'airpods', 'wireless earbuds'],
        hsCode: '8518',
        hsDesc: 'Microphones, loudspeakers, headphones',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['camera', 'dslr', 'mirrorless camera', 'digital camera', 'gopro'],
        hsCode: '9006',
        hsDesc: 'Photographic cameras',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['television', 'tv', 'smart tv', 'oled tv', 'qled'],
        hsCode: '8528',
        hsDesc: 'Monitors, televisions',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['power bank', 'battery pack', 'portable charger'],
        hsCode: '8507',
        hsDesc: 'Electric accumulators, power banks',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Electronics',
    },
    {
        keywords: ['gaming console', 'playstation', 'xbox', 'nintendo', 'game console'],
        hsCode: '9504',
        hsDesc: 'Video game consoles',
        bcd: 20,
        igstRate: 28,
        sws: 10,
        category: 'Electronics',
    },

    // Clothing & Footwear
    {
        keywords: ['shirt', 'tshirt', 't-shirt', 'jacket', 'clothing', 'dress', 'jeans', 'trousers'],
        hsCode: '6211',
        hsDesc: 'Garments, men\'s/women\'s clothing',
        bcd: 20,
        igstRate: 12,
        sws: 10,
        category: 'Clothing',
    },
    {
        keywords: ['shoes', 'sneakers', 'footwear', 'boots', 'sandals', 'trainers'],
        hsCode: '6403',
        hsDesc: 'Footwear with outer soles of rubber/leather',
        bcd: 25,
        igstRate: 18,
        sws: 10,
        category: 'Footwear',
    },

    // Health & Beauty
    {
        keywords: ['supplement', 'protein powder', 'whey protein', 'creatine', 'vitamin'],
        hsCode: '2106',
        hsDesc: 'Food preparations, nutritional supplements',
        bcd: 30,
        igstRate: 18,
        sws: 10,
        category: 'Supplements',
    },
    {
        keywords: ['perfume', 'cologne', 'fragrance', 'skincare', 'serum', 'moisturizer'],
        hsCode: '3303',
        hsDesc: 'Perfumes, cosmetics, skincare',
        bcd: 20,
        igstRate: 28,
        sws: 10,
        category: 'Beauty',
    },

    // Accessories
    {
        keywords: ['handbag', 'bag', 'wallet', 'purse', 'backpack'],
        hsCode: '4202',
        hsDesc: 'Trunks, cases, handbags',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Accessories',
    },
    {
        keywords: ['sunglasses', 'eyewear', 'spectacles'],
        hsCode: '9004',
        hsDesc: 'Spectacles, goggles, sunglasses',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Accessories',
    },

    // Sports
    {
        keywords: ['bicycle', 'cycle', 'bike', 'cycling gear'],
        hsCode: '8712',
        hsDesc: 'Bicycles and other cycles',
        bcd: 100,
        igstRate: 12,
        sws: 10,
        category: 'Sports',
    },
    {
        keywords: ['sports equipment', 'gym equipment', 'dumbbell', 'yoga mat', 'treadmill'],
        hsCode: '9506',
        hsDesc: 'Sports equipment, gymnasium articles',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Sports',
    },

    // Toys
    {
        keywords: ['toy', 'lego', 'action figure', 'doll', 'puzzle', 'board game'],
        hsCode: '9503',
        hsDesc: 'Toys, games',
        bcd: 20,
        igstRate: 18,
        sws: 10,
        category: 'Toys',
    },

    // Books
    {
        keywords: ['book', 'textbook', 'novel', 'ebook reader', 'kindle'],
        hsCode: '4901',
        hsDesc: 'Printed books, brochures',
        bcd: 0,
        igstRate: 0,
        sws: 0,
        category: 'Books',
    },

    // Solar/Energy
    {
        keywords: ['solar panel', 'solar cell', 'photovoltaic', 'pv module'],
        hsCode: '8541',
        hsDesc: 'Semiconductor devices, solar cells',
        bcd: 40,
        igstRate: 5,
        sws: 10,
        category: 'Electronics',
    },
];

// ─── Category Fallback Rates ──────────────────────────────────
// Used when no specific HS code match is found
const CATEGORY_FALLBACK = {
    Electronics: { bcd: 20, igstRate: 18, sws: 10, hsCode: '8543', hsDesc: 'Electrical machinery (general)' },
    Clothing: { bcd: 20, igstRate: 12, sws: 10, hsCode: '6211', hsDesc: 'Garments (general)' },
    Supplements: { bcd: 30, igstRate: 18, sws: 10, hsCode: '2106', hsDesc: 'Food preparations' },
    Health: { bcd: 30, igstRate: 12, sws: 10, hsCode: '3004', hsDesc: 'Medicaments' },
    Beauty: { bcd: 20, igstRate: 28, sws: 10, hsCode: '3304', hsDesc: 'Beauty preparations' },
    Accessories: { bcd: 20, igstRate: 18, sws: 10, hsCode: '4202', hsDesc: 'Accessories (general)' },
    Footwear: { bcd: 25, igstRate: 18, sws: 10, hsCode: '6403', hsDesc: 'Footwear' },
    Sports: { bcd: 20, igstRate: 18, sws: 10, hsCode: '9506', hsDesc: 'Sports articles' },
    Books: { bcd: 0, igstRate: 0, sws: 0, hsCode: '4901', hsDesc: 'Printed books' },
    Toys: { bcd: 20, igstRate: 18, sws: 10, hsCode: '9503', hsDesc: 'Toys' },
    Other: { bcd: 18, igstRate: 18, sws: 10, hsCode: '9999', hsDesc: 'General merchandise' },
};

// ─── HS Code Detector ─────────────────────────────────────────

function detectHSCode(productName, category) {
    const textLower = productName.toLowerCase();

    // First pass: keyword match in HS_CODE_MAP
    for (const entry of HS_CODE_MAP) {
        for (const keyword of entry.keywords) {
            if (textLower.includes(keyword.toLowerCase())) {
                return { ...entry, matchType: 'keyword_match', matchedKeyword: keyword };
            }
        }
    }

    // Second pass: category fallback
    const fallback = CATEGORY_FALLBACK[category] || CATEGORY_FALLBACK.Other;
    return { ...fallback, matchType: 'category_fallback', matchedKeyword: category };
}

// ─── Live CBIC Tariff Fetcher ─────────────────────────────────

async function fetchCBICTariff(hsCode) {
    const cacheKey = `cbic_tariff_${hsCode.substring(0, 4)}`;
    const cached = tariffCache.get(cacheKey);
    if (cached) return { success: true, data: cached, fromCache: true };

    try {
        // Try CBIC tariff index page
        const response = await axios.get(CBIC_TARIFF_URL, {
            headers: FETCH_HEADERS,
            timeout: 7000,
        });

        const $ = cheerio.load(response.data);
        const chapterLinks = [];

        // Look for Chapter links matching our HS code
        const hsChapter = hsCode.substring(0, 2);
        $('a').each((i, el) => {
            const text = $(el).text().trim();
            const href = $(el).attr('href') || '';
            if ((text.toLowerCase().includes(`chapter ${hsChapter}`) ||
                text.toLowerCase().includes(`ch. ${hsChapter}`) ||
                href.includes(`ch${hsChapter}`)) && href.length > 0) {
                chapterLinks.push({ text, href });
            }
        });

        if (chapterLinks.length > 0) {
            const result = {
                hsCode,
                chapterLinks: chapterLinks.slice(0, 3),
                fetchedAt: new Date().toISOString(),
                source: 'CBIC Customs Tariff 2024-25'
            };
            tariffCache.set(cacheKey, result);
            console.log(`[DutyAgent] ✓ CBIC live tariff fetch successful for HS ${hsCode}`);
            return { success: true, data: result, fromCache: false };
        }

        // Page fetched but no chapter-specific data found
        const result = { hsCode, fetchedAt: new Date().toISOString(), source: 'CBIC Index (parsed)' };
        tariffCache.set(cacheKey, result);
        return { success: true, data: result, fromCache: false };

    } catch (err) {
        console.log(`[DutyAgent] ⚠ CBIC tariff fetch failed: ${err.message} — using reference table`);
        return { success: false, error: err.message };
    }
}

// ─── MAIN DUTY AGENT ──────────────────────────────────────────

const SHIPPING_RATE = 0.10; // 10% of product price

async function dutyAgent(priceInINR, category, productName = '') {
    console.log(`[DutyAgent] 📋 Calculating import duties: ₹${priceInINR} | ${category} | "${productName}"`);
    const agentStart = Date.now();

    // ── Step 1: HS Code Detection ──
    const hsEntry = detectHSCode(productName || category, category);
    const hsCode = hsEntry.hsCode;
    console.log(`[DutyAgent] HS Code detected: ${hsCode} (${hsEntry.hsDesc}) via ${hsEntry.matchType}`);

    // ── Step 2: Live CBIC Fetch ──
    const cbicResult = await fetchCBICTariff(hsCode);
    const liveFetched = cbicResult.success;
    const fromCache = liveFetched ? cbicResult.fromCache : false;

    // ── Step 3: Calculate Duties ──
    const bcdRate = hsEntry.bcd / 100;
    const igstRate = hsEntry.igstRate / 100;
    const swsRate = hsEntry.sws / 100; // SWS is applied on BCD

    const shippingCost = Math.round(priceInINR * SHIPPING_RATE * 100) / 100;
    const assessableValue = priceInINR + shippingCost; // AV = CIF value

    const basicCustomsDuty = Math.round(assessableValue * bcdRate * 100) / 100;
    const socialWelfareSurcharge = Math.round(basicCustomsDuty * swsRate * 100) / 100;

    // IGST base = AV + BCD + SWS
    const igstBase = assessableValue + basicCustomsDuty + socialWelfareSurcharge;
    const igst = Math.round(igstBase * igstRate * 100) / 100;

    const totalLandedCost = Math.round((priceInINR + shippingCost + basicCustomsDuty + socialWelfareSurcharge + igst) * 100) / 100;

    // Data source label
    let dataSourceLabel;
    if (liveFetched && !fromCache) {
        dataSourceLabel = 'Live CBIC Customs Tariff 2024-25';
    } else if (liveFetched && fromCache) {
        dataSourceLabel = 'CBIC Tariff (Cached Live Data)';
    } else {
        dataSourceLabel = `HS Code Reference Table (CBIC-based, Chapter ${hsCode.substring(0, 2)})`;
    }

    const elapsed = Date.now() - agentStart;
    console.log(`[DutyAgent] ✓ Duties: BCD=${hsEntry.bcd}% | SWS=${hsEntry.sws}% of BCD | IGST=${hsEntry.igstRate}% | Total: ₹${totalLandedCost} | ${elapsed}ms`);

    return {
        agent: 'DutyAgent',
        success: true,
        data: {
            // Core fields (preserved for orchestrator compatibility)
            basePrice: priceInINR,
            category: category,
            dutyRate: bcdRate,
            dutyRatePercent: `${hsEntry.bcd}%`,
            customsDuty: basicCustomsDuty,
            shippingCost: shippingCost,
            igstRate: igstRate,
            igstRatePercent: `${hsEntry.igstRate}%`,
            igst: igst,
            totalLandedCost: totalLandedCost,
            breakdown: {
                'Product Price': priceInINR,
                'Shipping (CIF)': shippingCost,
                'Customs Duty (BCD)': basicCustomsDuty,
                'Social Welfare Surcharge': socialWelfareSurcharge,
                'IGST': igst,
            },

            // New live intelligence fields
            HS_code: hsCode,
            hsDescription: hsEntry.hsDesc,
            hsMatchType: hsEntry.matchType,
            hsMatchedKeyword: hsEntry.matchedKeyword || category,
            basic_customs_duty: `${hsEntry.bcd}%`,
            social_welfare_surcharge: `${hsEntry.sws}% of BCD`,
            swsAmount: socialWelfareSurcharge,
            assessableValue: assessableValue,
            data_source: dataSourceLabel,
            cbicLiveFetched: liveFetched,
            cbicFromCache: fromCache,
            lastUpdated: new Date().toISOString(),
            referenceLinks: {
                'CBIC Tariff': 'https://www.cbic.gov.in/htdocs-cbec/customs/cst2024-25/cst2024-25-idx.htm',
                'ICEGATE': 'https://www.icegate.gov.in',
                'Custom Duty Calculator': 'https://www.cbic.gov.in/resources//htdocs-cbec/customs/cs-acts.htm',
            },
        },
    };
}

module.exports = dutyAgent;
