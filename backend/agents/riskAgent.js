// ============================================
// AGENT — RISK AGENT (UPGRADED)
// Composite Import Intelligence Score (0–100)
// Combines: Compliance + Country + Category + Price risk
// ============================================

/**
 * Country-of-origin risk profiles
 * Score: 100 = lowest risk, 0 = highest risk
 */
const COUNTRY_RISK = {
    'USA': { score: 85, flag: '🇺🇸', label: 'Low Risk', reason: 'Strong trade relations, reliable shipping' },
    'US': { score: 85, flag: '🇺🇸', label: 'Low Risk', reason: 'Strong trade relations, reliable shipping' },
    'UK': { score: 85, flag: '🇬🇧', label: 'Low Risk', reason: 'Established trade channels, low customs issues' },
    'Germany': { score: 82, flag: '🇩🇪', label: 'Low Risk', reason: 'High quality standards, smooth customs processing' },
    'Japan': { score: 80, flag: '🇯🇵', label: 'Low Risk', reason: 'Reliable quality, established export processes' },
    'South Korea': { score: 78, flag: '🇰🇷', label: 'Low Risk', reason: 'Strong electronics export, good compliance' },
    'Singapore': { score: 82, flag: '🇸🇬', label: 'Low Risk', reason: 'Major trade hub, reliable logistics' },
    'Australia': { score: 80, flag: '🇦🇺', label: 'Low Risk', reason: 'Trusted trade partner, low customs risk' },
    'China': { score: 40, flag: '🇨🇳', label: 'Higher Risk', reason: 'Chinese imports face enhanced DGFT/Customs scrutiny, anti-dumping duties common, drone imports from China require special DGFT license' },
    'Pakistan': { score: 20, flag: '🇵🇰', label: 'High Risk', reason: 'Severely restricted trade, most imports require special clearance' },
    'Bangladesh': { score: 65, flag: '🇧🇩', label: 'Moderate Risk', reason: 'Some trade restrictions apply, verify product quality standards' },
    'Taiwan': { score: 70, flag: '🇹🇼', label: 'Moderate Risk', reason: 'Good quality electronics, some geopolitical trade considerations' },
    'Vietnam': { score: 68, flag: '🇻🇳', label: 'Moderate Risk', reason: 'Growing manufacturing hub, generally reliable' },
};

/**
 * Category risk profiles
 * Score: 100 = lowest customs risk, 0 = highest customs risk
 */
const CATEGORY_RISK = {
    'Electronics': { score: 55, inspectionRate: '40-60%', reason: 'High-value electronics frequently inspected, BIS compliance checks required' },
    'Health': { score: 30, inspectionRate: '70-90%', reason: 'Health products frequently flagged, may require FSSAI/CDSCO approval' },
    'Supplements': { score: 30, inspectionRate: '70-90%', reason: 'Supplements frequently flagged by customs, FSSAI approval may be needed' },
    'Clothing': { score: 75, inspectionRate: '5-15%', reason: 'Generally low inspection risk for personal quantities' },
    'Footwear': { score: 72, inspectionRate: '10-20%', reason: 'Low inspection risk for personal use quantities' },
    'Beauty': { score: 50, inspectionRate: '30-50%', reason: 'Cosmetics may face CDSCO/BIS compliance checks' },
    'Accessories': { score: 60, inspectionRate: '20-35%', reason: 'Standard inspection rates for accessories' },
    'Sports': { score: 65, inspectionRate: '15-25%', reason: 'Generally low risk unless premium value' },
    'Books': { score: 95, inspectionRate: '<5%', reason: 'Books rarely inspected, minimal duty' },
    'Toys': { score: 55, inspectionRate: '30-50%', reason: 'Toys require BIS safety certification for import' },
    'Other': { score: 55, inspectionRate: '20-40%', reason: 'Standard customs processing applies' },
};

/**
 * Estimate delivery days based on country
 */
function estimateDeliveryDays(country) {
    const deliveryMap = {
        'China': { min: 15, max: 30 },
        'US': { min: 10, max: 20 },
        'USA': { min: 10, max: 20 },
        'UK': { min: 10, max: 18 },
        'Japan': { min: 12, max: 22 },
        'South Korea': { min: 12, max: 22 },
        'Germany': { min: 12, max: 20 },
        'Singapore': { min: 8, max: 15 },
        'Australia': { min: 12, max: 22 },
        'Taiwan': { min: 10, max: 20 },
        'Vietnam': { min: 10, max: 20 },
    };
    return deliveryMap[country] || { min: 14, max: 28 };
}

/**
 * Calculate composite Import Intelligence Score (0–100)
 * Weighted formula:
 *   Compliance Risk     = 40% weight
 *   Country of Origin   = 20% weight
 *   Product Category    = 20% weight
 *   Price Risk          = 20% weight
 */
function calculateImportIntelligenceScore(complianceLevel, country, category, priceINR) {
    // ── Compliance Score (0-100, lower = worse) ──
    const complianceScores = {
        'PROHIBITED': 0,
        'RESTRICTED': 20,
        'MODERATE_RISK': 50,
        'SAFE': 100,
    };
    const complianceScore = complianceScores[complianceLevel] ?? 80;

    // ── Country Score ──
    const countryData = COUNTRY_RISK[country];
    const countryScore = countryData ? countryData.score : 65; // default moderate

    // ── Category Score ──
    const categoryData = CATEGORY_RISK[category];
    const categoryScore = categoryData ? categoryData.score : 55;

    // ── Price Score (higher price = higher risk) ──
    let priceScore;
    if (priceINR <= 5000) priceScore = 90;
    else if (priceINR <= 15000) priceScore = 75;
    else if (priceINR <= 30000) priceScore = 60;
    else if (priceINR <= 50000) priceScore = 45;
    else if (priceINR <= 100000) priceScore = 30;
    else priceScore = 15;

    // ── Weighted composite ──
    const rawScore = (
        (complianceScore * 0.40) +
        (countryScore * 0.20) +
        (categoryScore * 0.20) +
        (priceScore * 0.20)
    );

    return {
        total: Math.max(0, Math.min(100, Math.round(rawScore))),
        breakdown: {
            complianceScore: Math.round(complianceScore),
            countryScore: Math.round(countryScore),
            categoryScore: Math.round(categoryScore),
            priceScore: Math.round(priceScore),
        }
    };
}

/**
 * Map intelligence score to risk level label
 */
function getScoreLabel(score) {
    if (score >= 80) return { label: 'Safe to Import', riskLevel: 'Low', icon: '🟢', color: '#22c55e' };
    if (score >= 60) return { label: 'Moderate Risk', riskLevel: 'Medium', icon: '🟡', color: '#f59e0b' };
    if (score >= 35) return { label: 'High Risk', riskLevel: 'High', icon: '🔴', color: '#ef4444' };
    if (score > 0) return { label: 'Very High Risk', riskLevel: 'High', icon: '🔴', color: '#dc2626' };
    return { label: 'Do Not Import', riskLevel: 'High', icon: '🚫', color: '#7f1d1d' };
}

/**
 * Risk Agent — assesses import risk with composite intelligence score
 * @param {string} category
 * @param {number} priceINR
 * @param {string} country
 * @param {object} complianceData - result from ComplianceAgent { complianceLevel, ... }
 */
async function riskAgent(category, priceINR, country, complianceData = null) {
    console.log(`[RiskAgent] 🎯 Assessing import risk: ${category} | ₹${priceINR} | From: ${country}`);

    const complianceLevel = complianceData?.complianceLevel || 'SAFE';
    const countryData = COUNTRY_RISK[country] || { score: 65, flag: '🌍', label: 'Moderate Risk', reason: 'Standard customs processing for this origin' };
    const categoryData = CATEGORY_RISK[category] || CATEGORY_RISK['Other'];
    const delivery = estimateDeliveryDays(country);

    // ── Import Intelligence Score ──
    const { total: intelligenceScore, breakdown: scoreBreakdown } = calculateImportIntelligenceScore(
        complianceLevel, country, category, priceINR
    );
    const scoreInfo = getScoreLabel(intelligenceScore);

    // ── Risk Factors ──
    const riskFactors = [];
    if (priceINR > 5000) riskFactors.push('Value exceeds gift exemption limit (₹5,000)');
    if (['Supplements', 'Health'].includes(category)) riskFactors.push('May require FSSAI/CDSCO approval for import');
    if (country === 'China') riskFactors.push('Chinese imports face enhanced DGFT/Customs scrutiny');
    if (country === 'Pakistan') riskFactors.push('Trade severely restricted — special government clearance required');
    if (complianceLevel === 'RESTRICTED') riskFactors.push('Regulatory restriction detected — special certification required');
    if (complianceLevel === 'MODERATE_RISK') riskFactors.push('Compliance warning — verify certifications before import');
    if (priceINR > 50000) riskFactors.push('High-value import — customs inspection almost certain');
    if (category === 'Electronics' && priceINR > 10000) riskFactors.push('BIS compliance check likely for high-value electronics');

    // ─ Build risk explanation ──
    let explanation = '';
    if (complianceLevel === 'PROHIBITED') {
        explanation = 'This product is prohibited from import. Do not attempt to import.';
    } else if (complianceLevel === 'RESTRICTED') {
        explanation = `This product requires special authorization for import into India. ${countryData.reason}`;
    } else {
        explanation = `${categoryData.reason}. ${countryData.reason}.`;
    }

    // ── Marketplace reliability ──
    const marketplaceReliability = {
        'Amazon': { score: 90, label: 'Very Reliable' },
        'eBay': { score: 70, label: 'Moderate' },
        'Aliexpress': { score: 55, label: 'Verify Seller' },
        'Unknown': { score: 50, label: 'Verify Source' },
    };

    console.log(`[RiskAgent] ✓ Intelligence Score: ${intelligenceScore}/100 | Risk: ${scoreInfo.riskLevel} | Compliance: ${complianceLevel}`);

    return {
        agent: 'RiskAgent',
        success: true,
        data: {
            // Core fields (preserved for orchestrator compatibility)
            riskLevel: scoreInfo.riskLevel,
            riskIcon: scoreInfo.icon,
            explanation: explanation,
            riskFactors: riskFactors,
            estimatedDelivery: delivery,
            deliveryText: `${delivery.min}–${delivery.max} days`,
            customsInspectionChance: categoryData.inspectionRate,

            // New composite intelligence score
            importIntelligenceScore: intelligenceScore,
            scoreBreakdown: {
                complianceScore: scoreBreakdown.complianceScore,
                countryOriginScore: scoreBreakdown.countryScore,
                categoryRiskScore: scoreBreakdown.categoryScore,
                priceRiskScore: scoreBreakdown.priceScore,
            },
            scoreLabel: scoreInfo.label,
            scoreColor: scoreInfo.color,

            // Country intelligence
            countryProfile: {
                country: country,
                flag: countryData.flag || '🌍',
                riskLabel: countryData.label || 'Moderate',
                reason: countryData.reason || 'Standard trade route',
            },

            // Category intelligence
            categoryProfile: {
                category: category,
                inspectionRate: categoryData.inspectionRate,
                reason: categoryData.reason,
            },

            // Used compliance data
            complianceLevel: complianceLevel,
        },
    };
}

module.exports = riskAgent;
