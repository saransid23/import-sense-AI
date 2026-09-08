// ============================================
// ORCHESTRATOR (UPGRADED)
// 8-Agent Pipeline with Live Regulatory Intelligence:
// Product → Currency → Compliance → Duty → Risk → Price → Recommendation
// ============================================

const productAgent = require('./agents/productAgent');
const currencyAgent = require('./agents/currencyAgent');
const complianceAgent = require('./agents/complianceAgent');
const dutyAgent = require('./agents/dutyAgent');
const priceComparisonAgent = require('./agents/priceComparisonAgent');
const riskAgent = require('./agents/riskAgent');
const recommendationAgent = require('./agents/recommendationAgent');

/**
 * Orchestrates the full 7-agent live regulatory intelligence pipeline
 * Pipeline order (corrected):
 * 1. Product Agent     — Extract product info
 * 2. Currency Agent    — Convert to INR
 * 3. Compliance Agent  — Live DGFT/CBIC regulatory check (runs early to inform risk)
 * 4. Duty Agent        — Live CBIC tariff + HS Code calculation
 * 5. Risk Agent        — Composite Import Intelligence Score (needs compliance result)
 * 6. Price Comparison  — Search Indian marketplaces
 * 7. Recommendation    — Final advice with all data
 *
 * @param {string} url - Product URL
 * @param {object} overrides - Optional user overrides { price, currency, category, name }
 */
async function orchestrate(url, overrides = {}) {
    const pipeline = [];
    const startTime = Date.now();
    const agentStatus = [];

    console.log('\n========================================');
    console.log('[Orchestrator] Starting 7-Agent Live Intelligence Pipeline');
    console.log(`[Orchestrator] URL: ${url}`);
    if (Object.keys(overrides).length > 0) console.log(`[Orchestrator] Overrides:`, overrides);
    console.log('========================================\n');

    const trackAgent = (name, success, extra = '') => {
        agentStatus.push({ agent: name, success, extra, timestamp: new Date().toISOString() });
    };

    // ── AGENT 1: Product Agent ──
    console.log('[Orchestrator] → Agent 1: ProductAgent');
    const productResult = await productAgent(url);
    pipeline.push(productResult);
    trackAgent('ProductAgent', productResult.success);
    if (!productResult.success) {
        return { success: false, error: 'Product extraction failed', pipeline };
    }

    let { name, price, currency, category, country, marketplace, imageUrl, identity } = productResult.data;
    if (overrides.price) price = parseFloat(overrides.price);
    if (overrides.currency) currency = overrides.currency;
    if (overrides.category) category = overrides.category;
    if (overrides.name) { name = overrides.name; if (identity) identity.fullIdentity = overrides.name; }

    // Need price to continue
    if (!price || price <= 0) {
        const elapsed = Date.now() - startTime;
        return {
            success: false,
            needsManualInput: true,
            error: 'Could not extract price from this product page. Please provide the price manually.',
            partialData: { name, category, country, marketplace, currency, identity },
            analysisTime: `${elapsed}ms`,
            agentPipeline: pipeline.map(r => ({ agent: r.agent, success: r.success })),
        };
    }

    // ── AGENT 2: Currency Agent ──
    console.log('[Orchestrator] → Agent 2: CurrencyAgent');
    const currencyResult = await currencyAgent(price, currency);
    pipeline.push(currencyResult);
    trackAgent('CurrencyAgent', currencyResult.success);
    if (!currencyResult.success) {
        return { success: false, error: 'Currency conversion failed', pipeline };
    }
    const { priceInINR, exchangeRate } = currencyResult.data;

    // ── AGENT 3: Compliance Agent (LIVE REGULATORY INTELLIGENCE) ──
    console.log('[Orchestrator] → Agent 3: ComplianceAgent (Live DGFT + CBIC)');
    const complianceResult = await complianceAgent(name, category, identity?.fullIdentity || '');
    pipeline.push(complianceResult);
    trackAgent('ComplianceAgent', complianceResult.success, `Level: ${complianceResult.data?.complianceLevel}`);
    const complianceData = complianceResult.data;

    // ── AGENT 4: Duty Agent (LIVE CBIC TARIFF) ──
    console.log('[Orchestrator] → Agent 4: DutyAgent (Live CBIC Tariff + HS Code)');
    const dutyResult = await dutyAgent(priceInINR, category, name);
    pipeline.push(dutyResult);
    trackAgent('DutyAgent', dutyResult.success, `HS: ${dutyResult.data?.HS_code}`);
    const { totalLandedCost, customsDuty, shippingCost, igst } = dutyResult.data;

    // ── AGENT 5: Risk Agent (COMPOSITE INTELLIGENCE SCORE) ──
    console.log('[Orchestrator] → Agent 5: RiskAgent (Composite Score + Country Profile)');
    const riskResult = await riskAgent(category, priceInINR, country, complianceData);
    pipeline.push(riskResult);
    trackAgent('RiskAgent', riskResult.success, `Score: ${riskResult.data?.importIntelligenceScore}/100`);
    const { riskLevel, estimatedDelivery, importIntelligenceScore } = riskResult.data;

    // ── AGENT 6: Price Comparison Agent ──
    console.log('[Orchestrator] → Agent 6: PriceComparisonAgent');
    const priceResult = await priceComparisonAgent(name, category, priceInINR, identity || {});
    pipeline.push(priceResult);
    trackAgent('PriceComparisonAgent', priceResult.success);
    const { bestLocalPrice, amazonIndia, flipkart, matchQuality, noExactMatchMessage } = priceResult.data;

    // ── AGENT 7: Recommendation Agent ──
    console.log('[Orchestrator] → Agent 7: RecommendationAgent');
    const recResult = await recommendationAgent(
        totalLandedCost,
        bestLocalPrice,
        amazonIndia.available ? amazonIndia.price : null,
        flipkart.available ? flipkart.price : null,
        riskLevel,
        estimatedDelivery,
        name,
        complianceData
    );
    pipeline.push(recResult);
    trackAgent('RecommendationAgent', recResult.success);

    // ── QUALITY CONTROL ──
    const qualityChecks = {
        productIdentityComplete: identity ? identity.identityConfidence !== 'low' : false,
        currencyConversionValid: currencyResult.success && priceInINR > 0,
        costCalculationValid: totalLandedCost > priceInINR,
        marketplaceMatchQuality: matchQuality,
        complianceStatus: complianceData.complianceLevel,
        complianceLiveData: complianceData.data_source,
        dutyDataSource: dutyResult.data.data_source,
        hsCode: dutyResult.data.HS_code,
        importIntelligenceScore: importIntelligenceScore,
        allAgentsSuccessful: pipeline.every(r => r.success),
        overallQuality: 'pass',
    };
    if (!qualityChecks.allAgentsSuccessful) qualityChecks.overallQuality = 'fail';
    else if (matchQuality === 'no_match' || !qualityChecks.productIdentityComplete) qualityChecks.overallQuality = 'warning';

    const elapsed = Date.now() - startTime;
    console.log(`\n[Orchestrator] ✓ Pipeline complete in ${elapsed}ms`);
    console.log(`[Orchestrator]   Compliance: ${complianceData.complianceLevel} | Source: ${complianceData.data_source}`);
    console.log(`[Orchestrator]   Duty: HS ${dutyResult.data.HS_code} | BCD: ${dutyResult.data.basic_customs_duty} | Source: ${dutyResult.data.data_source}`);
    console.log(`[Orchestrator]   Intelligence Score: ${importIntelligenceScore}/100 | QC: ${qualityChecks.overallQuality}\n`);

    return {
        success: true,
        analysisTime: `${elapsed}ms`,
        product: {
            name, originalPrice: price, originalCurrency: currency,
            priceInINR, exchangeRate, category, country,
            marketplace, imageUrl, url,
            identity: identity || null,
        },
        importCosts: {
            basePrice: priceInINR,
            shipping: shippingCost,
            customsDuty,
            igst,
            totalLandedCost,
            dutyRate: dutyResult.data.dutyRatePercent,
            igstRate: dutyResult.data.igstRatePercent,
            breakdown: dutyResult.data.breakdown,
            // New live duty fields
            HS_code: dutyResult.data.HS_code,
            hsDescription: dutyResult.data.hsDescription,
            basic_customs_duty: dutyResult.data.basic_customs_duty,
            social_welfare_surcharge: dutyResult.data.social_welfare_surcharge,
            swsAmount: dutyResult.data.swsAmount,
            assessableValue: dutyResult.data.assessableValue,
            dutyDataSource: dutyResult.data.data_source,
            cbicLiveFetched: dutyResult.data.cbicLiveFetched,
        },
        localPrices: {
            amazonIndia, flipkart,
            averagePrice: priceResult.data.averageIndianPrice,
            bestPrice: bestLocalPrice,
            matchQuality, noExactMatchMessage,
        },
        risk: riskResult.data,
        compliance: complianceData,
        recommendation: recResult.data,
        qualityControl: qualityChecks,
        agentPipeline: pipeline.map(r => ({ agent: r.agent, success: r.success })),
        agentStatus,
    };
}

module.exports = orchestrate;
