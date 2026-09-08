import { useState, useEffect } from 'react';

const AGENT_STEPS = [
    { name: 'Product Agent', desc: 'Extracting product details & identity...' },
    { name: 'Currency Agent', desc: 'Converting to INR via live exchange rates...' },
    { name: 'Compliance Agent', desc: 'Fetching DGFT & CBIC regulatory rules...' },
    { name: 'Duty Agent', desc: 'Querying CBIC customs tariff (HS Code)...' },
    { name: 'Risk Agent', desc: 'Computing Import Intelligence Score...' },
    { name: 'Price Comparison Agent', desc: 'Searching Amazon India & Flipkart...' },
    { name: 'Recommendation Agent', desc: 'Generating final import advice...' },
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
                <h2 className="text-2xl font-black text-white mb-2">Analyzing Your Product</h2>
                <p className="text-white/90 font-medium">7 AI agents running live regulatory intelligence...</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-300 font-bold">Connecting to DGFT · CBIC · ICEGATE</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
            </div>

            <div className="max-w-md w-full space-y-3">
                {AGENT_STEPS.map((step, i) => (
                    <div
                        key={i}
                        className={`glass-card flex items-center gap-4 px-5 py-3 transition-all duration-500 ${i < currentStep
                                ? 'opacity-100'
                                : i === currentStep
                                    ? 'opacity-100 pulse-glow'
                                    : 'opacity-40'
                            }`}
                        style={{
                            borderColor: i < currentStep ? 'rgba(16,185,129,0.4)' : i === currentStep ? 'rgba(16,185,129,0.5)' : undefined
                        }}
                    >
                        <div className="flex-1">
                            <p className="font-extrabold text-white text-sm">{step.name}</p>
                            <p className="text-xs text-white/80 font-medium">{step.desc}</p>
                        </div>
                        {i < currentStep && <span className="text-emerald-400 font-black text-lg">✓</span>}
                        {i === currentStep && (
                            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                ))}
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
