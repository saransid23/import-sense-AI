import { useState, useEffect } from 'react';

const AGENT_STEPS = [
    { name: 'Product Agent', desc: 'Extracting product details & identity...', icon: '📦' },
    { name: 'Currency Agent', desc: 'Converting to INR via live exchange rates...', icon: '💱' },
    { name: 'Compliance Agent', desc: 'Fetching DGFT & CBIC regulatory rules...', icon: '⚖️' },
    { name: 'Duty Agent', desc: 'Querying CBIC customs tariff (HS Code)...', icon: '🏛️' },
    { name: 'Risk Agent', desc: 'Computing Import Intelligence Score...', icon: '🎯' },
    { name: 'Price Comparison Agent', desc: 'Searching Amazon India & Flipkart...', icon: '📊' },
    { name: 'Recommendation Agent', desc: 'Generating final import advice...', icon: '🤖' },
];

export default function LoadingScreen() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < AGENT_STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 700);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="text-center mb-10 animate-fade-in">
                <div className="spinner mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Product</h2>
                <p className="text-slate-500">7 AI agents running live regulatory intelligence...</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs text-blue-500 font-medium">Connecting to DGFT · CBIC · ICEGATE</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
            </div>

            <div className="max-w-md w-full space-y-3">
                {AGENT_STEPS.map((step, i) => (
                    <div
                        key={i}
                        className={`glass-card flex items-center gap-4 px-5 py-3 transition-all duration-500 ${i < currentStep
                                ? 'opacity-100 border-green-500/30'
                                : i === currentStep
                                    ? 'opacity-100 pulse-glow border-indigo-500/40'
                                    : 'opacity-25'
                            }`}
                    >
                        <span className="text-2xl">{step.icon}</span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900 text-sm">{step.name}</p>
                            <p className="text-xs text-slate-500">{step.desc}</p>
                        </div>
                        {i < currentStep && <span className="text-green-600 text-lg">✓</span>}
                        {i === currentStep && (
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                ))}
            </div>

            {/* Live data source indicator */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in">
                {['🏛️ DGFT Portal', '📋 CBIC Tariff', '🚢 ICEGATE'].map((src) => (
                    <span
                        key={src}
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', border: '1px solid rgba(99,102,241,0.25)' }}
                    >
                        {src}
                    </span>
                ))}
            </div>
        </div>
    );
}
