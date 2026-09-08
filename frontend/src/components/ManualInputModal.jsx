import { useState } from 'react';

const CATEGORIES = [
    'Electronics', 'Clothing', 'Footwear', 'Supplements', 'Health',
    'Beauty', 'Accessories', 'Sports', 'Books', 'Toys', 'Other',
];

const CURRENCIES = [
    { code: 'USD', label: '🇺🇸 USD — US Dollar', symbol: '$' },
    { code: 'EUR', label: '🇪🇺 EUR — Euro', symbol: '€' },
    { code: 'GBP', label: '🇬🇧 GBP — British Pound', symbol: '£' },
    { code: 'CNY', label: '🇨🇳 CNY — Chinese Yuan', symbol: '¥' },
    { code: 'JPY', label: '🇯🇵 JPY — Japanese Yen', symbol: '¥' },
    { code: 'AUD', label: '🇦🇺 AUD — Australian Dollar', symbol: 'A$' },
    { code: 'CAD', label: '🇨🇦 CAD — Canadian Dollar', symbol: 'C$' },
    { code: 'AED', label: '🇦🇪 AED — UAE Dirham', symbol: 'د.إ' },
    { code: 'SGD', label: '🇸🇬 SGD — Singapore Dollar', symbol: 'S$' },
    { code: 'KRW', label: '🇰🇷 KRW — Korean Won', symbol: '₩' },
];

export default function ManualInputModal({ partialData, url, onSubmit, onCancel }) {
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState(partialData?.currency || 'USD');
    const [category, setCategory] = useState(partialData?.category || 'Electronics');
    const [name, setName] = useState(partialData?.name || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!price || parseFloat(price) <= 0) return;
        onSubmit({
            price: parseFloat(price),
            currency,
            category,
            name: name || undefined,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="glass-card p-8 max-w-lg w-full animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <span className="text-4xl mb-3 block">📝</span>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Details Needed</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        We couldn't automatically extract the price from this page. Please provide the product details below for accurate analysis.
                    </p>
                </div>

                {/* Detected info */}
                {partialData && (
                    <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <p className="text-blue-600 font-medium mb-1">🔍 Auto-detected:</p>
                        <p className="text-slate-500">
                            {partialData.name && <><span className="text-slate-900">{partialData.name}</span> · </>}
                            {partialData.marketplace} · {partialData.country}
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4" id="manual-input-form">
                    {/* Product Name */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                            Product Name
                        </label>
                        <input
                            id="manual-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apple AirPods Pro"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-slate-200 text-slate-900 placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Price + Currency Row */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                Price <span className="text-pink-400">*</span>
                            </label>
                            <input
                                id="manual-price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g. 199.99"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-slate-200 text-slate-900 placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                Currency
                            </label>
                            <select
                                id="manual-currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-3 rounded-xl bg-white/5 border border-slate-200 text-slate-900 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code} style={{ background: '#1a1040' }}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                            Product Category
                        </label>
                        <select
                            id="manual-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-slate-200 text-slate-900 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat} style={{ background: '#1a1040' }}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* URL Display */}
                    <div className="px-3 py-2 rounded-lg text-xs text-slate-400 truncate" style={{ background: 'rgba(0,0,0,0.03)' }}>
                        🔗 {url}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-white/20 transition-colors cursor-pointer font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            id="manual-submit"
                            type="submit"
                            disabled={!price || parseFloat(price) <= 0}
                            className="flex-1 btn-gradient px-4 py-3 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ✨ Analyze
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
