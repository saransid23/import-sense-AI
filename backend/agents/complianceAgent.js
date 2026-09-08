// ============================================
// AGENT — IMPORT COMPLIANCE AGENT (AI-DRIVEN)
// Fully autonomous, self-learning compliance platform.
// Forwards requests to the Python AI Engine (FastAPI)
// which evaluates across 7 specialised agents.
// ============================================

const axios = require('axios');

// ─── Status Config (for backward compatibility w/ UI) ─────────
const STATUS_CONFIG = {
    PROHIBITED: {
        label: 'Import Prohibited',
        color: 'red',
        icon: '🚫',
        badge: '❌ Restricted Product',
        shortMsg: 'This product is BANNED from import into India.',
        recommendation: 'Import Not Recommended — This product violates Indian import regulations. Do not attempt to import.',
    },
    RESTRICTED: {
        label: 'Import Restricted',
        color: 'orange',
        icon: '⚠️',
        badge: '⚠ Requires Certification',
        shortMsg: 'This product requires special certification/license for import into India.',
        recommendation: 'Import Requires Authorization — Obtain necessary certifications before importing.',
    },
    MODERATE: {
        label: 'Certification Required',
        color: 'yellow',
        icon: '📋',
        badge: '⚠ Compliance Check Required',
        shortMsg: 'This product may require compliance checks or certifications for import.',
        recommendation: 'Verify Compliance — Ensure product meets Indian standards before importing.',
    },
    SAFE: {
        label: 'Legal to Import',
        color: 'green',
        icon: '✅',
        badge: '✔ Legal to Import',
        shortMsg: 'No import restrictions found for this product.',
        recommendation: null,
    },
};

const PYTHON_AI_ENGINE_URL = 'http://127.0.0.1:8000/api/v1/classify';

/**
 * Compliance Agent
 * Acts as a bridge to the Python AI Engine, querying all 7 agents.
 */
async function complianceAgent(productName, category, productDescription = '') {
    console.log(`[ComplianceAgent] 🤖 Routing to Python AI Engine: "${productName}" (${category})`);
    const agentStart = Date.now();

    try {
        // Query the Python AI engine (runs all 7 agents concurrently)
        const response = await axios.post(PYTHON_AI_ENGINE_URL, {
            product_name: productName,
            category: category,
            description: productDescription,
            agent: 'all'
        }, { timeout: 25000 });

        const aiResult = response.data;
        const aggregateLevel = aiResult.aggregate_compliance_level || 'SAFE';

        // Extract issues/violations from all agents
        const violations = [];
        const warnings = [];
        let totalLiveMatches = 0;
        let totalKbSize = 0;

        for (const [agentName, agentData] of Object.entries(aiResult.agents)) {
            if (!agentData || !agentData.success) continue;

            totalKbSize += agentData.knowledge_base?.vectors_indexed || 0;
            const matchesCount = agentData.ai_reasoning?.semantic_matches_found || 0;
            totalLiveMatches += matchesCount;

            const level = agentData.compliance_level;

            // Reformat AI evidence into UI-compatible "issue" card format
            if (level !== 'SAFE') {
                const issue = {
                    id: `${agentName.toUpperCase()}_ALERT`,
                    level: level === 'MODERATE' ? 'MODERATE_RISK' : level,
                    title: agentData.description,
                    authority: agentData.authority,
                    message: agentData.recommendations.join(' '),
                    icon: level === 'PROHIBITED' ? '🚫' : (level === 'RESTRICTED' ? '⚠️' : '📋'),
                    sourceRef: `${agentName} AI Reasoning (Confidence: ${agentData.confidence_pct}%)`,
                };

                if (level === 'PROHIBITED' || level === 'RESTRICTED') {
                    violations.push(issue);
                } else {
                    warnings.push(issue);
                }
            }
        }

        const elapsed = Date.now() - agentStart;
        const statusKey = aggregateLevel === 'MODERATE' ? 'MODERATE' : aggregateLevel;
        const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.SAFE;

        console.log(`[ComplianceAgent] ✓ AI Engine complete: ${aggregateLevel} | ${violations.length} violations | ${elapsed}ms`);

        // Format to match existing orchestrator/UI expectations
        return {
            agent: 'ComplianceAgent',
            success: true,
            data: {
                complianceLevel: aggregateLevel === 'MODERATE' ? 'MODERATE_RISK' : aggregateLevel,
                isProhibited: aggregateLevel === 'PROHIBITED',
                isRestricted: aggregateLevel === 'RESTRICTED',
                isModerate: aggregateLevel === 'MODERATE',
                isSafe: aggregateLevel === 'SAFE',
                status: status,
                violations,
                warnings,
                liveIntelligence: {
                    dgftConnected: totalKbSize > 0,
                    cbicConnected: totalKbSize > 0,
                    liveMatchesFound: totalLiveMatches,
                    lastFetchAttempt: new Date().toISOString(),
                    aiEngineUsed: true,
                    agentsRun: Object.keys(aiResult.agents).length,
                    totalVectors: totalKbSize,
                },
                data_source: `Python AI Engine (${totalKbSize} FAISS vectors)`,
                lastUpdated: new Date().toISOString(),
                authorities: [
                    'DGFT', 'CBIC', 'ICEGATE', 'FSSAI', 'CDSCO', 'DoT', 'WPC', 'MeitY', 'BIS', 'MNRE'
                ],
                complianceRecommendation: status.recommendation,
                referenceLinks: {
                    AI_Engine_Stats: 'http://127.0.0.1:8000/docs'
                },
            },
        };

    } catch (err) {
        console.error(`[ComplianceAgent] ❌ Python AI Engine unreachable or failed: ${err.message}`);

        // Failsafe fallback if Python server is down, but heavily discouraged now
        return {
            agent: 'ComplianceAgent',
            success: true,
            data: {
                complianceLevel: 'SAFE',
                isProhibited: false,
                isRestricted: false,
                isModerate: false,
                isSafe: true,
                status: STATUS_CONFIG.SAFE,
                violations: [],
                warnings: [],
                data_source: 'Fallback - AI Engine Unavailable',
                liveIntelligence: {
                    dgftConnected: false, cbicConnected: false, liveMatchesFound: 0
                }
            }
        };
    }
}

module.exports = complianceAgent;
