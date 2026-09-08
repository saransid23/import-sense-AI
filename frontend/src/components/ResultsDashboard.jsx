import IntelligenceScore from './IntelligenceScore';
import CostBreakdownChart from './CostBreakdownChart';
import PriceComparisonChart from './PriceComparisonChart';

function formatINR(value) {
    if (value == null) return 'N/A';
    return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function MatchBadge({ score, status }) {
    let bg, color, label;
    if (status === 'exact_match') { bg = 'rgba(22,163,74,0.1)'; color = '#16a34a'; label = `${score}% Exact`; }
    else if (status === 'simulated_match') { bg = 'rgba(8,145,178,0.1)'; color = '#67e8f9'; label = `${score}% Simulated`; }
    else if (status === 'approximate') { bg = 'rgba(234,88,12,0.1)'; color = '#ea580c'; label = `${score}% Approx`; }
    else { bg = 'rgba(220,38,38,0.1)'; color = '#dc2626'; label = 'No match'; }
    return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
    );
}

/** Live Data Source Badge */
function DataSourceBadge({ source }) {
    if (!source) return null;
    const isLive = source.toLowerCase().includes('live');
    const isCached = source.toLowerCase().includes('cached');
    const bg = isLive ? 'rgba(22,163,74,0.1)' : isCached ? 'rgba(37,99,235,0.1)' : 'rgba(156,163,175,0.15)';
    const color = isLive ? '#16a34a' : isCached ? '#2563eb' : '#9ca3af';
    const icon = isLive ? '🟢' : isCached ? '🔵' : '📚';
    return (
        <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
            style={{ background: bg, color, border: `1px solid ${color}33` }}>
            {icon} {source}
        </span>
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
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" />
                    <circle
                        cx="40" cy="40" r={radius}
                        fill="none"
                        stroke={color || '#6366f1'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-900">{score}</span>
                </div>
            </div>
            <p className="text-xs text-center text-slate-500 max-w-[80px] leading-tight">{label}</p>
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
        <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-fade-in">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <span className="text-xl font-bold gradient-text">ImportSense AI</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                        Live Intelligence
                    </span>
                </div>
                <button id="new-analysis-btn" onClick={onReset}
                    className="glass-card px-5 py-2 text-sm font-medium text-blue-600 hover:text-slate-900 transition-colors cursor-pointer">
                    ← New Analysis
                </button>
            </div>

            {/* Recommendation Banner */}
            <div className={`glass-card p-6 mb-6 animate-fade-in ${isImportBetter ? 'border-green-500/30' : 'border-orange-500/30'}`}
                style={{ background: isImportBetter ? 'rgba(34, 197, 94, 0.08)' : 'rgba(249, 115, 22, 0.08)' }}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{isImportBetter ? '✅' : '🏠'}</span>
                            <h2 className="text-2xl font-bold text-slate-900">{recData.recommendation}</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{recData.reason}</p>
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
                            style={{
                                background: isImportBetter ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                color: isImportBetter ? '#16a34a' : '#ea580c'
                            }}>
                            {isImportBetter ? '💰' : '🛡️'} {recData.savingsText}
                        </div>
                    </div>
                    <IntelligenceScore score={scoreData.score} label={scoreData.label} color={scoreData.color} />
                </div>
            </div>

            {/* Product Identity Card */}
            <div className="glass-card p-6 mb-6 animate-fade-in animate-delay-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">📦 Product Identified</h3>
                    {identity && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${identity.identityConfidence === 'high' ? 'text-green-600' : identity.identityConfidence === 'medium' ? 'text-orange-500' : 'text-red-600'
                            }`} style={{
                                background: identity.identityConfidence === 'high' ? 'rgba(22,163,74,0.1)' : identity.identityConfidence === 'medium' ? 'rgba(234,88,12,0.1)' : 'rgba(220,38,38,0.1)'
                            }}>
                            {identity.identityConfidence === 'high' ? '✓ High' : identity.identityConfidence === 'medium' ? '⚠ Medium' : '✗ Low'} Confidence
                        </span>
                    )}
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-4">{product.name}</h4>

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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex gap-6">
                        <div>
                            <p className="text-xs text-slate-400">Original Price</p>
                            <p className="text-lg font-bold text-slate-900">{product.originalCurrency} {product.originalPrice}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Converted to INR</p>
                            <p className="text-lg font-bold text-blue-600">{formatINR(product.priceInINR)}</p>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400 mt-2 sm:mt-0">
                        Exchange Rate: <span className="text-blue-600 font-semibold">1 {product.originalCurrency} = ₹{product.exchangeRate}</span>
                    </div>
                </div>
            </div>

            {/* No exact match warning */}
            {localPrices.noExactMatchMessage && (
                <div className="glass-card px-5 py-3 mb-6 animate-fade-in animate-delay-1"
                    style={{ background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                    <p className="text-sm text-orange-600 font-medium">
                        ⚠️ {localPrices.noExactMatchMessage}
                    </p>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Cost Breakdown */}
                <div className="glass-card p-6 animate-fade-in animate-delay-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">🧾 Import Cost Breakdown</h3>
                        {importCosts.HS_code && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                                HS: {importCosts.HS_code}
                            </span>
                        )}
                    </div>
                    <CostBreakdownChart breakdown={importCosts.breakdown} />
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Product Price</span>
                            <span className="text-slate-900">{formatINR(importCosts.basePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Shipping / CIF</span>
                            <span className="text-orange-600">{formatINR(importCosts.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Basic Customs Duty ({importCosts.dutyRate})</span>
                            <span className="text-pink-600">{formatINR(importCosts.customsDuty)}</span>
                        </div>
                        {importCosts.swsAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Social Welfare Surcharge ({importCosts.social_welfare_surcharge})</span>
                                <span className="text-purple-600">{formatINR(importCosts.swsAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">IGST ({importCosts.igstRate})</span>
                            <span className="text-cyan-600">{formatINR(importCosts.igst)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-slate-200">
                            <span className="text-slate-900">Total Landed Cost</span>
                            <span className="gradient-text text-lg">{formatINR(importCosts.totalLandedCost)}</span>
                        </div>
                        {importCosts.hsDescription && (
                            <p className="text-xs text-slate-400 mt-1">
                                HS Chapter: {importCosts.hsDescription}
                            </p>
                        )}
                    </div>
                    {/* Live data source */}
                    {importCosts.dutyDataSource && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <DataSourceBadge source={importCosts.dutyDataSource} />
                        </div>
                    )}
                </div>

                {/* Price Comparison */}
                <div className="glass-card p-6 animate-fade-in animate-delay-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">📊 Price Comparison</h3>
                        {localPrices.matchQuality && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${localPrices.matchQuality === 'exact' ? 'text-green-600' : localPrices.matchQuality === 'approximate' ? 'text-orange-600' : 'text-red-600'
                                }`} style={{
                                    background: localPrices.matchQuality === 'exact' ? 'rgba(22,163,74,0.1)' : localPrices.matchQuality === 'approximate' ? 'rgba(234,88,12,0.1)' : 'rgba(220,38,38,0.1)'
                                }}>
                                {localPrices.matchQuality === 'exact' ? '✓ Exact Match' : localPrices.matchQuality === 'approximate' ? '≈ Approximate' : '✗ No Match'}
                            </span>
                        )}
                    </div>
                    <PriceComparisonChart
                        importCost={importCosts.totalLandedCost}
                        amazonPrice={localPrices.amazonIndia.available ? localPrices.amazonIndia.price : null}
                        flipkartPrice={localPrices.flipkart.available ? localPrices.flipkart.price : null}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                        <PriceRow label="Import (Total Landed)" price={importCosts.totalLandedCost} color="text-pink-600" icon="✈️" />
                        <PriceRow
                            label="Amazon India"
                            price={localPrices.amazonIndia.available ? localPrices.amazonIndia.price : null}
                            color="text-orange-600" icon="🛒"
                            url={localPrices.amazonIndia.url}
                            matchInfo={localPrices.amazonIndia}
                        />
                        <PriceRow
                            label="Flipkart"
                            price={localPrices.flipkart.available ? localPrices.flipkart.price : null}
                            color="text-cyan-600" icon="🏪"
                            url={localPrices.flipkart.url}
                            matchInfo={localPrices.flipkart}
                        />
                    </div>
                    {(localPrices.amazonIndia.title || localPrices.flipkart.title) && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Matched Products</p>
                            {localPrices.amazonIndia.title && (
                                <div className="flex items-start gap-2 text-xs text-slate-500">
                                    <span>🛒</span>
                                    <div>
                                        <span>{localPrices.amazonIndia.title}</span>
                                        {localPrices.amazonIndia.matchScore != null && (
                                            <MatchBadge score={localPrices.amazonIndia.matchScore} status={localPrices.amazonIndia.matchStatus} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {localPrices.flipkart.title && (
                                <div className="flex items-start gap-2 text-xs text-slate-500">
                                    <span>🏪</span>
                                    <div>
                                        <span>{localPrices.flipkart.title}</span>
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
            {compliance && <CompliancePanel compliance={compliance} />}

            {/* Risk & Agent Pipeline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Risk Assessment + Intelligence Score */}
                <div className="glass-card p-6 animate-fade-in animate-delay-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">🎯 Import Intelligence Assessment</h3>

                    {/* Composite Score + Risk Level */}
                    <div className="flex items-center gap-5 mb-4">
                        {risk.importIntelligenceScore != null && (
                            <IntelligenceRing
                                score={risk.importIntelligenceScore}
                                label={risk.scoreLabel || 'Intelligence Score'}
                                color={risk.scoreColor || '#6366f1'}
                            />
                        )}
                        <div>
                            <div className={`px-4 py-1.5 mb-2 rounded-xl text-sm font-bold inline-block risk-${risk.riskLevel.toLowerCase()}`}>
                                {risk.riskIcon} {risk.riskLevel} Risk
                            </div>
                            <div className="text-xs text-slate-500">
                                Customs inspection: <span className="text-slate-900 font-medium">{risk.customsInspectionChance}</span>
                            </div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    {risk.scoreBreakdown && (
                        <div className="mb-4 p-3 rounded-xl space-y-2" style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Score Breakdown</p>
                            <ScoreBar label="Compliance" score={risk.scoreBreakdown.complianceScore} />
                            <ScoreBar label="Country Origin" score={risk.scoreBreakdown.countryOriginScore} />
                            <ScoreBar label="Product Category" score={risk.scoreBreakdown.categoryRiskScore} />
                            <ScoreBar label="Price Risk" score={risk.scoreBreakdown.priceRiskScore} />
                        </div>
                    )}

                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{risk.explanation}</p>

                    {/* Country profile */}
                    {risk.countryProfile && (
                        <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <span className="text-lg mr-2">{risk.countryProfile.flag}</span>
                            <span className="text-slate-900 font-medium">{risk.countryProfile.country}</span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-slate-500 text-xs">{risk.countryProfile.riskLabel}</span>
                            <p className="text-xs text-slate-400 mt-1 ml-7">{risk.countryProfile.reason}</p>
                        </div>
                    )}

                    {risk.riskFactors.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Factors</p>
                            {risk.riskFactors.map((factor, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="text-orange-600">⚡</span> {factor}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm">
                            <span>🚚</span>
                            <span className="text-slate-500">Estimated Delivery:</span>
                            <span className="text-slate-900 font-medium">{risk.deliveryText}</span>
                        </div>
                    </div>
                </div>

                {/* Agent Pipeline + Quality Control */}
                <div className="glass-card p-6 animate-fade-in animate-delay-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">🤖 Agent Pipeline</h3>
                    <div className="space-y-2.5">
                        {data.agentPipeline.map((agent, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <span className="text-green-600">✓</span>
                                <span className="font-medium text-slate-900">{agent.agent}</span>
                                <span className="flex-1 border-b border-dashed border-slate-200"></span>
                                <span className="text-green-600 text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                                    Success
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Live Sources */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Regulatory Sources</p>
                        <div className="space-y-1.5">
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
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quality Control</p>
                            <div className="space-y-1 text-xs">
                                <QCRow label="Product Identity" pass={qualityControl.productIdentityComplete} />
                                <QCRow label="Currency Conversion" pass={qualityControl.currencyConversionValid} />
                                <QCRow label="Cost Calculation" pass={qualityControl.costCalculationValid} />
                                <QCRow label="Marketplace Match" pass={qualityControl.marketplaceMatchQuality !== 'no_match'} detail={qualityControl.marketplaceMatchQuality} />
                            </div>
                        </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Total analysis time</span>
                        <span className="text-sm font-bold text-blue-600">⚡ {data.analysisTime}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center text-xs text-slate-400 py-8">
                <p>ImportSense AI — Live Regulatory Intelligence | DGFT · CBIC · ICEGATE 🚀</p>
            </footer>
        </div>
    );
}

/* ─── Helper Components ──────────────────────────────────────── */
function InfoBadge({ label, value, highlight }) {
    return (
        <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
            <p className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function PriceRow({ label, price, color, icon, url, matchInfo }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span>{icon}</span>
                {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 transition-colors">
                        {label}
                    </a>
                ) : (
                    <span className="text-slate-600">{label}</span>
                )}
                {matchInfo?.matchScore != null && matchInfo.matchScore > 0 && (
                    <MatchBadge score={matchInfo.matchScore} status={matchInfo.matchStatus} />
                )}
            </div>
            <span className={`font-semibold ${color}`}>
                {price != null ? formatINR(price) : 'Not found'}
            </span>
        </div>
    );
}

function QCRow({ label, pass, detail }) {
    return (
        <div className="flex items-center gap-2">
            <span className={pass ? 'text-green-600' : 'text-orange-600'}>{pass ? '✓' : '⚠'}</span>
            <span className="text-slate-500">{label}</span>
            {detail && <span className="text-slate-400 ml-auto">{detail}</span>}
        </div>
    );
}

function ScoreBar({ label, score }) {
    const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 w-24 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>
                <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: color }} />
            </div>
            <span className="font-semibold w-6 text-right" style={{ color }}>{score}</span>
        </div>
    );
}

function LiveSourceRow({ label, connected, url }) {
    const isConnected = connected === true;
    const failed = connected === false;
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 font-medium transition-colors ${isConnected ? 'text-green-600 hover:text-green-600' : failed ? 'text-orange-600 hover:text-orange-600' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : failed ? 'bg-orange-400' : 'bg-gray-500'}`} />
                {isConnected ? 'Live Connected' : failed ? 'Rulebook Fallback' : 'Checking...'}
            </a>
        </div>
    );
}

/* ─── Compliance Panel ───────────────────────────────────────── */
function CompliancePanel({ compliance }) {
    const { complianceLevel, status, violations, warnings, referenceLinks, liveIntelligence, data_source } = compliance;

    const levelStyles = {
        SAFE: { border: 'border-green-500/30', bg: 'rgba(34,197,94,0.07)', headerBg: 'rgba(22,163,74,0.1)', headerColor: '#16a34a' },
        MODERATE_RISK: { border: 'border-yellow-500/30', bg: 'rgba(234,179,8,0.07)', headerBg: 'rgba(234,179,8,0.15)', headerColor: '#ca8a04' },
        RESTRICTED: { border: 'border-orange-500/30', bg: 'rgba(249,115,22,0.07)', headerBg: 'rgba(234,88,12,0.1)', headerColor: '#ea580c' },
        PROHIBITED: { border: 'border-red-500/30', bg: 'rgba(239,68,68,0.07)', headerBg: 'rgba(220,38,38,0.1)', headerColor: '#dc2626' },
    };

    const style = levelStyles[complianceLevel] || levelStyles.SAFE;
    const allIssues = [...(violations || []), ...(warnings || [])];

    return (
        <div className={`glass-card p-6 mb-6 animate-fade-in ${style.border}`} style={{ background: style.bg }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    ⚖️ Import Legality Check
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    {data_source && <DataSourceBadge source={data_source} />}
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: style.headerBg, color: style.headerColor }}>
                        {status.icon} {status.badge}
                    </span>
                </div>
            </div>

            {/* Live Intelligence Banner */}
            {liveIntelligence && (
                <div className="mb-4 px-4 py-2 rounded-xl flex flex-wrap items-center gap-3 text-xs"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <span className="font-semibold text-blue-600">🌐 Live Regulatory Intelligence</span>
                    <span className={`flex items-center gap-1 ${liveIntelligence.dgftConnected ? 'text-green-600' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${liveIntelligence.dgftConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        DGFT {liveIntelligence.dgftConnected ? 'Live' : 'Offline'}
                    </span>
                    <span className={`flex items-center gap-1 ${liveIntelligence.cbicConnected ? 'text-green-600' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${liveIntelligence.cbicConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        CBIC {liveIntelligence.cbicConnected ? 'Live' : 'Offline'}
                    </span>
                    {liveIntelligence.liveMatchesFound > 0 && (
                        <span className="text-orange-500 font-medium">
                            ⚡ {liveIntelligence.liveMatchesFound} live regulatory mention(s) found
                        </span>
                    )}
                    <span className="text-slate-400 ml-auto">
                        {liveIntelligence.productKeywordsAnalyzed?.length ?? 0} keywords analyzed
                    </span>
                </div>
            )}

            {/* Main status message */}
            <div className="flex items-start gap-4 mb-4 p-4 rounded-xl" style={{ background: style.headerBg }}>
                <span className="text-2xl flex-shrink-0">{status.icon}</span>
                <div>
                    <p className="font-semibold text-slate-900 text-base mb-1">{status.label}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{status.shortMsg}</p>
                </div>
            </div>

            {/* Violations / Warnings */}
            {allIssues.length > 0 ? (
                <div className="space-y-4">
                    {violations.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span>🚨</span> Compliance Violations ({violations.length})
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
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span>⚠️</span> Compliance Warnings ({warnings.length})
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
                <div className="flex items-center gap-3 text-sm text-green-600">
                    <span className="text-xl">✅</span>
                    <div>
                        <p className="font-semibold">No import restrictions found</p>
                        <p className="text-slate-500 text-xs">This product appears to be freely importable into India.</p>
                    </div>
                </div>
            )}

            {/* Compliance recommendation */}
            {compliance.complianceRecommendation && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                        {complianceLevel === 'PROHIBITED' ? '❌' : complianceLevel === 'RESTRICTED' ? '⚠️' : '💡'} AI Recommendation
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{compliance.complianceRecommendation}</p>
                </div>
            )}

            {/* Reference authorities */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reference Authorities</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(referenceLinks || {}).map(([name, url]) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded-lg text-blue-500 hover:text-blue-600 transition-colors"
                            style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            🔗 {name}
                        </a>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    Live data from DGFT ITC-HS Import Policy & CBIC Customs Tariff
                </p>
            </div>
        </div>
    );
}

function ComplianceIssueCard({ issue, severity }) {
    const isHigh = severity === 'high';
    const borderColor = isHigh ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)';
    const bgColor = isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)';
    const badgeColor = isHigh ? { bg: 'rgba(239,68,68,0.2)', text: '#dc2626' } : { bg: 'rgba(234,179,8,0.2)', text: '#ca8a04' };

    return (
        <div className="p-4 rounded-xl text-sm space-y-2"
            style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{issue.icon}</span>
                    <span className="font-semibold text-slate-900">{issue.title}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: badgeColor.bg, color: badgeColor.text }}>
                    {issue.level.replace('_', ' ')}
                </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{issue.message}</p>
            {issue.certification && (
                <p className="text-xs text-blue-600 flex items-start gap-1">
                    <span>📋</span> <span><strong>Required:</strong> {issue.certification}</span>
                </p>
            )}
            {issue.alternatives && (
                <p className="text-xs text-green-600 flex items-start gap-1">
                    <span>✅</span> <span><strong>Alternative:</strong> {issue.alternatives}</span>
                </p>
            )}
            {issue.sourceRef && (
                <p className="text-xs text-blue-500 flex items-center gap-1">
                    <span>📎</span> <em>{issue.sourceRef}</em>
                </p>
            )}
            <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                <span>⚖️</span> <em>{issue.authority}</em>
            </p>
        </div>
    );
}
