# ============================================================
# ImportSense AI — Site & Terminology Knowledge Base
# Static glossary mapping terms, formulas, and concepts
# used throughout the ImportSense AI application.
# ============================================================

SITE_GLOSSARY = {
    # ── Cost & Duty Terms ──
    "CIF": (
        "CIF stands for Cost, Insurance, and Freight. In ImportSense AI, shipping and insurance "
        "are calculated at a standard 10% rate of the product's base price. Assessable Value (AV) = Product Price + Shipping (CIF)."
    ),
    "BCD": (
        "Basic Customs Duty (BCD) is the standard customs tax levied by the Government of India on imported goods under the CBIC Customs Tariff. "
        "BCD percentage varies by HS Code chapter (e.g., 0% for laptops, 20% for smartphones/drones, 25% for footwear, 30% for supplements)."
    ),
    "SWS": (
        "Social Welfare Surcharge (SWS) is an additional 10% surcharge applied strictly on the Basic Customs Duty (BCD) amount, "
        "not on the product price. SWS = 10% * BCD."
    ),
    "IGST": (
        "Integrated Goods and Services Tax (IGST) is applied on imported goods after customs duty. "
        "The taxable base for IGST is (Assessable Value + BCD + SWS). Standard IGST rates are 18% (most electronics/items), 12% (garments), 28% (beauty/luxury/gaming)."
    ),
    "Total Landed Cost": (
        "Total Landed Cost is the final true cost to get the product into India: "
        "Base Price + Shipping (CIF) + Basic Customs Duty (BCD) + Social Welfare Surcharge (SWS) + IGST."
    ),
    "HS Code": (
        "Harmonized System (HS) Code is an 8-digit international commodity classification code used by CBIC and ICEGATE to determine "
        "exact import duty rates, notifications, and import policies (e.g., HS 8517 for smartphones, HS 8471 for laptops, HS 6403 for footwear)."
    ),

    # ── Compliance Terms & Government Bodies ──
    "DGFT": (
        "DGFT stands for Directorate General of Foreign Trade — the Indian government body under the Ministry of Commerce and Industry "
        "that sets import and export policy, including which products are restricted, licensed, or freely importable. "
        "That's the live source checked for compliance verdicts on this site."
    ),
    "CBIC": (
        "CBIC stands for Central Board of Indirect Taxes and Customs — the Indian government authority that manages customs duties, "
        "tariff rates, BCD, SWS, and IGST import taxes."
    ),
    "ICEGATE": (
        "ICEGATE is the Indian Customs Electronic Data Interchange Gateway — the national portal for filing customs shipping bills, "
        "bill of entry clearance, and tariff assessments."
    ),
    "WPC": (
        "WPC (Wireless Planning & Coordination) is the wing of the Ministry of Communications that issues Equipment Type Approval (ETA) "
        "and licenses for importing wireless, Bluetooth, and radio frequency devices into India."
    ),
    "BIS": (
        "BIS (Bureau of Indian Standards) is the national standards body of India. Mandatory BIS certification is required for importing "
        "certain electronics, batteries, LED lights, and toys."
    ),
    "SAFE": (
        "Legal to Import — No special import restrictions or prohibitions were found. The item can be freely imported into India under standard customs procedures."
    ),
    "MODERATE_RISK": (
        "Compliance Check Required — The product falls into a sensitive category (e.g., cosmetics, medical devices, wireless items) "
        "and requires verification of standard Indian certifications (BIS, FSSAI, CDSCO, or WPC) before import."
    ),
    "RESTRICTED": (
        "Requires Certification / License — Import is restricted by DGFT or CBIC unless accompanied by mandatory government licenses or mandatory registrations (e.g., DGFT drone import license, WPC ETA)."
    ),
    "PROHIBITED": (
        "Import Prohibited / Banned — The product violates Indian import regulations, SCOMET controls, or wildlife/security laws. Import into India is prohibited."
    ),
    "DGFT Live": (
        "Directorate General of Foreign Trade live regulatory policy index. Governs import licenses, restrictions, and ITC-HS policy classifications."
    ),
    "CBIC Live": (
        "Central Board of Indirect Taxes and Customs live tariff database. Provides official BCD, SWS, and IGST rates for India."
    ),

    # ── Intelligence Score & Risk Terms ──
    "Import Intelligence Score": (
        "A composite score from 0 to 100 representing how smooth and low-risk an import into India will be (100 = lowest risk / safest import, 0 = highest risk / do not import). "
        "Weighted formula: 40% Compliance Risk + 20% Country of Origin Risk + 20% Product Category Risk + 20% Price Risk."
    ),
    "Compliance Score": "Sub-score (40% weight): 100 for SAFE, 50 for MODERATE_RISK, 20 for RESTRICTED, 0 for PROHIBITED.",
    "Country Origin Score": "Sub-score (20% weight): Rates customs scrutiny by country (e.g. USA/UK 85, Germany 82, Taiwan 70, China 40, Pakistan 20).",
    "Product Category Score": "Sub-score (20% weight): Rates inspection frequency by category (e.g. Books 95, Clothing 75, Electronics 55, Health/Supplements 30).",
    "Price Risk Score": "Sub-score (20% weight): Evaluates customs scrutiny based on value. Shipments under ₹5,000 face low scrutiny; high-value imports (>₹50,000) face thorough inspection.",

    # ── Matching & Local Comparison Terms ──
    "matchQuality": (
        "Indicates how closely the searched foreign product matches local listings on Indian marketplaces (Amazon India / Flipkart). "
        "Values: 'exact' (identical model/brand), 'approximate' (similar specifications/category), or 'no_match' (not available in India)."
    ),
    "matchScore": "Percentage confidence (0–100%) computed by matching product brand, model, storage, color, and SKU keywords.",

    # ── App Workflow ──
    "How ImportSense Works": (
        "ImportSense AI runs an autonomous 7-agent pipeline: "
        "1. ProductAgent (extracts brand/model/identity) "
        "2. CurrencyAgent (converts foreign currency to INR) "
        "3. ComplianceAgent (queries live DGFT & CBIC rules + 7 AI agents) "
        "4. DutyAgent (computes HS Code, BCD, SWS, IGST, Landed Cost) "
        "5. RiskAgent (computes 0-100 Import Intelligence Score) "
        "6. PriceComparisonAgent (searches Amazon India & Flipkart) "
        "7. RecommendationAgent (delivers final buy vs import verdict)."
    ),
}
