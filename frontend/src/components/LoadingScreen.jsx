import { useState, useEffect } from 'react';

const AGENT_STEPS = [
    { id: 'ProductAgent', name: 'Product Agent', desc: 'Extracting product details & identity...' },
    { id: 'CurrencyAgent', name: 'Currency Agent', desc: 'Converting to INR via live exchange rates...' },
    { id: 'ComplianceAgent', name: 'Compliance Agent', desc: 'Fetching DGFT & CBIC regulatory rules...' },
    { id: 'DutyAgent', name: 'Duty Agent', desc: 'Querying CBIC customs tariff (HS Code)...' },
    { id: 'RiskAgent', name: 'Risk Agent', desc: 'Computing Import Intelligence Score...' },
    { id: 'PriceComparisonAgent', name: 'Price Comparison Agent', desc: 'Searching Amazon India & Flipkart...' },
    { id: 'RecommendationAgent', name: 'Recommendation Agent', desc: 'Generating final import advice...' },
];

export default function LoadingScreen({ stepStates = {} }) {
    const hasLiveUpdates = Object.keys(stepStates).length > 0;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="text-center mb-10 animate-fade-in">
                <div className="spinner mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-2">Analyzing Your Product</h2>
                <p className="text-white/90 font-medium">7 AI agents running live regulatory intelligence...</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-300 font-bold">Connecting to DGFT · CBIC · ICEGATE</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
            </div>

            <div className="max-w-md w-full space-y-3">
                {AGENT_STEPS.map((step, i) => {
                    const state = stepStates[step.id];
                    const isSuccess = state?.status === 'success';
                    const isRunning = state?.status === 'running' || (!hasLiveUpdates && i === 0);

                    return (
                        <div
                            key={step.id}
                            className={`glass-card flex items-center gap-4 px-5 py-3 transition-all duration-500 ${
                                isSuccess
                                    ? 'opacity-100'
                                    : isRunning
                                        ? 'opacity-100 pulse-glow'
                                        : 'opacity-40'
                            }`}
                            style={{
                                borderColor: isSuccess ? 'rgba(16,185,129,0.4)' : isRunning ? 'rgba(16,185,129,0.5)' : undefined
                            }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-white text-sm">{step.name}</p>
                                    {step.id === 'ComplianceAgent' && isSuccess && state?.extra && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-fade-in">
                                            {state.extra}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/80 font-medium">{step.desc}</p>
                            </div>
                            {isSuccess && <span className="text-emerald-400 font-black text-lg">✓</span>}
                            {isRunning && (
                                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Live data source indicator */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in">
                {['DGFT Portal', 'CBIC Tariff', 'ICEGATE'].map((src) => (
                    <span
                        key={src}
                        className="text-xs px-3 py-1.5 rounded-full font-bold"
                        style={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0', border: '1px solid rgba(16,185,129,0.35)' }}
                    >
                        {src}
                    </span>
                ))}
            </div>
        </div>
    );
}
