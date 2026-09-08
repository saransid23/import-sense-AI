import { useState } from 'react';

const CATEGORIES = [
    'Electronics', 'Clothing', 'Footwear', 'Supplements', 'Health',
    'Beauty', 'Accessories', 'Sports', 'Books', 'Toys', 'Other',
];

const CURRENCIES = [
    { code: 'USD', label: 'USD — US Dollar', symbol: '$' },
    { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
    { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
    { code: 'CNY', label: 'CNY — Chinese Yuan', symbol: '¥' },
    { code: 'JPY', label: 'JPY — Japanese Yen', symbol: '¥' },
    { code: 'AUD', label: 'AUD — Australian Dollar', symbol: 'A$' },
    { code: 'CAD', label: 'CAD — Canadian Dollar', symbol: 'C$' },
    { code: 'AED', label: 'AED — UAE Dirham', symbol: 'د.إ' },
    { code: 'SGD', label: 'SGD — Singapore Dollar', symbol: 'S$' },
    { code: 'KRW', label: 'KRW — Korean Won', symbol: '₩' },
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

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold placeholder-white/50 outline-none focus:border-emerald-400 focus:bg-white/15 transition-all";
    const selectClasses = "w-full px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold outline-none focus:border-emerald-400 transition-all cursor-pointer";

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="glass-card p-8 max-w-lg w-full animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-white mb-2">Product Details Needed</h2>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                        We couldn't automatically extract the price from this page. Please provide the product details below for accurate analysis.
                    </p>
                </div>

                {/* Detected info */}
                {partialData && (
                    <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <p className="text-emerald-300 font-bold mb-1">Auto-detected:</p>
                        <p className="text-white/90 font-medium">
                            {partialData.name && <><span className="text-white font-bold">{partialData.name}</span> · </>}
                            {partialData.marketplace} · {partialData.country}
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4" id="manual-input-form">
                    {/* Product Name */}
                    <div>
                        <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                            Product Name
                        </label>
                        <input
                            id="manual-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apple AirPods Pro"
                            className={inputClasses}
                        />
                    </div>

                    {/* Price + Currency Row */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                            <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                                Price <span className="text-rose-400">*</span>
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
                                className={inputClasses}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                                Currency
                            </label>
                            <select
                                id="manual-currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className={selectClasses}
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code} style={{ background: '#022c15', color: '#ffffff' }}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                            Product Category
                        </label>
                        <select
                            id="manual-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={selectClasses}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat} style={{ background: '#022c15', color: '#ffffff' }}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* URL Display */}
                    <div className="px-3 py-2 rounded-lg text-xs text-white/80 font-medium truncate" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {url}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white hover:text-emerald-300 hover:border-white/30 transition-all cursor-pointer font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            id="manual-submit"
                            type="submit"
                            disabled={!price || parseFloat(price) <= 0}
                            className="flex-1 btn-gradient px-4 py-3 rounded-xl text-base font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Analyze
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
