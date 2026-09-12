import { useState } from 'react';
import IntelligenceScore from './IntelligenceScore';
import CostBreakdownChart from './CostBreakdownChart';
import PriceComparisonChart from './PriceComparisonChart';
import EmeraldChat from './EmeraldChat';

function formatINR(value) {
    if (value == null) return 'N/A';
    return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function MatchBadge({ score, status }) {
    let bg, color, label;
    if (status === 'exact_match') { bg = 'rgba(16,185,129,0.25)'; color = '#a7f3d0'; label = `${score}% Exact`; }
    else if (status === 'simulated_match') { bg = 'rgba(6,182,212,0.25)'; color = '#a5f3fc'; label = `${score}% Simulated`; }
    else if (status === 'approximate') { bg = 'rgba(245,158,11,0.25)'; color = '#fef08a'; label = `${score}% Approx`; }
    else { bg = 'rgba(239,68,68,0.25)'; color = '#fecaca'; label = 'No match'; }
    return (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
    );
}

/** Live Data Source Badge */
function DataSourceBadge({ source }) {
    if (!source) return null;
    const isLive = source.toLowerCase().includes('live');
    const isCached = source.toLowerCase().includes('cached');

    let bg, color, borderColor, dotClass;
    if (isLive) {
        bg = 'rgba(16, 185, 129, 0.2)';
        color = '#a7f3d0';
        borderColor = 'rgba(16, 185, 129, 0.4)';
        dotClass = 'bg-emerald-400 animate-pulse';
    } else if (isCached) {
        bg = 'rgba(6, 182, 212, 0.2)';
        color = '#a5f3fc';
        borderColor = 'rgba(6, 182, 212, 0.4)';
        dotClass = 'bg-cyan-400';
    } else {
        bg = 'rgba(245, 158, 11, 0.2)';
        color = '#fef08a';
        borderColor = 'rgba(245, 158, 11, 0.4)';
        dotClass = 'bg-amber-400';
    }

    return (
        <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-white/80 font-semibold">Tariff Data Source</span>
            <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-right"
                style={{ background: bg, color, border: `1px solid ${borderColor}` }}
            >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                <span>{source}</span>
            </span>
        </div>
    );
}

/** Import Intelligence Score Ring for Risk panel */
function IntelligenceRing({ score, label, color }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                        cx="40" cy="40" r={radius}
                        fill="none"
                        stroke={color || '#10b981'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 6px ${color || '#10b981'})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{score}</span>
                </div>
            </div>
            <p className="text-xs text-center text-white font-semibold max-w-[90px] leading-tight">{label}</p>
        </div>
    );
}

export default function ResultsDashboard({ data, onReset }) {
    const { product, importCosts, localPrices, risk, compliance, recommendation, qualityControl } = data;
    const recData = recommendation;
    const scoreData = recData.importIntelligenceScore;
    const identity = product.identity;
    const isProhibited = compliance?.isProhibited || compliance?.isRestricted;
    const isImportBetter = !isProhibited && recData.recommendation.toLowerCase().includes('import the');

    return (
        <div className="min-h-screen px-2.5 sm:px-4 py-4 sm:py-6 max-w-6xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 animate-fade-in flex-wrap">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-lg sm:text-xl font-extrabold text-white tracking-wide">ImportSense AI</span>
                    <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                        style={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.4)' }}>
                        Live Intelligence
                    </span>
                </div>
                <button id="new-analysis-btn" onClick={onReset}
                    className="glass-card px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white hover:text-emerald-300 hover:border-emerald-400/50 transition-all cursor-pointer">
                    New Analysis
                </button>
            </div>

            {/* Recommendation Banner */}
            <div className={`glass-card p-4 sm:p-6 mb-6 animate-fade-in w-full`}
                style={{
                    background: isImportBetter
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.35) 100%)'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(153, 27, 27, 0.4) 100%)',
                    borderColor: isImportBetter ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                    boxShadow: isImportBetter
                        ? '0 0 25px rgba(16, 185, 129, 0.15)'
                        : '0 0 25px rgba(239, 68, 68, 0.2)'
                }}>
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <h2 className="text-xl sm:text-2xl font-black text-white break-words">{recData.recommendation}</h2>
                        </div>
                        <p className="text-white text-sm sm:text-base leading-relaxed font-medium">{recData.reason}</p>
                        <div className="mt-3 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black max-w-full break-words"
                            style={{
                                background: isImportBetter ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                                color: isImportBetter ? '#a7f3d0' : '#fecaca',
                                border: `1px solid ${isImportBetter ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                                textShadow: `0 0 10px ${isImportBetter ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                            }}>
                            {recData.savingsText}
                        </div>
                    </div>
                    <IntelligenceScore score={scoreData.score} label={scoreData.label} color={scoreData.color} />
                </div>
            </div>

            {/* Product Identity Card */}
            <div className="glass-card p-6 mb-6 animate-fade-in animate-delay-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest">Product Identified</h3>
                    {identity && (
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full`} style={{
                            background: identity.identityConfidence === 'high' ? 'rgba(16,185,129,0.2)' : identity.identityConfidence === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                            color: identity.identityConfidence === 'high' ? '#a7f3d0' : identity.identityConfidence === 'medium' ? '#fef08a' : '#fecaca',
                            border: `1px solid ${identity.identityConfidence === 'high' ? 'rgba(16,185,129,0.4)' : identity.identityConfidence === 'medium' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`
                        }}>
                            {identity.identityConfidence === 'high' ? 'High' : identity.identityConfidence === 'medium' ? 'Medium' : 'Low'} Confidence
                        </span>
                    )}
                </div>

                <h4 className="text-2xl font-black text-white mb-4">{product.name}</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {identity?.brand && <InfoBadge label="Brand" value={identity.brand} />}
                    {identity?.model && <InfoBadge label="Model" value={identity.model} />}
                    {identity?.storage && <InfoBadge label="Storage" value={identity.storage} />}
                    {identity?.color && <InfoBadge label="Color" value={identity.color} />}
                    {identity?.variant && <InfoBadge label="Variant" value={identity.variant} />}
                    {identity?.sku && <InfoBadge label="SKU" value={identity.sku} />}
                    <InfoBadge label="Category" value={product.category} />
                    <InfoBadge label="Origin" value={`${product.country} · ${product.marketplace}`} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-white/15">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-0.5">Original Price</p>
                            <p className="text-xl font-black text-white">{product.originalCurrency} {product.originalPrice}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-0.5">Converted to INR</p>
                            <p className="text-xl font-black text-emerald-300" style={{ textShadow: '0 0 10px rgba(16,185,129,0.4)' }}>{formatINR(product.priceInINR)}</p>
                        </div>
                    </div>
                    <div className="text-sm font-semibold text-white mt-3 sm:mt-0">
                        Exchange Rate: <span className="text-emerald-300 font-bold">1 {product.originalCurrency} = ₹{product.exchangeRate}</span>
                    </div>
                </div>
            </div>

            {/* No exact match warning */}
            {localPrices.noExactMatchMessage && (
                <div className="glass-card px-5 py-3 mb-6 animate-fade-in animate-delay-1"
                    style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    <p className="text-sm text-amber-200 font-bold">
                        Notice: {localPrices.noExactMatchMessage}
                    </p>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Cost Breakdown */}
                <div className="glass-card p-6 animate-fade-in animate-delay-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest">Import Cost Breakdown</h3>
                        {importCosts.HS_code && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full"
                                style={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.35)' }}>
                                HS Code: {importCosts.HS_code}
                            </span>
                        )}
                    </div>
                    <div className="mb-4">
                        <CostBreakdownChart breakdown={importCosts.breakdown} />
                    </div>
                    <TariffBreakdownTable importCosts={importCosts} />
                </div>

                {/* Price Comparison */}
                <div className="glass-card p-6 animate-fade-in animate-delay-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest">Price Comparison</h3>
                        {localPrices.matchQuality && (
                            <span className={`text-xs font-extrabold px-3 py-1 rounded-full`} style={{
                                background: localPrices.matchQuality === 'exact' ? 'rgba(16,185,129,0.2)' : localPrices.matchQuality === 'approximate' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                                color: localPrices.matchQuality === 'exact' ? '#a7f3d0' : localPrices.matchQuality === 'approximate' ? '#fef08a' : '#fecaca',
                                border: `1px solid ${localPrices.matchQuality === 'exact' ? 'rgba(16,185,129,0.35)' : localPrices.matchQuality === 'approximate' ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`
                            }}>
                                {localPrices.matchQuality === 'exact' ? 'Exact Match' : localPrices.matchQuality === 'approximate' ? 'Approximate' : 'No Match'}
                            </span>
                        )}
                    </div>
                    <PriceComparisonChart
                        importCost={importCosts.totalLandedCost}
                        amazonPrice={localPrices.amazonIndia.available ? localPrices.amazonIndia.price : null}
                        flipkartPrice={localPrices.flipkart.available ? localPrices.flipkart.price : null}
                    />
                    <div className="mt-4 pt-4 border-t border-white/15 space-y-2.5">
                        <PriceRow label="Import (Total Landed)" price={importCosts.totalLandedCost} color="text-rose-300" />
                        <PriceRow
                            label="Amazon India"
                            price={localPrices.amazonIndia.available ? localPrices.amazonIndia.price : null}
                            color="text-amber-300"
                            url={localPrices.amazonIndia.url}
                            matchInfo={localPrices.amazonIndia}
                        />
                        <PriceRow
                            label="Flipkart"
                            price={localPrices.flipkart.available ? localPrices.flipkart.price : null}
                            color="text-cyan-300"
                            url={localPrices.flipkart.url}
                            matchInfo={localPrices.flipkart}
                        />
                    </div>
                    {(localPrices.amazonIndia.title || localPrices.flipkart.title) && (
                        <div className="mt-4 pt-3 border-t border-white/15 space-y-2">
                            <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Matched Products</p>
                            {localPrices.amazonIndia.title && (
                                <div className="flex items-start gap-2 text-xs text-white">
                                    <div>
                                        <span className="font-medium text-white">{localPrices.amazonIndia.title}</span>
                                        {localPrices.amazonIndia.matchScore != null && (
                                            <MatchBadge score={localPrices.amazonIndia.matchScore} status={localPrices.amazonIndia.matchStatus} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {localPrices.flipkart.title && (
                                <div className="flex items-start gap-2 text-xs text-white">
                                    <div>
                                        <span className="font-medium text-white">{localPrices.flipkart.title}</span>
                                        {localPrices.flipkart.matchScore != null && (
                                            <MatchBadge score={localPrices.flipkart.matchScore} status={localPrices.flipkart.matchStatus} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Import Compliance Panel */}
            {compliance && <CompliancePanel compliance={compliance} productName={product.name} />}

            {/* Risk & Agent Pipeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Risk Assessment + Intelligence Score */}
                <div className="glass-card p-6 animate-fade-in animate-delay-4">
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest mb-4">Import Intelligence Assessment</h3>

                    {/* Composite Score + Risk Level */}
                    <div className="flex items-center gap-5 mb-4">
                        {risk.importIntelligenceScore != null && (
                            <IntelligenceRing
                                score={risk.importIntelligenceScore}
                                label={risk.scoreLabel || 'Intelligence Score'}
                                color={risk.scoreColor || '#10b981'}
                            />
                        )}
                        <div>
                            <div className={`px-4 py-1.5 mb-2 rounded-xl text-sm font-extrabold inline-block risk-${risk.riskLevel.toLowerCase()}`}>
                                {risk.riskLevel} Risk
                            </div>
                            <div className="text-xs text-white font-medium">
                                Customs inspection: <span className="text-emerald-300 font-bold">{risk.customsInspectionChance}</span>
                            </div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    {risk.scoreBreakdown && (
                        <div className="mb-4 p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <p className="text-xs font-bold text-white uppercase mb-2 tracking-wider">Score Breakdown (Click to expand)</p>
                            <ScoreBar label="Compliance" score={risk.scoreBreakdown.complianceScore} reason={risk.scoreBreakdown.complianceReason} delayClass="animate-fade-in animate-delay-1" />
                            <ScoreBar label="Country Origin" score={risk.scoreBreakdown.countryOriginScore} reason={risk.scoreBreakdown.countryOriginReason || risk.countryProfile?.reason} delayClass="animate-fade-in animate-delay-2" />
                            <ScoreBar label="Product Category" score={risk.scoreBreakdown.categoryRiskScore} reason={risk.scoreBreakdown.categoryReason || risk.categoryProfile?.reason} delayClass="animate-fade-in animate-delay-3" />
                            <ScoreBar label="Price Risk" score={risk.scoreBreakdown.priceRiskScore} reason={risk.scoreBreakdown.priceReason} delayClass="animate-fade-in animate-delay-4" />
                        </div>
                    )}

                    <p className="text-sm text-white mb-3 leading-relaxed font-medium">{risk.explanation}</p>

                    {/* Country profile */}
                    {risk.countryProfile && (
                        <div className="mb-3 px-3 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold">{risk.countryProfile.country}</span>
                                <span className="text-white/60">·</span>
                                <span className="text-emerald-300 text-xs font-bold">{risk.countryProfile.riskLabel}</span>
                            </div>
                            <p className="text-xs text-white/90 mt-1 font-medium">{risk.countryProfile.reason}</p>
                        </div>
                    )}

                    {risk.riskFactors.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-white uppercase tracking-wider">Risk Factors</p>
                            {risk.riskFactors.map((factor, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-white font-medium">
                                    <span className="text-amber-300 font-bold">•</span> {factor}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-white/15">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white font-semibold">Estimated Delivery:</span>
                            <span className="text-emerald-300 font-bold">{risk.deliveryText}</span>
                        </div>
                    </div>
                </div>

                {/* Agent Pipeline + Quality Control */}
                <div className="glass-card p-6 animate-fade-in animate-delay-5">
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest mb-4">Agent Pipeline</h3>
                    <div className="space-y-2.5">
                        {data.agentPipeline.map((agent, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span className="font-bold text-white">{agent.agent}</span>
                                <span className="flex-1 border-b border-dashed border-white/20"></span>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.35)' }}>
                                    Success
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Live Sources */}
                    <div className="mt-4 pt-4 border-t border-white/15">
                        <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Live Regulatory Sources</p>
                        <div className="space-y-2">
                            <LiveSourceRow
                                label="DGFT Portal"
                                connected={compliance?.liveIntelligence?.dgftConnected}
                                url="https://www.dgft.gov.in"
                            />
                            <LiveSourceRow
                                label="CBIC Compliance"
                                connected={compliance?.liveIntelligence?.cbicConnected}
                                url="https://www.cbic.gov.in"
                            />
                            <LiveSourceRow
                                label="CBIC Tariff"
                                connected={importCosts?.cbicLiveFetched}
                                url="https://www.icegate.gov.in"
                            />
                        </div>
                    </div>

                    {qualityControl && (
                        <div className="mt-4 pt-4 border-t border-white/15">
                            <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Quality Control</p>
                            <div className="space-y-1.5 text-xs">
                                <QCRow label="Product Identity" pass={qualityControl.productIdentityComplete} />
                                <QCRow label="Currency Conversion" pass={qualityControl.currencyConversionValid} />
                                <QCRow label="Cost Calculation" pass={qualityControl.costCalculationValid} />
                                <QCRow label="Marketplace Match" pass={qualityControl.marketplaceMatchQuality !== 'no_match'} detail={qualityControl.marketplaceMatchQuality} />
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Total analysis time</span>
                        <span className="text-sm font-black text-emerald-300" style={{ textShadow: '0 0 10px rgba(16,185,129,0.4)' }}>{data.analysisTime}</span>
                    </div>
                </div>
            </div>

            {/* Emerald AI Assistant */}
            <EmeraldChat data={data} />

            {/* Footer */}
            <footer className="text-center text-xs font-semibold text-white/90 py-8">
                <p>ImportSense AI — Live Regulatory Intelligence | DGFT · CBIC · ICEGATE</p>
            </footer>
        </div>
    );
}

/* ─── Helper Components ──────────────────────────────────────── */
function InfoBadge({ label, value, highlight }) {
    return (
        <div className="px-2.5 sm:px-3 py-2 rounded-lg min-w-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[10px] sm:text-xs text-emerald-200 font-semibold mb-0.5">{label}</p>
            <p className={`text-xs sm:text-sm font-extrabold truncate ${highlight ? 'text-emerald-300' : 'text-white'}`} title={value}>{value}</p>
        </div>
    );
}

function TariffBreakdownTable({ importCosts }) {
    if (!importCosts) return null;

    const total = importCosts.totalLandedCost || 1;
    const basePct = Math.round(((importCosts.basePrice || 0) / total) * 100);
    const shippingPct = Math.round(((importCosts.shipping || 0) / total) * 100);
    const bcdPct = Math.round(((importCosts.customsDuty || 0) / total) * 100);
    const swsPct = Math.round(((importCosts.swsAmount || 0) / total) * 100);
    const igstPct = Math.round(((importCosts.igst || 0) / total) * 100);

    const isLive = importCosts.dutyDataSource?.toLowerCase().includes('live');
    const isCached = importCosts.dutyDataSource?.toLowerCase().includes('cached');

    const sourceBg = isLive ? 'rgba(16, 185, 129, 0.2)' : isCached ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)';
    const sourceColor = isLive ? '#a7f3d0' : isCached ? '#a5f3fc' : '#fef08a';
    const sourceBorder = isLive ? 'rgba(16, 185, 129, 0.4)' : isCached ? 'rgba(6, 182, 212, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    const dotClass = isLive ? 'bg-emerald-400 animate-pulse' : isCached ? 'bg-cyan-400' : 'bg-amber-400';

    return (
        <div className="space-y-4">
            {/* Top context strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300">HS Classification:</span>
                    <span className="text-xs text-white font-medium">{importCosts.hsDescription || `Chapter ${importCosts.HS_code?.substring(0, 2)}`}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: sourceBg, color: sourceColor, border: `1px solid ${sourceBorder}` }}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                    <span>{importCosts.dutyDataSource || 'CBIC Tariff'}</span>
                </div>
            </div>

            {/* Custom Glass Table */}
            <div className="overflow-x-auto rounded-xl border border-white/15" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-white/15 text-emerald-300 font-extrabold uppercase tracking-wider"
                            style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <th className="py-2.5 px-3">Cost Component</th>
                            <th className="py-2.5 px-3">Rate / Basis</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-right">Share</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-white font-medium">
                        <tr className="hover:bg-white/[0.05] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-white">Product Price (FOB)</td>
                            <td className="py-2.5 px-3 text-white/70">Base item price</td>
                            <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(importCosts.basePrice)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-white/80">{basePct}%</td>
                        </tr>
                        <tr className="hover:bg-white/[0.05] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-white">Shipping & Freight</td>
                            <td className="py-2.5 px-3 text-amber-300/90 font-medium">CIF 10% rate</td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-300">{formatINR(importCosts.shipping)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-amber-300/80">{shippingPct}%</td>
                        </tr>
                        <tr className="bg-white/[0.03] hover:bg-white/[0.07] transition-colors font-semibold">
                            <td className="py-2.5 px-3 text-emerald-200">Assessable Value (AV)</td>
                            <td className="py-2.5 px-3 text-emerald-200/80">Price + Shipping</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-emerald-200">{formatINR(importCosts.assessableValue || (importCosts.basePrice + importCosts.shipping))}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-200/80">Base AV</td>
                        </tr>
                        <tr className="hover:bg-white/[0.05] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-white">Basic Customs Duty (BCD)</td>
                            <td className="py-2.5 px-3 text-rose-300/90 font-medium">{importCosts.dutyRatePercent || importCosts.dutyRate}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-300">{formatINR(importCosts.customsDuty)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-rose-300/80">{bcdPct}%</td>
                        </tr>
                        {importCosts.swsAmount > 0 && (
                            <tr className="hover:bg-white/[0.05] transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-white">Social Welfare Surcharge (SWS)</td>
                                <td className="py-2.5 px-3 text-violet-300/90 font-medium">{importCosts.social_welfare_surcharge || '10% of BCD'}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-violet-300">{formatINR(importCosts.swsAmount)}</td>
                                <td className="py-2.5 px-3 text-right font-semibold text-violet-300/80">{swsPct}%</td>
                            </tr>
                        )}
                        <tr className="hover:bg-white/[0.05] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-white">Integrated GST (IGST)</td>
                            <td className="py-2.5 px-3 text-cyan-300/90 font-medium">{importCosts.igstRatePercent || importCosts.igstRate}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-cyan-300">{formatINR(importCosts.igst)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-cyan-300/80">{igstPct}%</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-emerald-400/50" style={{ background: 'rgba(16, 185, 129, 0.25)' }}>
                            <td className="py-3 px-3 text-sm font-black text-white" colSpan={2}>Total Landed Cost</td>
                            <td className="py-3 px-3 text-right text-lg font-black text-emerald-300" style={{ textShadow: '0 0 12px rgba(16,185,129,0.5)' }}>
                                {formatINR(importCosts.totalLandedCost)}
                            </td>
                            <td className="py-3 px-3 text-right text-xs font-black text-emerald-300">100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function PriceRow({ label, price, color, url, matchInfo }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-300 font-semibold transition-colors underline-offset-2 hover:underline">
                        {label}
                    </a>
                ) : (
                    <span className="text-white font-semibold">{label}</span>
                )}
                {matchInfo?.matchScore != null && matchInfo.matchScore > 0 && (
                    <MatchBadge score={matchInfo.matchScore} status={matchInfo.matchStatus} />
                )}
            </div>
            <span className={`font-black ${color}`}>
                {price != null ? formatINR(price) : 'Not found'}
            </span>
        </div>
    );
}

function QCRow({ label, pass, detail }) {
    return (
        <div className="flex items-center gap-2 text-white">
            <span className={pass ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{pass ? '✓' : '⚠'}</span>
            <span className="text-white font-medium">{label}</span>
            {detail && <span className="text-emerald-200 ml-auto font-semibold">{detail}</span>}
        </div>
    );
}

function ScoreBar({ label, score, reason, delayClass }) {
    const [expanded, setExpanded] = useState(false);
    const color = score >= 70 ? '#34d399' : score >= 45 ? '#fcd34d' : '#fca5a5';

    return (
        <div className={`space-y-1.5 transition-all ${delayClass || ''}`}>
            <div
                onClick={() => reason && setExpanded(!expanded)}
                className={`flex items-center gap-2 text-xs py-1 rounded-lg px-1.5 transition-colors ${reason ? 'cursor-pointer hover:bg-white/10' : ''}`}
            >
                <span className="text-white font-semibold w-20 sm:w-28 flex-shrink-0 flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="truncate">{label}</span>
                    {reason && <span className="text-[10px] text-white/50 ml-0.5">{expanded ? '▲' : '▼'}</span>}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}80` }} />
                </div>
                <span className="font-extrabold w-6 text-right text-white text-xs">{score}</span>
            </div>
            {reason && expanded && (
                <div className="text-[11px] text-white/90 font-medium ml-20 sm:ml-28 pr-2 py-1.5 px-2 bg-white/10 rounded-md border-l-2 border-emerald-400 animate-fade-in">
                    {reason}
                </div>
            )}
        </div>
    );
}

function LiveSourceRow({ label, connected, url }) {
    const isConnected = connected === true;
    const failed = connected === false;
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold">{label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 font-bold transition-colors ${isConnected ? 'text-emerald-300 hover:text-white' : failed ? 'text-amber-300 hover:text-white' : 'text-white/80'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : failed ? 'bg-amber-400' : 'bg-white/50'}`} />
                {isConnected ? 'Live Connected' : failed ? 'Rulebook Fallback' : 'Checking...'}
            </a>
        </div>
    );
}

function EvidenceSnippetRow({ source, text, score, agent }) {
    const [expanded, setExpanded] = useState(false);
    const scorePct = Math.round((score || 0) * 100);
    const isHigh = scorePct >= 80;
    const isMedium = scorePct >= 50 && scorePct < 80;

    const bg = isHigh ? 'rgba(16,185,129,0.2)' : isMedium ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.15)';
    const color = isHigh ? '#a7f3d0' : isMedium ? '#fef08a' : '#e2e8f0';

    const isLong = text && text.length > 120;
    const displayText = !expanded && isLong ? text.slice(0, 120) + '...' : text;

    return (
        <div className="p-2.5 rounded-lg text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white truncate max-w-[200px]" title={source}>{source || agent || 'Regulatory Source'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                    {scorePct > 0 ? `${scorePct}% Match` : 'Rulebook Match'}
                </span>
            </div>
            <p className="text-white/90 leading-relaxed font-medium">
                "{displayText}"
                {isLong && (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="ml-1 text-emerald-300 font-bold hover:underline cursor-pointer"
                    >
                        {expanded ? 'show less' : 'show more'}
                    </button>
                )}
            </p>
        </div>
    );
}

function FeedbackWidget({ productName, complianceLevel }) {
    const [submitted, setSubmitted] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const submitFeedback = async (outcome, customNotes = '') => {
        setLoading(true);
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'import_compliance',
                    product_name: productName || 'Unknown Product',
                    predicted_level: complianceLevel || 'SAFE',
                    outcome: outcome,
                    notes: customNotes,
                }),
            });
        } catch (err) {
            console.error('[Feedback] Call failed:', err);
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    };

    const handleVote = (outcome) => {
        if (outcome === 'flagged') {
            setShowNotes(true);
        } else {
            submitFeedback(outcome, '');
        }
    };

    const handleNotesSubmit = (e) => {
        e.preventDefault();
        submitFeedback('flagged', notes);
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-bold text-white">Was this compliance check accurate?</span>

                {submitted ? (
                    <span className="text-xs font-bold text-emerald-300 animate-fade-in flex items-center gap-1">
                        ✓ Thanks — this helps ImportSense learn
                    </span>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleVote('approved')}
                            className="px-3 py-1 text-xs font-bold rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                            👍 Accurate
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleVote('flagged')}
                            className="px-3 py-1 text-xs font-bold rounded-lg border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                            👎 Flag Issue
                        </button>
                    </div>
                )}
            </div>

            {showNotes && !submitted && (
                <form onSubmit={handleNotesSubmit} className="mt-3 p-3 rounded-xl space-y-2 animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-xs text-white/80 font-medium">Optional: What was inaccurate or missing?</p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes (e.g. BIS certification is not required for this item...)"
                        rows={2}
                        className="w-full text-xs p-2 rounded-lg bg-black/40 text-white border border-white/15 focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => submitFeedback('flagged', '')}
                            className="px-3 py-1 text-xs text-white/60 font-semibold hover:text-white"
                        >
                            Skip & Submit
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-gradient px-3 py-1 text-xs"
                        >
                            Submit Feedback
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

/* ─── Compliance Panel ───────────────────────────────────────── */
function CompliancePanel({ compliance, productName }) {
    const { complianceLevel, status, violations, warnings, referenceLinks, liveIntelligence, matchedSources } = compliance;

    const levelStyles = {
        SAFE: { borderColor: 'rgba(16,185,129,0.4)', headerBg: 'rgba(16,185,129,0.1)', headerBorder: 'rgba(16,185,129,0.3)', accentColor: '#34d399', badgeBg: 'rgba(16,185,129,0.2)', badgeColor: '#a7f3d0' },
        MODERATE_RISK: { borderColor: 'rgba(245,158,11,0.4)', headerBg: 'rgba(245,158,11,0.1)', headerBorder: 'rgba(245,158,11,0.3)', accentColor: '#fcd34d', badgeBg: 'rgba(245,158,11,0.2)', badgeColor: '#fef08a' },
        RESTRICTED: { borderColor: 'rgba(249,115,22,0.4)', headerBg: 'rgba(249,115,22,0.1)', headerBorder: 'rgba(249,115,22,0.3)', accentColor: '#fb923c', badgeBg: 'rgba(249,115,22,0.2)', badgeColor: '#ffedd5' },
        PROHIBITED: { borderColor: 'rgba(239,68,68,0.4)', headerBg: 'rgba(239,68,68,0.1)', headerBorder: 'rgba(239,68,68,0.3)', accentColor: '#f87171', badgeBg: 'rgba(239,68,68,0.2)', badgeColor: '#fecaca' },
    };

    const style = levelStyles[complianceLevel] || levelStyles.SAFE;
    const allIssues = [...(violations || []), ...(warnings || [])];

    return (
        <div className="glass-card p-6 mb-6 animate-fade-in" style={{ borderColor: style.borderColor }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest">
                    Customs & Trade Compliance
                </h3>
                <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: style.badgeBg, color: style.badgeColor, border: `1px solid ${style.borderColor}` }}>
                    {complianceLevel}
                </span>
            </div>

            {/* Live Indicator */}
            {liveIntelligence && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 text-xs font-semibold text-white px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className={`flex items-center gap-1.5 ${liveIntelligence.dgftConnected ? 'text-emerald-300 font-bold' : 'text-white/80'}`}>
                        <span className={`w-2 h-2 rounded-full ${liveIntelligence.dgftConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        DGFT Live
                    </span>
                    <span className={`flex items-center gap-1.5 ${liveIntelligence.cbicConnected ? 'text-emerald-300 font-bold' : 'text-white/80'}`}>
                        <span className={`w-2 h-2 rounded-full ${liveIntelligence.cbicConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        CBIC Live
                    </span>
                    {liveIntelligence.liveMatchesFound > 0 && (
                        <span className="text-amber-300 font-bold">
                            {liveIntelligence.liveMatchesFound} live regulatory match(es)
                        </span>
                    )}
                    <span className="text-white/90 font-medium sm:ml-auto">
                        {liveIntelligence.productKeywordsAnalyzed?.length ?? 0} keywords analyzed
                    </span>
                </div>
            )}

            {/* Main status message */}
            <div className="flex items-start gap-4 mb-4 p-4 rounded-xl border-l-4"
                style={{ background: style.headerBg, borderColor: style.accentColor, borderTop: `1px solid ${style.headerBorder}`, borderRight: `1px solid ${style.headerBorder}`, borderBottom: `1px solid ${style.headerBorder}` }}>
                <div>
                    <p className="font-extrabold text-white text-base mb-1">{status.label}</p>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">{status.shortMsg}</p>
                </div>
            </div>

            {/* Violations / Warnings */}
            {allIssues.length > 0 ? (
                <div className="space-y-4">
                    {violations.length > 0 && (
                        <div>
                            <p className="text-xs font-black text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                                Compliance Violations ({violations.length})
                            </p>
                            <div className="space-y-3">
                                {violations.map((v, i) => (
                                    <ComplianceIssueCard key={i} issue={v} severity="high" />
                                ))}
                            </div>
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div>
                            <p className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                                Compliance Warnings ({warnings.length})
                            </p>
                            <div className="space-y-3">
                                {warnings.map((w, i) => (
                                    <ComplianceIssueCard key={i} issue={w} severity="medium" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-3 text-sm text-emerald-300 bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30">
                    <div>
                        <p className="font-extrabold text-white text-base">No import restrictions found</p>
                        <p className="text-white/90 text-xs font-semibold mt-0.5">This product appears to be freely importable into India.</p>
                    </div>
                </div>
            )}

            {/* Compliance recommendation */}
            {compliance.complianceRecommendation && (
                <div className="mt-4 pt-4 border-t border-white/15">
                    <p className="text-sm font-extrabold text-white mb-1">
                        AI Recommendation
                    </p>
                    <p className="text-sm text-white leading-relaxed font-medium">{compliance.complianceRecommendation}</p>
                </div>
            )}

            {/* Reference authorities */}
            <div className="mt-4 pt-4 border-t border-white/15">
                <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">Reference Authorities</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(referenceLinks || {}).map(([name, url]) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-emerald-300 hover:text-white transition-colors"
                            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)' }}>
                            {name}
                        </a>
                    ))}
                </div>
                <p className="text-xs text-white/90 font-medium mt-2.5">
                    Live data from DGFT ITC-HS Import Policy & CBIC Customs Tariff
                </p>
            </div>

            {/* Evidence Reviewed */}
            <div className="mt-4 pt-4 border-t border-white/15">
                <p className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">Evidence Reviewed</p>
                {matchedSources && matchedSources.length > 0 ? (
                    <div className="space-y-2">
                        {matchedSources.map((item, idx) => (
                            <EvidenceSnippetRow key={idx} source={item.source} text={item.text} score={item.similarity_score} agent={item.agent} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-white/70 italic font-medium">
                        No live source match — using cached compliance rules
                    </p>
                )}
            </div>

            {/* Feedback Widget */}
            <FeedbackWidget productName={productName} complianceLevel={complianceLevel} />
        </div>
    );
}

function ComplianceIssueCard({ issue, severity }) {
    const isHigh = severity === 'high';
    const borderColor = isHigh ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)';
    const bgColor = isHigh ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
    const badgeColor = isHigh ? { bg: 'rgba(239,68,68,0.3)', text: '#fecaca' } : { bg: 'rgba(245,158,11,0.3)', text: '#fef08a' };

    return (
        <div className="p-4 rounded-xl text-sm space-y-2"
            style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{issue.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ background: badgeColor.bg, color: badgeColor.text }}>
                    {issue.agency || (isHigh ? 'Violation' : 'Warning')}
                </span>
            </div>
            <p className="text-white leading-relaxed text-xs font-medium">{issue.description || issue.message}</p>
            {issue.actionRequired && (
                <div className="text-xs text-white font-semibold pt-1 border-t border-white/10 flex items-center gap-1">
                    <span className="text-amber-300 font-bold">Action:</span> {issue.actionRequired}
                </div>
            )}
            {issue.evidence && issue.evidence.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <p className="text-[10px] font-bold text-white/70 uppercase">Supporting Evidence</p>
                    {issue.evidence.map((item, idx) => (
                        <EvidenceSnippetRow key={idx} source={item.source} text={item.text} score={item.similarity_score} />
                    ))}
                </div>
            )}
        </div>
    );
}
