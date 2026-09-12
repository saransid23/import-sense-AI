import { useState } from 'react';

const DEMO_PRODUCTS = [
    { id: 'airpods-pro', name: 'Apple AirPods Pro', url: 'https://amazon.com/airpods-pro-2nd-generation', tag: 'Electronics' },
    { id: 'logitech-mx', name: 'Logitech MX Master 3S', url: 'https://amazon.com/logitech-mx-master-3s-mouse', tag: 'Peripherals' },
    { id: 'nike-shoes', name: 'Nike Air Max 90', url: 'https://nike.com/air-max-90-sneakers', tag: 'Footwear' },
    { id: 'vitamin-d', name: 'Vitamin D3 Supplements', url: 'https://iherb.com/vitamin-d3-supplement', tag: 'Health' },
    { id: 'samsung-watch', name: 'Samsung Galaxy Watch 6', url: 'https://samsung.com/galaxy-watch-6-classic', tag: 'Wearables' },
    { id: 'shein-dress', name: 'SHEIN Maxi Dress', url: 'https://shein.com/floral-dress-fashion', tag: 'Fashion' },
];

const FEATURES = [
    {
        title: 'Smart Extraction',
        desc: 'AI agents extract product details, pricing, and category from any international marketplace link.',
        stat: '99%',
        statLabel: 'Accuracy',
    },
    {
        title: 'Customs Intelligence',
        desc: 'Calculates exact customs duty, IGST, Social Welfare Surcharge, and shipping costs for India.',
        stat: 'Live',
        statLabel: 'CBIC Data',
    },
    {
        title: 'AI Recommendation',
        desc: 'Get a clear Import or Buy Locally recommendation with comprehensive savings analysis.',
        stat: '6',
        statLabel: 'AI Agents',
    },
];

const PIPELINE = [
    { name: 'Product', color: '#34d399' },
    { name: 'Currency', color: '#6ee7b7' },
    { name: 'Compliance', color: '#a7f3d0' },
    { name: 'Duty', color: '#34d399' },
    { name: 'Risk', color: '#fcd34d' },
    { name: 'Recommend', color: '#6ee7b7' },
];

export default function LandingPage({ onAnalyze, error }) {
    const [url, setUrl] = useState('');
    const [showDemo, setShowDemo] = useState(false);
    const [focusInput, setFocusInput] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onAnalyze(url.trim());
        }
    };

    const handleDemoClick = (demoUrl) => {
        setUrl(demoUrl);
        onAnalyze(demoUrl);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

            {/* Ambient background glow orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%)' }} />

            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto animate-fade-in relative z-10 w-full px-2">

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6 text-white tracking-tight break-words">
                    Know the{' '}
                    <span className="relative inline-block">
                        <span className="relative z-10 text-transparent bg-clip-text"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #34d399, #a7f3d0, #6ee7b7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.5))',
                            }}>
                            Real Cost
                        </span>
                    </span>
                    <br />
                    Before You Import
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
                    Paste any product link from{' '}
                    <span className="text-emerald-300 font-bold">AliExpress</span>,{' '}
                    <span className="text-emerald-300 font-bold">Amazon US</span>,{' '}
                    <span className="text-emerald-300 font-bold">Shein</span>, or{' '}
                    <span className="text-emerald-300 font-bold">iHerb</span>
                    {' '}our AI calculates the{' '}
                    <span className="text-emerald-300 font-bold">true landed cost</span>,
                    compares with Indian prices, and gives you a{' '}
                    <span className="text-emerald-300 font-bold">smart recommendation</span>.
                </p>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6 w-full" id="analyze-form">
                    <div
                        className="glass-card flex flex-col sm:flex-row items-stretch gap-2 p-2 transition-all duration-300 w-full"
                        style={{
                            borderColor: focusInput ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.3)',
                            boxShadow: focusInput
                                ? '0 0 35px rgba(16,185,129,0.25), 0 4px 20px rgba(0,0,0,0.3)'
                                : '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 min-w-0">
                            <svg className="w-5 h-5 text-emerald-400 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <input
                                id="product-url-input"
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onFocus={() => setFocusInput(true)}
                                onBlur={() => setFocusInput(false)}
                                placeholder="Paste a product link..."
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/60 font-medium text-sm sm:text-base py-3 min-w-0"
                            />
                        </div>
                        <button
                            id="analyze-button"
                            type="submit"
                            disabled={!url.trim()}
                            className="px-6 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-extrabold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap w-full sm:w-auto"
                            style={{
                                background: url.trim()
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : 'rgba(16,185,129,0.25)',
                                color: '#fff',
                                boxShadow: url.trim()
                                    ? '0 0 24px rgba(16,185,129,0.5), 0 4px 16px rgba(16,185,129,0.3)'
                                    : 'none',
                                border: '1px solid rgba(255,255,255,0.2)',
                                letterSpacing: '0.02em',
                            }}
                        >
                            Analyze Cost
                        </button>
                    </div>
                </form>

                {/* Supported marketplaces */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4 text-xs font-bold text-emerald-200">
                    <span>Supports:</span>
                    {['AliExpress', 'Amazon', 'Shein', 'iHerb', 'Nike'].map((m) => (
                        <span key={m} className="px-2.5 py-1 rounded-md text-white font-bold"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                            {m}
                        </span>
                    ))}
                </div>

                {/* Error message */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-bold"
                        style={{
                            background: 'rgba(239,68,68,0.2)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#fecaca',
                        }}>
                        <span>Notice:</span> {error}
                    </div>
                )}

                {/* Demo Products Button */}
                <button
                    id="demo-toggle"
                    onClick={() => setShowDemo(!showDemo)}
                    className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-white transition-all duration-300 cursor-pointer font-bold mt-2 px-5 py-2.5 rounded-xl hover:bg-white/10 active:scale-95 border border-transparent hover:border-emerald-400/30"
                >
                    <span>{showDemo ? 'Hide demo products' : 'Try demo products for quick testing'}</span>
                    <svg className={`w-4 h-4 text-emerald-400 transition-transform duration-300 ${showDemo ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Demo Products Grid (Smooth Height & Fade-In Transition) */}
            <div
                className={`w-full max-w-4xl mx-auto grid transition-all duration-500 ease-in-out relative z-10 ${
                    showDemo
                        ? 'grid-rows-[1fr] opacity-100 mt-8 pointer-events-auto'
                        : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
                        {DEMO_PRODUCTS.map((product) => (
                            <button
                                key={product.id}
                                id={`demo-${product.id}`}
                                onClick={() => handleDemoClick(product.url)}
                                className="glass-card p-4 text-left cursor-pointer transition-all duration-300 group hover:scale-[1.04] hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-emerald-300"
                                        style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)' }}>
                                        {product.tag}
                                    </span>
                                </div>
                                <span className="text-sm font-extrabold text-white block mb-1">{product.name}</span>
                                <span className="text-xs text-white/80 font-medium block truncate">{product.url}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in animate-delay-3 relative z-10">
                {FEATURES.map((feat, i) => (
                    <div key={i} className="glass-card p-6 group hover:scale-[1.02] transition-all relative overflow-hidden"
                        style={{ borderTop: '2px solid rgba(16,185,129,0.5)' }}>
                        {/* Subtle corner accent */}
                        <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.08] pointer-events-none"
                            style={{ background: 'radial-gradient(circle at top right, #10b981, transparent)' }} />

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-extrabold text-white text-lg">{feat.title}</h3>
                            <div className="text-right">
                                <p className="text-lg font-black text-emerald-300" style={{ textShadow: '0 0 10px rgba(16,185,129,0.4)' }}>{feat.stat}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white font-extrabold">{feat.statLabel}</p>
                            </div>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                ))}
            </div>

            {/* Agent Pipeline Visual */}
            <div className="max-w-4xl mx-auto mt-20 animate-fade-in animate-delay-5 relative z-10">
                <h3 className="text-center text-xs font-black text-emerald-300 mb-6 tracking-[0.2em] uppercase">Multi-Agent AI Pipeline</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    {PIPELINE.map((agent, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 text-sm group hover:border-emerald-400 transition-all cursor-default"
                                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                                <span className="font-bold text-white">{agent.name}</span>
                                <span className="w-2 h-2 rounded-full" style={{ background: agent.color, boxShadow: `0 0 8px ${agent.color}` }} />
                            </div>
                            {i < 5 && (
                                <svg width="20" height="12" viewBox="0 0 20 12" className="text-emerald-400 flex-shrink-0">
                                    <path d="M0 6h16M13 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust bar */}
            <div className="mt-12 sm:mt-16 text-center animate-fade-in animate-delay-6 relative z-10 w-full px-2">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-white/90 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Live DGFT Data</span>
                    </div>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>CBIC Customs Tariff</span>
                    </div>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>ICEGATE Integration</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
