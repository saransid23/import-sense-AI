// ============================================
// AGENT 2 — CURRENCY AGENT
// Converts any world currency to INR
// Supports 170+ currencies with live API + fallback rates
// ============================================

// ─── Comprehensive Fallback Rates (INR per 1 unit) ──────────
// Rates as of early 2025 — used when live API is unavailable
const FALLBACK_RATES = {
    // Major Currencies
    USD: 83.50,   // US Dollar
    EUR: 91.20,   // Euro
    GBP: 106.50,  // British Pound
    JPY: 0.56,    // Japanese Yen
    CHF: 94.80,   // Swiss Franc
    CAD: 62.10,   // Canadian Dollar
    AUD: 54.80,   // Australian Dollar
    NZD: 50.10,   // New Zealand Dollar
    CNY: 11.50,   // Chinese Yuan Renminbi
    HKD: 10.70,   // Hong Kong Dollar
    SGD: 63.20,   // Singapore Dollar
    KRW: 0.064,   // South Korean Won
    SEK: 8.10,    // Swedish Krona
    NOK: 7.90,    // Norwegian Krone
    DKK: 12.25,   // Danish Krone
    INR: 1.00,    // Indian Rupee

    // Middle East & Africa
    AED: 22.73,   // UAE Dirham
    SAR: 22.27,   // Saudi Riyal
    QAR: 22.94,   // Qatari Riyal
    KWD: 271.50,  // Kuwaiti Dinar
    BHD: 221.60,  // Bahraini Dinar
    OMR: 216.90,  // Omani Rial
    ILS: 22.80,   // Israeli Shekel
    TRY: 2.60,    // Turkish Lira
    EGP: 1.74,    // Egyptian Pound
    ZAR: 4.60,    // South African Rand
    NGN: 0.055,   // Nigerian Naira
    GHS: 5.60,    // Ghanaian Cedi
    KES: 0.65,    // Kenyan Shilling
    ETB: 0.73,    // Ethiopian Birr
    TZS: 0.033,   // Tanzanian Shilling
    UGX: 0.022,   // Ugandan Shilling
    MAD: 8.35,    // Moroccan Dirham
    TND: 26.80,   // Tunisian Dinar
    LYD: 17.20,   // Libyan Dinar
    DZD: 0.62,    // Algerian Dinar
    SDG: 0.14,    // Sudanese Pound
    SOS: 0.15,    // Somali Shilling
    ZMW: 3.10,    // Zambian Kwacha
    MWK: 0.048,   // Malawian Kwacha
    MZN: 1.32,    // Mozambican Metical
    BWP: 6.10,    // Botswanan Pula
    NAD: 4.60,    // Namibian Dollar
    SZL: 4.60,    // Swazi Lilangeni
    LSL: 4.60,    // Lesotho Loti
    MUR: 1.87,    // Mauritian Rupee
    SCR: 6.10,    // Seychellois Rupee
    CV: 0.93,     // Cape Verdean Escudo
    XOF: 0.14,    // West African CFA Franc
    XAF: 0.14,    // Central African CFA Franc
    GMD: 1.37,    // Gambian Dalasi
    GNF: 0.0097,  // Guinean Franc
    SLL: 0.0039,  // Sierra Leonean Leone
    LRD: 0.44,    // Liberian Dollar
    MGA: 0.018,   // Malagasy Ariary
    RWF: 0.063,   // Rwandan Franc
    BIF: 0.029,   // Burundian Franc
    DJF: 0.47,    // Djiboutian Franc
    ERN: 5.56,    // Eritrean Nakfa
    AOA: 0.10,    // Angolan Kwanza
    CDF: 0.030,   // Congolese Franc
    ZWL: 0.26,    // Zimbabwean Dollar
    XRP: 0.0046,  // Ripple

    // Asia & Pacific
    INR: 1.00,
    PKR: 0.30,    // Pakistani Rupee
    BDT: 0.76,    // Bangladeshi Taka
    LKR: 0.28,    // Sri Lankan Rupee
    NPR: 0.63,    // Nepalese Rupee
    MVR: 5.42,    // Maldivian Rufiyaa
    BTN: 1.00,    // Bhutanese Ngultrum
    MMK: 0.040,   // Myanmar Kyat
    THB: 2.38,    // Thai Baht
    VND: 0.0034,  // Vietnamese Dong
    IDR: 0.0054,  // Indonesian Rupiah
    PHP: 1.50,    // Philippine Peso
    MYR: 18.70,   // Malaysian Ringgit
    BND: 63.20,   // Brunei Dollar
    KHR: 0.020,   // Cambodian Riel
    LAK: 0.0040,  // Laotian Kip
    TWD: 2.64,    // Taiwan Dollar
    MNT: 0.025,   // Mongolian Tugrik
    KZT: 0.19,    // Kazakhstani Tenge
    UZS: 0.0066,  // Uzbekistani Som
    KGS: 0.97,    // Kyrgyzstani Som
    TJS: 7.70,    // Tajikistani Somoni
    TMT: 23.89,   // Turkmenistani Manat
    AFN: 1.18,    // Afghan Afghani
    IRR: 0.0020,  // Iranian Rial
    IQD: 0.064,   // Iraqi Dinar
    SYP: 0.33,    // Syrian Pound
    LBP: 0.0056,  // Lebanese Pound
    JOD: 117.70,  // Jordanian Dinar
    YER: 0.33,    // Yemeni Rial
    PGK: 22.20,   // Papua New Guinean Kina
    FJD: 37.70,   // Fijian Dollar
    SBD: 9.93,    // Solomon Islands Dollar
    VUV: 0.70,    // Vanuatu Vatu
    WST: 30.60,   // Samoan Tālā
    TOP: 35.60,   // Tongan Paʻanga
    PGK: 22.20,   // Papua New Guinean Kina
    KPW: 0.093,   // North Korean Won

    // Europe (Non-Euro)
    RUB: 0.93,    // Russian Ruble
    UAH: 2.17,    // Ukrainian Hryvnia
    PLN: 21.40,   // Polish Zloty
    CZK: 3.70,    // Czech Koruna
    HUF: 0.23,    // Hungarian Forint
    RON: 18.50,   // Romanian Leu
    BGN: 46.60,   // Bulgarian Lev
    HRK: 12.10,   // Croatian Kuna
    RSD: 0.78,    // Serbian Dinar
    BAM: 46.60,   // Bosnian Mark
    MKD: 1.48,    // Macedonian Denar
    ALL: 0.88,    // Albanian Lek
    MDL: 4.74,    // Moldovan Leu
    BYN: 24.80,   // Belarusian Ruble
    GEL: 31.20,   // Georgian Lari
    AMD: 0.22,    // Armenian Dram
    AZN: 49.10,   // Azerbaijani Manat
    ISK: 0.61,    // Icelandic Krona

    // Americas
    MXN: 4.85,    // Mexican Peso
    BRL: 16.80,   // Brazilian Real
    ARS: 0.094,   // Argentine Peso
    CLP: 0.090,   // Chilean Peso
    COP: 0.021,   // Colombian Peso
    PEN: 22.30,   // Peruvian Sol
    VES: 0.0023,  // Venezuelan Bolivar
    BOB: 12.10,   // Bolivian Boliviano
    UYU: 2.20,    // Uruguayan Peso
    PYG: 0.011,   // Paraguayan Guaraní
    GYD: 0.40,    // Guyanese Dollar
    SRD: 2.47,    // Surinamese Dollar
    TTD: 12.30,   // Trinidad & Tobago Dollar
    BBD: 41.75,   // Barbadian Dollar
    JMD: 0.54,    // Jamaican Dollar
    HTG: 0.64,    // Haitian Gourde
    DOP: 1.47,    // Dominican Peso
    CUP: 3.48,    // Cuban Peso
    GTQ: 10.80,   // Guatemalan Quetzal
    HNL: 3.37,    // Honduran Lempira
    NIO: 2.27,    // Nicaraguan Córdoba
    CRC: 0.16,    // Costa Rican Colón
    PAB: 83.50,   // Panamanian Balboa
    BSD: 83.50,   // Bahamian Dollar
    BZD: 41.75,   // Belize Dollar
    XCD: 30.90,   // East Caribbean Dollar
    AWG: 46.39,   // Aruban Florin
    ANG: 46.39,   // Netherlands Antillean Guilder
    KYD: 100.00,  // Cayman Islands Dollar

    // Other / Special
    XAU: 160000,  // Gold (per troy ounce)
    XAG: 960,     // Silver (per troy ounce)
    BTC: 7050000, // Bitcoin
    ETH: 260000,  // Ethereum
};

// ─── Currency Metadata ───────────────────────────────────────
const CURRENCY_METADATA = {
    USD: { name: 'US Dollar', symbol: '$', country: 'United States' },
    EUR: { name: 'Euro', symbol: '€', country: 'European Union' },
    GBP: { name: 'British Pound', symbol: '£', country: 'United Kingdom' },
    JPY: { name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
    CNY: { name: 'Chinese Yuan', symbol: '¥', country: 'China' },
    AED: { name: 'UAE Dirham', symbol: 'د.إ', country: 'UAE' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore' },
    AUD: { name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
    CHF: { name: 'Swiss Franc', symbol: 'Fr', country: 'Switzerland' },
    HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong' },
    KRW: { name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
    MYR: { name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia' },
    THB: { name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
    SAR: { name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia' },
    QAR: { name: 'Qatari Riyal', symbol: 'ر.ق', country: 'Qatar' },
    KWD: { name: 'Kuwaiti Dinar', symbol: 'K.D.', country: 'Kuwait' },
    INR: { name: 'Indian Rupee', symbol: '₹', country: 'India' },
};

// ─── Live rate fetching ──────────────────────────────────────

// Cache rates to avoid too many API calls (5 min TTL)
const rateCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchLiveRates(baseCurrency) {
    const cached = rateCache[baseCurrency];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[CurrencyAgent] Using cached rate for ${baseCurrency}`);
        return cached.rates;
    }

    // Try exchangerate-api.com (free, no key required for basic endpoint)
    const endpoints = [
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
        `https://open.er-api.com/v6/latest/${baseCurrency}`,
    ];

    for (const endpoint of endpoints) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(endpoint, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) continue;

            const data = await response.json();
            const rates = data.rates || data.conversion_rates;

            if (rates && rates.INR) {
                rateCache[baseCurrency] = { rates, timestamp: Date.now() };
                console.log(`[CurrencyAgent] ✓ Live rates fetched from ${endpoint}`);
                return rates;
            }
        } catch (err) {
            console.log(`[CurrencyAgent] API failed (${endpoint}): ${err.message}`);
        }
    }

    return null;
}


async function currencyAgent(price, currency) {
    console.log(`[CurrencyAgent] Converting ${price} ${currency} → INR`);

    // Direct INR
    if (!currency || currency.toUpperCase() === 'INR') {
        return {
            agent: 'CurrencyAgent',
            success: true,
            data: {
                originalPrice: price,
                originalCurrency: 'INR',
                exchangeRate: 1,
                priceInINR: price,
                rateSource: 'direct',
                currencyName: 'Indian Rupee',
                currencySymbol: '₹',
            },
        };
    }

    const upperCurrency = currency.toUpperCase().trim();
    let rate = null;
    let source = 'fallback';

    // ── Try live API first ──
    const liveRates = await fetchLiveRates(upperCurrency);
    if (liveRates && liveRates.INR) {
        rate = liveRates.INR;
        source = 'live';
        console.log(`[CurrencyAgent] ✓ Live rate: 1 ${upperCurrency} = ₹${rate}`);
    }

    // ── Fallback to stored rates ──
    if (!rate) {
        if (FALLBACK_RATES[upperCurrency]) {
            rate = FALLBACK_RATES[upperCurrency];
            source = 'fallback';
            console.log(`[CurrencyAgent] Using fallback rate: 1 ${upperCurrency} = ₹${rate}`);
        } else {
            // Try fetching USD rates and cross-converting
            console.log(`[CurrencyAgent] Unknown currency ${upperCurrency}, attempting cross-conversion via USD...`);
            const usdRates = await fetchLiveRates('USD');
            if (usdRates && usdRates[upperCurrency] && usdRates.INR) {
                // 1 XYZ = (1 / XYZ_per_USD) * INR_per_USD
                rate = usdRates.INR / usdRates[upperCurrency];
                source = 'cross_rate';
                console.log(`[CurrencyAgent] Cross-rate: 1 ${upperCurrency} = ₹${rate.toFixed(4)}`);
            }
        }
    }

    if (!rate || rate <= 0) {
        return {
            agent: 'CurrencyAgent',
            success: false,
            error: `Currency not supported: ${upperCurrency}. Please use a standard ISO 4217 currency code.`,
        };
    }

    const priceInINR = Math.round(price * rate * 100) / 100;
    const meta = CURRENCY_METADATA[upperCurrency] || {};

    console.log(`[CurrencyAgent] ✓ ${price} ${upperCurrency} = ₹${priceInINR} (rate: ${rate}, source: ${source})`);

    return {
        agent: 'CurrencyAgent',
        success: true,
        data: {
            originalPrice: price,
            originalCurrency: upperCurrency,
            exchangeRate: Math.round(rate * 10000) / 10000,
            priceInINR: priceInINR,
            rateSource: source,
            currencyName: meta.name || upperCurrency,
            currencySymbol: meta.symbol || upperCurrency,
            countryOfCurrency: meta.country || null,
        },
    };
}

module.exports = currencyAgent;
