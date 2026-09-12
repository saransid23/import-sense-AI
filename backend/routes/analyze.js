// ============================================
// API ROUTES
// Endpoints for product analysis
// ============================================

const express = require('express');
const router = express.Router();
const axios = require('axios');
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
 * GET /api/analyze/stream
 * SSE endpoint for live product analysis updates
 */
router.get('/analyze/stream', async (req, res) => {
    const { url, price, currency, category, name } = req.query;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid product URL',
        });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    let isClientConnected = true;
    req.on('close', () => {
        isClientConnected = false;
    });

    const overrides = {};
    if (price) overrides.price = price;
    if (currency) overrides.currency = currency;
    if (category) overrides.category = category;
    if (name) overrides.name = name;

    const onAgentUpdate = (agentName, status, extra) => {
        if (!isClientConnected) return;
        const payload = JSON.stringify({ agent: agentName, status, extra, timestamp: new Date().toISOString() });
        res.write(`event: agent-update\ndata: ${payload}\n\n`);
    };

    try {
        const result = await orchestrate(url.trim(), overrides, onAgentUpdate);
        if (isClientConnected) {
            if (result.success || result.needsManualInput) {
                res.write(`event: complete\ndata: ${JSON.stringify(result)}\n\n`);
            } else {
                res.write(`event: error\ndata: ${JSON.stringify({ error: result.error || 'Analysis failed' })}\n\n`);
            }
            res.end();
        }
    } catch (error) {
        console.error('[API Stream] Error:', error);
        if (isClientConnected) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Analysis failed. Please try again.' })}\n\n`);
            res.end();
        }
    }
});

/**
 * POST /api/feedback
 * Proxy feedback to Python AI Engine (/api/v1/feedback)
 */
router.post('/feedback', async (req, res) => {
    try {
        const aiEngineBase = (process.env.PYTHON_AI_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
        const pythonRes = await axios.post(`${aiEngineBase}/api/v1/feedback`, {
            agent: agent || 'import_compliance',
            product_name: product_name || 'Unknown Product',
            predicted_level: predicted_level || 'SAFE',
            outcome: outcome || 'approved',
            notes: notes || '',
        }, { timeout: 5000 });

        return res.json(pythonRes.data);
    } catch (error) {
        console.error('[API Feedback] Proxy error:', error.message);
        return res.status(503).json({
            success: false,
            error: 'Feedback loop service temporarily unavailable',
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
        agents: 7,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
