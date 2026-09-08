// ============================================
// AGENT 6 — RECOMMENDATION AGENT
// Provides final buying recommendation
// Now accepts compliance data from Agent 7
// ============================================

/**
 * Calculate Import Intelligence Score (0-100)
 */
function calculateIntelligenceScore(savings, riskLevel, deliveryDays, complianceLevel) {
    let score = 50; // Base score

    // Compliance override — prohibited items hard-cap at 5
    if (complianceLevel === 'PROHIBITED') return 2;
    if (complianceLevel === 'RESTRICTED') score = Math.min(score, 30);
    if (complianceLevel === 'MODERATE_RISK') score = Math.min(score, 45);

    // Price advantage factor (±30 points)
    if (savings > 0) {
        const savingsBonus = Math.min(30, (savings / 100) * 3);
        score += savingsBonus;
    } else {
        const lossDeduction = Math.min(30, (Math.abs(savings) / 100) * 3);
        score -= lossDeduction;
    }

    // Risk factor (±20 points)
    if (riskLevel === 'Low') score += 15;
    else if (riskLevel === 'Medium') score += 0;
    else if (riskLevel === 'High') score -= 20;

    // Shipping time factor (±10 points)
    const avgDelivery = (deliveryDays.min + deliveryDays.max) / 2;
    if (avgDelivery <= 14) score += 10;
    else if (avgDelivery <= 21) score += 5;
    else score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get score label and color
 */
function getScoreLabel(score) {
    if (score >= 80) return { label: 'Excellent deal to import!', color: '#10b981' };
    if (score >= 65) return { label: 'Good deal to import', color: '#22c55e' };
    if (score >= 50) return { label: 'Marginal — consider carefully', color: '#f59e0b' };
    if (score >= 35) return { label: 'Not recommended to import', color: '#f97316' };
    if (score <= 5) return { label: 'Import PROHIBITED by law', color: '#dc2626' };
    return { label: 'Strongly advise buying locally', color: '#ef4444' };
}

/**
 * Recommendation Agent - makes final buying decision
 * @param {number} totalLandedCost
 * @param {number} bestLocalPrice
 * @param {number} amazonPrice
 * @param {number} flipkartPrice
 * @param {string} riskLevel - Low/Medium/High
 * @param {object} deliveryDays - {min, max}
 * @param {string} productName
 * @param {object} compliance - result from ComplianceAgent
 */
async function recommendationAgent(
    totalLandedCost,
    bestLocalPrice,
    amazonPrice,
    flipkartPrice,
    riskLevel,
    deliveryDays,
    productName,
    compliance = null
) {
    console.log(`[RecommendationAgent] Comparing import ₹${totalLandedCost} vs local ₹${bestLocalPrice}`);

    const complianceLevel = compliance?.complianceLevel || 'SAFE';
    const isComplianceProhibited = complianceLevel === 'PROHIBITED';
    const isComplianceRestricted = complianceLevel === 'RESTRICTED';

    let recommendation, reason, savings;

    // ── COMPLIANCE OVERRIDE ──
    if (isComplianceProhibited) {
        recommendation = '❌ Do Not Import';
        reason = `Importing this product may violate Indian import regulations. ${compliance.violations[0]?.message || 'This product is prohibited from import into India.'}`;
        savings = bestLocalPrice ? Math.round((bestLocalPrice - totalLandedCost) * 100) / 100 : 0;

    } else if (isComplianceRestricted) {
        recommendation = '⚠️ Import Requires Authorization';
        reason = `This product requires special certification/license for import into India. ${compliance.violations[0]?.message || ''} Consider purchasing from certified Indian sellers.`;
        savings = bestLocalPrice ? Math.round((bestLocalPrice - totalLandedCost) * 100) / 100 : 0;

    } else {
        // ── NORMAL RECOMMENDATION LOGIC ──
        const hasLocalPrice = bestLocalPrice && bestLocalPrice > 0;

        if (!hasLocalPrice) {
            recommendation = 'Import the product';
            reason = `${productName} does not appear to be readily available on major Indian marketplaces. Importing may be your best option.`;
            savings = 0;
        } else {
            savings = Math.round((bestLocalPrice - totalLandedCost) * 100) / 100;

            if (totalLandedCost < bestLocalPrice) {
                recommendation = 'Import the product';
                reason = `Importing saves you ₹${savings.toFixed(0)} compared to the best local price (₹${bestLocalPrice.toFixed(0)}). ${riskLevel === 'High' ? 'However, be aware of the high customs risk.' : 'The import risk is manageable.'
                    }`;
            } else if (totalLandedCost > bestLocalPrice) {
                const extraCost = Math.abs(savings);
                recommendation = 'Buy locally in India';
                reason = `Importing costs ₹${extraCost.toFixed(0)} more than the best local price (₹${bestLocalPrice.toFixed(0)}). Buy locally for better value.`;
                if (extraCost < bestLocalPrice * 0.05) {
                    reason += ' The difference is minimal — if you need a specific variant, importing could still make sense.';
                }
            } else {
                recommendation = 'Buy locally in India';
                reason = 'The imported price and local price are roughly the same. Buying locally is safer and faster.';
            }
        }

        // Moderate compliance warning — append to reason
        if (complianceLevel === 'MODERATE_RISK' && compliance?.warnings?.length > 0) {
            reason += ` ⚠️ Note: ${compliance.warnings[0].message}`;
        }
    }

    const intelligenceScore = calculateIntelligenceScore(savings, riskLevel, deliveryDays, complianceLevel);
    const scoreInfo = getScoreLabel(intelligenceScore);

    const priceComparison = { importCost: totalLandedCost };
    if (amazonPrice) priceComparison['Amazon India'] = amazonPrice;
    if (flipkartPrice) priceComparison['Flipkart'] = flipkartPrice;

    return {
        agent: 'RecommendationAgent',
        success: true,
        data: {
            recommendation,
            reason,
            savings,
            savingsText: savings >= 0
                ? `You save ₹${savings.toFixed(0)} by importing`
                : `You save ₹${Math.abs(savings).toFixed(0)} by buying locally`,
            complianceOverride: isComplianceProhibited || isComplianceRestricted,
            importIntelligenceScore: {
                score: intelligenceScore,
                label: scoreInfo.label,
                color: scoreInfo.color,
            },
            priceComparison,
        },
    };
}

module.exports = recommendationAgent;
