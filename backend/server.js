// ============================================
// IMPORTSENSE AI — SERVER ENTRY POINT
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', analyzeRoutes);

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'ImportSense AI API',
        version: '1.0.0',
        description: 'Multi-Agent Import Intelligence System',
        endpoints: {
            analyze: 'POST /api/analyze',
            demoProducts: 'GET /api/demo-products',
            health: 'GET /api/health',
        },
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 ImportSense AI Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Demo products: http://localhost:${PORT}/api/demo-products\n`);
});
