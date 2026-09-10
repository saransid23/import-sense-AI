// ============================================
// ROUTE — EMERALD CHAT PROXY
// Proxy chat questions to Python AI Engine (/api/v1/chat)
// ============================================

const express = require('express');
const router = express.Router();
const axios = require('axios');

const PYTHON_CHAT_URL = 'http://127.0.0.1:8000/api/v1/chat';

/**
 * POST /api/chat
 * Scoped AI Chat Proxy for Emerald
 */
router.post('/chat', async (req, res) => {
    try {
        const { question, analysis_context, history } = req.body;

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Question is required',
            });
        }

        const response = await axios.post(
            PYTHON_CHAT_URL,
            {
                question: question.trim(),
                analysis_context: analysis_context || {},
                history: history || [],
            },
            { timeout: 45000 }
        );

        return res.json(response.data);
    } catch (error) {
        console.error('[API Chat Proxy] Error:', error.message);

        // Degraded fallback response if Python engine is unreachable
        return res.json({
            success: false,
            error: 'assistant unavailable',
            answer: 'Emerald is currently offline or unreachable. Make sure the Python AI Engine is running.',
            sources_used: [],
            llm_available: false,
        });
    }
});

module.exports = router;
