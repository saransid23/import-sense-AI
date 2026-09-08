// ============================================
// API ROUTES
// Endpoints for product analysis
// ============================================

const express = require('express');
const router = express.Router();
const orchestrate = require('../orchestrator');
const demoProducts = require('../data/demoProducts');

/**
 * POST /api/analyze
 * Analyze a product URL and return full import intelligence
 *
 * Body:
 * - url (required): Product URL
 * - price (optional): Manual price override
 * - currency (optional): Manual currency override (e.g. "USD", "EUR")
 * - category (optional): Manual category override
 * - name (optional): Manual product name override
 */
router.post('/analyze', async (req, res) => {
    try {
        const { url, price, currency, category, name } = req.body;

        if (!url || typeof url !== 'string' || url.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid product URL',
            });
        }

        // Build overrides from user-provided fields
        const overrides = {};
        if (price) overrides.price = price;
        if (currency) overrides.currency = currency;
        if (category) overrides.category = category;
        if (name) overrides.name = name;

        const result = await orchestrate(url.trim(), overrides);
        return res.json(result);

    } catch (error) {
        console.error('[API] Analysis error:', error);
        return res.status(500).json({
            success: false,
            error: 'Analysis failed. Please try again.',
        });
    }
});

/**
 * GET /api/demo-products
 * Returns list of demo products for quick testing
 */
router.get('/demo-products', (req, res) => {
    const demos = demoProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        category: p.category,
        country: p.country,
        demoUrl: `https://demo.importsense.ai/product/${p.id}`,
    }));
    res.json({ success: true, products: demos });
});

/**
 * GET /api/health
 * Health check
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ImportSense AI',
        agents: 6,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
