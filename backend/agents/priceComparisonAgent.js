// ============================================
// AGENT 4 — PRICE COMPARISON AGENT
// Finds local marketplace prices in India
// With 80% keyword similarity validation
// ============================================

const demoProducts = require('../data/demoProducts');

// ─── Keyword Similarity Engine ───────────────────────────────

/**
 * Tokenize a product string into meaningful keywords
 * Removes noise words and normalizes
 */
function tokenize(text) {
    const noise = new Set([
        'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to',
        'of', 'by', 'from', 'is', 'it', 'this', 'that', 'new', 'best', 'top',
        'buy', 'sale', 'offer', 'deal', 'price', 'online', 'india', 'latest',
        '-', '–', '|', '/', '(', ')', '[', ']',
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1 && !noise.has(word));
}

/**
 * Calculate keyword similarity percentage between two strings
 * Returns 0-100 score
 */
function calculateSimilarity(sourceTitle, targetTitle) {
    const sourceTokens = tokenize(sourceTitle);
    const targetTokens = tokenize(targetTitle);

    if (sourceTokens.length === 0) return 0;

    let matches = 0;
    for (const token of sourceTokens) {
        // Check exact match or close match (e.g., "headphones" vs "headphone")
        const found = targetTokens.some(t =>
            t === token ||
            t.includes(token) ||
            token.includes(t) ||
            (token.length > 3 && levenshtein(token, t) <= 2)
        );
        if (found) matches++;
    }

    return Math.round((matches / sourceTokens.length) * 100);
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Validate brand match specifically
 */
function brandMatch(brand, title) {
    if (!brand) return true; // no brand to validate
    return title.toLowerCase().includes(brand.toLowerCase());
}

/**
 * Validate storage match for phones/tablets
 */
function storageMatch(storage, title) {
    if (!storage) return true; // no storage to validate
    return title.toLowerCase().includes(storage.toLowerCase());
}

/**
 * Validate model match
 */
function modelMatch(model, title) {
    if (!model) return true;
    const modelNormalized = model.toLowerCase().replace(/\s+/g, '');
    const titleNormalized = title.toLowerCase().replace(/\s+/g, '');
    return titleNormalized.includes(modelNormalized);
}

// ─── Price Simulation for Non-Demo Products ──────────────────

const INDIA_PRICE_MULTIPLIERS = {
    Electronics: { amazonMin: 1.05, amazonMax: 1.20, flipkartMin: 1.03, flipkartMax: 1.18 },
    Clothing: { amazonMin: 0.70, amazonMax: 0.90, flipkartMin: 0.65, flipkartMax: 0.85 },
    Footwear: { amazonMin: 0.90, amazonMax: 1.10, flipkartMin: 0.85, flipkartMax: 1.05 },
    Supplements: { amazonMin: 1.10, amazonMax: 1.40, flipkartMin: 1.15, flipkartMax: 1.50 },
    Health: { amazonMin: 1.05, amazonMax: 1.30, flipkartMin: 1.10, flipkartMax: 1.35 },
    Beauty: { amazonMin: 0.85, amazonMax: 1.15, flipkartMin: 0.90, flipkartMax: 1.20 },
    Accessories: { amazonMin: 0.80, amazonMax: 1.10, flipkartMin: 0.75, flipkartMax: 1.05 },
    Sports: { amazonMin: 0.90, amazonMax: 1.15, flipkartMin: 0.95, flipkartMax: 1.20 },
    Books: { amazonMin: 0.85, amazonMax: 0.95, flipkartMin: 0.80, flipkartMax: 0.95 },
    Toys: { amazonMin: 1.00, amazonMax: 1.20, flipkartMin: 0.95, flipkartMax: 1.15 },
    Other: { amazonMin: 0.90, amazonMax: 1.15, flipkartMin: 0.85, flipkartMax: 1.10 },
};

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function simulatePrice(basePrice, min, max, productName) {
    const hash = hashCode(productName);
    const factor = min + (hash % 1000) / 1000 * (max - min);
    const price = Math.round(basePrice * factor);
    const endings = [99, 95, 90, 49, 0];
    const lastTwo = price % 100;
    const closest = endings.reduce((a, b) => Math.abs(b - lastTwo) < Math.abs(a - lastTwo) ? b : a);
    return Math.max(price - lastTwo + closest, 99);
}

/**
 * Generate simulated Indian marketplace title for non-demo products
 * Uses the identity to create realistic Indian marketplace listings
 */
function generateIndianTitle(identity, marketplace) {
    const parts = [];
    if (identity.brand) parts.push(identity.brand);
    if (identity.model) parts.push(identity.model);
    if (identity.storage) parts.push(identity.storage);
    if (identity.color) parts.push(identity.color);
    if (identity.variant) parts.push(identity.variant);

    const suffix = marketplace === 'Amazon India'
        ? (identity.category === 'Electronics' ? '' : '')
        : '';

    return parts.join(' ') + suffix;
}

// ─── Match Quality Validation ────────────────────────────────

const SIMILARITY_THRESHOLD = 80; // Minimum 80% match required

/**
 * Validate a marketplace result against the original product
 */
function validateMatch(productFullIdentity, productIdentity, marketplaceTitle) {
    const similarity = calculateSimilarity(productFullIdentity, marketplaceTitle);
    const hasBrand = brandMatch(productIdentity.brand, marketplaceTitle);
    const hasModel = modelMatch(productIdentity.model, marketplaceTitle);
    const hasStorage = storageMatch(productIdentity.storage, marketplaceTitle);

    const valid = similarity >= SIMILARITY_THRESHOLD && hasBrand;

    return {
        similarity,
        hasBrand,
        hasModel,
        hasStorage,
        valid,
        reason: !valid
            ? similarity < SIMILARITY_THRESHOLD
                ? `Similarity ${similarity}% is below ${SIMILARITY_THRESHOLD}% threshold`
                : `Brand mismatch: expected "${productIdentity.brand}"`
            : `Match confirmed at ${similarity}% similarity`,
    };
}

// ─── MAIN AGENT ─────────────────────────────────────────────

/**
 * Price Comparison Agent
 * @param {string} productName - Full product name
 * @param {string} category - Product category
 * @param {number} basePriceINR - Base price in INR for simulation
 * @param {object} identity - Product identity object from ProductAgent
 */
async function priceComparisonAgent(productName, category, basePriceINR, identity = {}) {
    console.log(`[PriceComparisonAgent] Searching Indian prices for: ${productName}`);
    console.log(`[PriceComparisonAgent] Identity: Brand=${identity.brand || '?'} Model=${identity.model || '?'} Storage=${identity.storage || '?'}`);

    const fullIdentity = identity.fullIdentity || productName;

    // Try demo product match first
    const lower = productName.toLowerCase();
    const demo = demoProducts.find(
        p => lower.includes(p.name.toLowerCase().split(' ')[0])
            || p.keywords.some(k => lower.includes(k))
    );

    let amazonResult = null;
    let flipkartResult = null;

    if (demo && demo.indianPrices) {
        // ── Demo product: validate match quality ──
        const amazonData = demo.indianPrices.amazonIndia;
        const flipkartData = demo.indianPrices.flipkart;

        const amazonValidation = validateMatch(fullIdentity, identity, amazonData.title);
        const flipkartValidation = validateMatch(fullIdentity, identity, flipkartData.title);

        console.log(`[PriceComparisonAgent] Amazon India: "${amazonData.title}" → ${amazonValidation.similarity}% match`);
        console.log(`[PriceComparisonAgent] Flipkart: "${flipkartData.title}" → ${flipkartValidation.similarity}% match`);

        if (amazonValidation.valid) {
            amazonResult = {
                price: amazonData.price,
                available: true,
                marketplace: 'Amazon India',
                title: amazonData.title,
                matchScore: amazonValidation.similarity,
                matchStatus: 'exact_match',
                url: `https://www.amazon.in/s?k=${encodeURIComponent(fullIdentity)}`,
            };
        } else {
            amazonResult = {
                available: false,
                marketplace: 'Amazon India',
                matchScore: amazonValidation.similarity,
                matchStatus: 'no_exact_match',
                closestMatch: { title: amazonData.title, price: amazonData.price },
                reason: amazonValidation.reason,
                url: `https://www.amazon.in/s?k=${encodeURIComponent(fullIdentity)}`,
            };
        }

        if (flipkartValidation.valid) {
            flipkartResult = {
                price: flipkartData.price,
                available: true,
                marketplace: 'Flipkart',
                title: flipkartData.title,
                matchScore: flipkartValidation.similarity,
                matchStatus: 'exact_match',
                url: `https://www.flipkart.com/search?q=${encodeURIComponent(fullIdentity)}`,
            };
        } else {
            flipkartResult = {
                available: false,
                marketplace: 'Flipkart',
                matchScore: flipkartValidation.similarity,
                matchStatus: 'no_exact_match',
                closestMatch: { title: flipkartData.title, price: flipkartData.price },
                reason: flipkartValidation.reason,
                url: `https://www.flipkart.com/search?q=${encodeURIComponent(fullIdentity)}`,
            };
        }

    } else if (basePriceINR && basePriceINR > 0) {
        // ── Simulated prices for non-demo products ──
        const multipliers = INDIA_PRICE_MULTIPLIERS[category] || INDIA_PRICE_MULTIPLIERS.Other;

        const amazonPrice = simulatePrice(basePriceINR, multipliers.amazonMin, multipliers.amazonMax, productName + '_amazon');
        const flipkartPrice = simulatePrice(basePriceINR, multipliers.flipkartMin, multipliers.flipkartMax, productName + '_flipkart');

        const amazonTitle = generateIndianTitle({ ...identity, category }, 'Amazon India');
        const flipkartTitle = generateIndianTitle({ ...identity, category }, 'Flipkart');

        const amazonSimilarity = calculateSimilarity(fullIdentity, amazonTitle);
        const flipkartSimilarity = calculateSimilarity(fullIdentity, flipkartTitle);

        console.log(`[PriceComparisonAgent] Simulated Amazon: ₹${amazonPrice} — "${amazonTitle}" (${amazonSimilarity}% match)`);
        console.log(`[PriceComparisonAgent] Simulated Flipkart: ₹${flipkartPrice} — "${flipkartTitle}" (${flipkartSimilarity}% match)`);

        amazonResult = {
            price: amazonPrice,
            available: true,
            marketplace: 'Amazon India',
            title: amazonTitle,
            matchScore: amazonSimilarity,
            matchStatus: amazonSimilarity >= SIMILARITY_THRESHOLD ? 'simulated_match' : 'approximate',
            url: `https://www.amazon.in/s?k=${encodeURIComponent(fullIdentity)}`,
        };

        flipkartResult = {
            price: flipkartPrice,
            available: true,
            marketplace: 'Flipkart',
            title: flipkartTitle,
            matchScore: flipkartSimilarity,
            matchStatus: flipkartSimilarity >= SIMILARITY_THRESHOLD ? 'simulated_match' : 'approximate',
            url: `https://www.flipkart.com/search?q=${encodeURIComponent(fullIdentity)}`,
        };
    }

    // ── Build final result ──
    const validPrices = [
        amazonResult?.available ? amazonResult.price : null,
        flipkartResult?.available ? flipkartResult.price : null,
    ].filter(Boolean);

    const averagePrice = validPrices.length > 0
        ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
        : null;

    // Check if we got any exact matches at all
    const hasExactMatch = (amazonResult?.matchStatus === 'exact_match' || flipkartResult?.matchStatus === 'exact_match');
    const hasAnyMatch = validPrices.length > 0;

    let matchQuality = 'no_match';
    if (hasExactMatch) matchQuality = 'exact';
    else if (hasAnyMatch) matchQuality = 'approximate';

    return {
        agent: 'PriceComparisonAgent',
        success: true,
        data: {
            productName: productName,
            searchQuery: fullIdentity,
            matchQuality: matchQuality,
            similarityThreshold: SIMILARITY_THRESHOLD,
            amazonIndia: amazonResult || {
                available: false,
                marketplace: 'Amazon India',
                matchStatus: 'not_found',
                url: `https://www.amazon.in/s?k=${encodeURIComponent(fullIdentity)}`,
            },
            flipkart: flipkartResult || {
                available: false,
                marketplace: 'Flipkart',
                matchStatus: 'not_found',
                url: `https://www.flipkart.com/search?q=${encodeURIComponent(fullIdentity)}`,
            },
            averageIndianPrice: averagePrice,
            bestLocalPrice: validPrices.length > 0 ? Math.min(...validPrices) : null,
            noExactMatchMessage: !hasExactMatch && hasAnyMatch
                ? 'No exact product match found in Indian marketplaces. Showing closest matches.'
                : null,
        },
    };
}

module.exports = priceComparisonAgent;
