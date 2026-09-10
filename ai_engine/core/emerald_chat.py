# ============================================================
# ImportSense AI — Emerald Chat Assistant
# Result-Scoped AI Chatbot grounded in analysis context,
# FAISS Knowledge Base retrieval, and the Site Glossary.
# ============================================================

import os
import json
from typing import Optional, List, Dict, Any
import structlog
from dotenv import load_dotenv

from core.site_knowledge import SITE_GLOSSARY
from core.knowledge_base import get_knowledge_base

load_dotenv()
logger = structlog.get_logger(__name__)

# Check for Google Generative AI SDK (google.genai & google.generativeai)
import asyncio
HAS_GEMINI_SDK = False
genai_new = None
genai_legacy = None

try:
    from google import genai as genai_new
    HAS_GEMINI_SDK = True
except ImportError:
    pass

try:
    import google.generativeai as genai_legacy
    HAS_GEMINI_SDK = True
except ImportError:
    pass


def build_compact_context(ctx: Dict[str, Any]) -> str:
    """Build a tight, complete, structured text summary of the current analysis result."""
    product = ctx.get("product", {})
    compliance = ctx.get("compliance", {})
    costs = ctx.get("importCosts", {})
    risk = ctx.get("risk", {})
    rec = ctx.get("recommendation", {})
    local = ctx.get("localPrices", {})

    amazon = local.get("amazonIndia", {})
    flipkart = local.get("flipkart", {})

    amazon_str = (
        f"Available at ₹{int(amazon.get('price')):,} (Match: {amazon.get('matchStatus', 'found')})"
        if (amazon.get("available") and amazon.get("price"))
        else "NOT FOUND / NOT AVAILABLE"
    )
    flipkart_str = (
        f"Available at ₹{int(flipkart.get('price')):,} (Match: {flipkart.get('matchStatus', 'found')})"
        if (flipkart.get("available") and flipkart.get("price"))
        else "NOT FOUND / NOT AVAILABLE"
    )

    lines = [
        f"PRODUCT: {product.get('name', 'Unknown Product')}",
        f"Category: {product.get('category', 'N/A')} | Origin Country: {product.get('country', 'N/A')} | Source Marketplace: {product.get('marketplace', 'N/A')}",
        f"Original Listed Price: {product.get('originalCurrency', '$')}{product.get('originalPrice', 0)} (Converted Base Price: ₹{int(costs.get('basePrice', product.get('priceInINR', 0))):,})",
        "",
        f"COMPLIANCE EVALUATION:",
        f"  - Level: `{compliance.get('complianceLevel', 'SAFE')}`",
        f"  - Summary: {compliance.get('status', {}).get('shortMsg', 'No restrictions found.')}",
    ]

    violations = compliance.get("violations", [])
    if violations:
        lines.append("  - Active Violations:")
        for v in violations:
            lines.append(f"    * [{v.get('title', 'Violation')}]: {v.get('message', v.get('description', ''))}")

    warnings = compliance.get("warnings", [])
    if warnings:
        lines.append("  - Active Warnings:")
        for w in warnings:
            lines.append(f"    * [{w.get('title', 'Warning')}]: {w.get('message', w.get('description', ''))}")

    b_price = int(costs.get("basePrice", 0))
    ship = int(costs.get("shipping", 0))
    bcd = int(costs.get("customsDuty", 0))
    sws = int(costs.get("swsAmount", 0))
    igst = int(costs.get("igst", 0))
    landed = int(costs.get("totalLandedCost", 0))

    best_local_val = local.get('bestPrice')
    best_price_str = f"₹{int(best_local_val):,}" if best_local_val else "None found"

    lines.extend([
        "",
        f"LANDED COST BREAKDOWN (IMPORT TO INDIA):",
        f"  - Base Product Price: ₹{b_price:,}",
        f"  - Freight & Shipping (CIF): ₹{ship:,}",
        f"  - Basic Customs Duty (BCD): ₹{bcd:,} ({costs.get('dutyRatePercent', 'N/A')})",
        f"  - Social Welfare Surcharge (SWS): ₹{sws:,} ({costs.get('social_welfare_surcharge', '10% of BCD')})",
        f"  - Integrated GST (IGST): ₹{igst:,} ({costs.get('igstRatePercent', 'N/A')})",
        f"  - TOTAL LANDED COST: ₹{landed:,}",
        f"  - HS Code: {costs.get('HS_code', 'N/A')} ({costs.get('hsDescription', '')})",
        "",
        f"IMPORT INTELLIGENCE & RISK SCORE:",
        f"  - Overall Score: {risk.get('importIntelligenceScore', 'N/A')}/100 ({risk.get('riskLevel', 'N/A')} Risk)",
        f"  - Sub-scores: Compliance={risk.get('scoreBreakdown', {}).get('complianceScore', 'N/A')}, Category={risk.get('scoreBreakdown', {}).get('categoryRiskScore', 'N/A')}, Price={risk.get('scoreBreakdown', {}).get('priceRiskScore', 'N/A')}, Country={risk.get('scoreBreakdown', {}).get('countryOriginScore', 'N/A')}",
        f"  - Risk Reason: {risk.get('explanation', 'N/A')}",
        "",
        f"INDIAN LOCAL MARKETPLACE PRICE COMPARISON:",
        f"  - Match Quality: {local.get('matchQuality', 'N/A')}",
        f"  - Best Local Price Found: {best_price_str}",
        f"  - Amazon India: {amazon_str}",
        f"  - Flipkart: {flipkart_str}",
        "",
        f"FINAL VERDICT & RECOMMENDATION:",
        f"  - Action: {rec.get('recommendation', 'N/A')}",
        f"  - Rationale: {rec.get('reason', 'N/A')}",
        f"  - Savings Analysis: {rec.get('savingsText', 'N/A')}",
    ])

    return "\n".join(lines)


def generate_templated_fallback(question: str, ctx: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Grounded fallback engine used when no Gemini API key is configured.
    Performs specific intent recognition & mathematical reasoning over real analysis data.
    Outputs clean plain text without markdown syntax.
    """
    q_lower = question.lower().strip()
    product_name = ctx.get("product", {}).get("name", "this product")
    compliance = ctx.get("compliance", {})
    costs = ctx.get("importCosts", {})
    risk = ctx.get("risk", {})
    rec = ctx.get("recommendation", {})
    local = ctx.get("localPrices", {})

    amazon = local.get("amazonIndia", {})
    flipkart = local.get("flipkart", {})

    b_price = int(costs.get("basePrice", 0))
    ship = int(costs.get("shipping", 0))
    bcd = int(costs.get("customsDuty", 0))
    sws = int(costs.get("swsAmount", 0))
    igst = int(costs.get("igst", 0))
    landed = int(costs.get("totalLandedCost", 0))

    amazon_price = int(amazon.get("price")) if (amazon.get("available") and amazon.get("price")) else None
    flipkart_price = int(flipkart.get("price")) if (flipkart.get("available") and flipkart.get("price")) else None
    best_local = int(local.get("bestPrice")) if local.get("bestPrice") else None

    sources_used = ["Import Analysis Context"]

    # 0. Conversational Greetings & Small Talk
    clean_q = "".join([c for c in q_lower if c.isalnum() or c.isspace()]).strip()
    greetings = ["hi", "hello", "hey", "hlo", "hy", "hola", "namaste", "good morning", "good afternoon", "good evening", "who are you", "what can you do", "help", "how are you", "who r u", "what is your name"]
    
    if clean_q in greetings or any(clean_q.startswith(g + " ") for g in ["hi", "hello", "hey", "good morning", "good evening", "hlo"]):
        sources_used.append("Emerald Conversational AI")
        p_name = f"for {product_name}" if product_name and product_name != "this product" else "for your product"
        return {
            "answer": f"Hello! I'm Emerald, your AI import colleague. I've analyzed the compliance, customs duties, and local price comparisons {p_name}. How can I help you today? Ask me about cheapest buying options, duty breakdowns, risk factors, or quantity scaling!",
            "sources_used": sources_used,
            "llm_available": False,
            "out_of_scope": False,
        }

    # Thanks & Polite Closings
    thanks_phrases = ["thank you", "thanks", "thank u", "thx", "great", "awesome", "perfect", "got it", "bye", "goodbye", "ok", "okay"]
    if clean_q in thanks_phrases or any(clean_q.startswith(t + " ") for t in ["thanks", "thank you"]):
        sources_used.append("Emerald Conversational AI")
        p_name = f"for {product_name}" if product_name and product_name != "this product" else "for your product"
        return {
            "answer": f"You're very welcome! Let me know whenever you need more import calculations or compliance checks {p_name}.",
            "sources_used": sources_used,
            "llm_available": False,
            "out_of_scope": False,
        }

    # 1. Glossary term lookups (direct terminology definitions)
    for term, definition in SITE_GLOSSARY.items():
        t_low = term.lower()
        is_def_query = (
            any(k in q_lower for k in ["what is", "define", "meaning", "definition", "stand for", "explain"])
            or q_lower == t_low
            or q_lower == f"what is {t_low}"
            or q_lower == f"what is {t_low}?"
        )
        # Check term matches
        term_matched = (
            (t_low in q_lower and len(t_low) >= 3)
            or (term == "CIF" and "cif" in q_lower)
            or (term == "BCD" and "bcd" in q_lower)
            or (term == "IGST" and "igst" in q_lower)
            or (term == "SWS" and "sws" in q_lower)
            or (term == "DGFT" and "dgft" in q_lower)
            or (term == "CBIC" and "cbic" in q_lower)
            or (term == "ICEGATE" and "icegate" in q_lower)
            or (term == "HS Code" and "hs code" in q_lower)
        )
        if is_def_query and term_matched and not any(rk in q_lower for rk in ["why is", "risk factor", "my score", "this product"]):
            sources_used.append("Site Knowledge Base")
            # Return clean plain text definition without asterisks
            clean_def = definition.replace("**", "").replace("*", "").replace("`", "")
            return {
                "answer": f"{term}: {clean_def}",
                "sources_used": sources_used,
                "llm_available": False,
                "out_of_scope": False,
            }

    # 2. Risk factors & Intelligence Score questions
    if any(k in q_lower for k in ["risk factor", "risk score", "risk breakdown", "what are the risk", "what is the risk", "risk level", "intelligence score", "how risky"]):
        sources_used.append("Import Intelligence Risk Engine")
        score = risk.get("importIntelligenceScore", "N/A")
        risk_lvl = risk.get("riskLevel", "N/A")
        sb = risk.get("scoreBreakdown", {})
        explanation = risk.get("explanation", "Standard import assessment.")
        answer = (
            f"The Import Intelligence Score for {product_name} is {score}/100 ({risk_lvl} Risk). "
            f"Key risk factors evaluated: Compliance Score {sb.get('complianceScore', 'N/A')}/100, "
            f"Category Inspection Risk {sb.get('categoryRiskScore', 'N/A')}/100, "
            f"Price Valuation Risk {sb.get('priceRiskScore', 'N/A')}/100, "
            f"and Country of Origin Risk {sb.get('countryOriginScore', 'N/A')}/100. "
            f"Overall risk assessment: {explanation}"
        )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 3. "Where's it cheapest?" / Platform price comparison
    if any(k in q_lower for k in ["cheapest", "where to buy", "where can i get", "best price", "amazon vs flipkart", "cheaper", "which platform"]):
        sources_used.append("Marketplace Price Comparison Engine")
        
        found_sources = []
        if amazon_price:
            found_sources.append(("Amazon India", amazon_price))
        if flipkart_price:
            found_sources.append(("Flipkart", flipkart_price))
        
        if found_sources:
            found_sources.sort(key=lambda x: x[1])
            cheapest_local_name, cheapest_local_price = found_sources[0]
            
            missing_text = ""
            if not amazon_price:
                missing_text = " I couldn't find a matching listing on Amazon India to compare."
            elif not flipkart_price:
                missing_text = " I couldn't find a matching listing on Flipkart to compare."

            if landed > 0 and cheapest_local_price < landed:
                diff = landed - cheapest_local_price
                answer = (
                    f"{cheapest_local_name} has it for ₹{cheapest_local_price:,} — that's your cheapest option by a good margin, "
                    f"and ₹{diff:,} less than importing it yourself (₹{landed:,} landed).{missing_text} "
                    f"Unless you have a specific reason to import — a variant or color not sold locally, for instance — buying from {cheapest_local_name} is the clear move here."
                )
            elif landed > 0 and cheapest_local_price >= landed:
                diff = cheapest_local_price - landed
                answer = (
                    f"Importing it yourself at ₹{landed:,} total landed cost is your cheapest option — saving you ₹{diff:,} "
                    f"compared to buying locally on {cheapest_local_name} (₹{cheapest_local_price:,}).{missing_text} "
                    f"If you don't mind customs delivery timelines, importing offers the best financial value."
                )
            else:
                answer = (
                    f"{cheapest_local_name} has it for ₹{cheapest_local_price:,}.{missing_text} "
                    f"Buying locally gives you immediate delivery and standard domestic warranty."
                )
        else:
            if landed > 0:
                answer = (
                    f"Importing it yourself at ₹{landed:,} total landed cost is your primary confirmed option. "
                    f"I couldn't find matching active listings on Amazon India or Flipkart for this exact product."
                )
            else:
                answer = "No price comparison data was found for this product locally or for import."

        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 4. Missing platform check (e.g., "What about eBay?", "Is it on AliExpress?")
    other_platforms = ["ebay", "aliexpress", "walmart", "bestbuy", "croma", "reliance", "tata cliq", "tatacliq", "target"]
    for p in other_platforms:
        if p in q_lower:
            sources_used.append("Marketplace Scope Audit")
            cheapest_ref = f"Amazon India at ₹{amazon_price:,}" if amazon_price else (f"importing at ₹{landed:,} landed" if landed else "local retail")
            return {
                "answer": f"I only checked Amazon India and Flipkart for this analysis, so I don't have {p.capitalize()} price data to compare — you'd want to check that one manually. Based on what I do have, {cheapest_ref} is your best confirmed option.",
                "sources_used": sources_used,
                "llm_available": False,
                "out_of_scope": False,
            }

    # 5. Multiples / Quantity scaling ("What if I bought 2?", "If I buy 5")
    import re
    qty_match = re.search(r'\b(bought|buy|get|order)\s+(\d+)\b|\b(\d+)\s+(units|pieces|items|of these)\b', q_lower)
    if qty_match or "quantity" in q_lower or "bought 2" in q_lower or "buy 2" in q_lower:
        qty = 2
        if qty_match:
            nums = [int(g) for g in qty_match.groups() if g and g.isdigit()]
            if nums:
                qty = nums[0]

        sources_used.append("Cost Scaling Simulator")
        base_scaled = b_price * qty
        landed_scaled = landed * qty
        answer = (
            f"If you import {qty} units of {product_name}, your estimated base product cost would be ₹{base_scaled:,} "
            f"and total landed cost (including {qty}x shipping, BCD duty, SWS, and IGST) would be approximately ₹{landed_scaled:,}. "
            f"Note: Importing multiple identical units in a single shipment may attract higher customs scrutiny if deemed commercial quantity by ICEGATE officers."
        )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 6. Local availability ("Can I buy this in India?", "Is it available in India?")
    if any(k in q_lower for k in ["buy this in india", "available in india", "buy in india", "sold in india", "purchase in india"]):
        sources_used.append("Indian Retail Availability Check")
        if best_local and amazon_price:
            answer = (
                f"Yes, you can buy {product_name} directly in India. Amazon India has it listed for ₹{amazon_price:,}. "
                f"Unless you specifically need an overseas variant, buying locally in India avoids international shipping waits and customs clearance."
            )
        elif best_local and flipkart_price:
            answer = (
                f"Yes, {product_name} is available in India on Flipkart for ₹{flipkart_price:,}. "
                f"Purchasing locally ensures standard domestic warranty and hassle-free returns."
            )
        else:
            answer = (
                f"No matching active listings were found on Amazon India or Flipkart for {product_name}. "
                f"Importing it (total landed cost ₹{landed:,}) is currently your main route to acquire it."
            )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 7. "What do these numbers mean?" / Score breakdown explanation
    if any(k in q_lower for k in ["numbers mean", "explain numbers", "explain score", "score breakdown", "rating mean"]):
        sources_used.append("Import Intelligence Score Explainer")
        score = risk.get("importIntelligenceScore", "N/A")
        risk_lvl = risk.get("riskLevel", "N/A")
        sb = risk.get("scoreBreakdown", {})
        answer = (
            f"Here is what your analysis numbers represent: Import Intelligence Score {score}/100 ({risk_lvl} Risk) "
            f"with Compliance {sb.get('complianceScore', 'N/A')}/100, Category Inspection {sb.get('categoryRiskScore', 'N/A')}/100, "
            f"Price Risk {sb.get('priceRiskScore', 'N/A')}/100, and Country Origin Risk {sb.get('countryOriginScore', 'N/A')}/100. "
            f"Total Landed Cost of ₹{landed:,} includes Base Price ₹{b_price:,}, Shipping ₹{ship:,}, "
            f"BCD {costs.get('dutyRatePercent', 'N/A')} (₹{bcd:,}), SWS (₹{sws:,}), and IGST {costs.get('igstRatePercent', 'N/A')} (₹{igst:,})."
        )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 8. "Why is compliance SAFE / RESTRICTED?"
    if any(k in q_lower for k in ["why is", "why compliance", "why safe", "why restricted", "why prohibited"]):
        sources_used.append("Customs Policy Evaluator")
        level = compliance.get("complianceLevel", "SAFE")
        violations = compliance.get("violations", [])
        warnings = compliance.get("warnings", [])
        
        if level == "SAFE":
            answer = (
                f"The compliance level for {product_name} is SAFE because our agents found no special DGFT import bans, "
                f"mandatory WPC or BIS licensing blocks, or restricted tariff codes under HS Code {costs.get('HS_code', 'N/A')}. "
                f"It can be imported into India under standard customs declarations."
            )
        else:
            issues = violations + warnings
            issue_lines = " ".join([f"{i.get('title')}: {i.get('message', i.get('description'))}." for i in issues])
            answer = (
                f"The compliance level for {product_name} is {level} due to the following regulatory findings: {issue_lines} "
                f"Recommendation: {compliance.get('complianceRecommendation', 'Verify license requirements before purchasing.')}"
            )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 9. Duty & Tax breakdown
    if any(k in q_lower for k in ["duty", "tariff", "tax", "bcd", "igst", "sws", "cost breakdown"]):
        sources_used.append("CBIC Tariff & Duty Engine")
        answer = (
            f"Here is the exact duty and tax breakdown for importing {product_name}: Base Price ₹{b_price:,}, "
            f"Shipping ₹{ship:,}, Basic Customs Duty BCD {costs.get('dutyRatePercent', 'N/A')} (₹{bcd:,}), "
            f"Social Welfare Surcharge SWS 10% (₹{sws:,}), Integrated GST IGST {costs.get('igstRatePercent', 'N/A')} (₹{igst:,}), "
            f"bringing Total Landed Cost to ₹{landed:,} under HS Code {costs.get('HS_code', 'N/A')}."
        )
        return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}

    # 10. General default fallback (Direct concise answer, plain text, no generic bullet dumps)
    sources_used.append("ImportSense Context Engine")
    best_price_str = f"₹{best_local:,}" if best_local else "Not listed locally"
    answer = (
        f"For {product_name}, the total landed import cost is ₹{landed:,} (including duties & IGST) "
        f"with a compliance rating of {compliance.get('complianceLevel', 'SAFE')} and Intelligence Score of {risk.get('importIntelligenceScore', 'N/A')}/100. "
        f"Best local price found: {best_price_str}. Ask me specific questions about cheapest buying options, risk factors, quantity scaling, duty breakdowns, or compliance rules."
    )
    return {"answer": answer, "sources_used": sources_used, "llm_available": False, "out_of_scope": False}


async def answer(question: str, analysis_context: Dict[str, Any], history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Main Emerald Chat entry point.
    Uses Google Gemini Flash if GEMINI_API_KEY is available,
    otherwise falls back to the grounded deterministic reasoning engine.
    """
    if history is None:
        history = []

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    # Check for missing, empty, or default placeholder API key
    if not api_key or not HAS_GEMINI_SDK or api_key in ["your-key-here", "your_key_here", "your_gemini_api_key_here", "your_anthropic_api_key_here"]:
        logger.info("emerald.basic_mode", reason="No valid GEMINI_API_KEY or SDK unavailable")
        return generate_templated_fallback(question, analysis_context, history)

    try:
        compact_context = build_compact_context(analysis_context)

        sources_used = ["Import Analysis Context"]
        kb_text = ""

        # Perform semantic retrieval for non-trivial questions
        try:
            kb = get_knowledge_base("import_compliance")
            matches = kb.search(question, top_k=3, min_score=0.25)
            if matches:
                kb_chunks = []
                for m in matches:
                    src_name = m.get("source", "Government Policy")
                    kb_chunks.append(f"[{src_name}]: {m.get('text', '')}")
                    if src_name not in sources_used:
                        sources_used.append(src_name)
                kb_text = "\n\nRETRIEVED GOVERNMENT REGULATORY TEXTS:\n" + "\n".join(kb_chunks)
        except Exception as kb_err:
            logger.warning("emerald.kb_search_error", error=str(kb_err))

        glossary_formatted = "\n".join([f"- {k}: {v}" for k, v in SITE_GLOSSARY.items()])

        system_prompt = (
            "You are Emerald, an expert AI import compliance & customs tariff colleague for India.\n"
            "Your personality is direct, conversational, concise, professional, and knowledgeable.\n\n"
            "SYSTEM INSTRUCTIONS & GROUNDED REASONING RULES:\n"
            "1. PLAIN TEXT ONLY: Respond strictly in plain conversational text. Do NOT use markdown formatting — no asterisks (** or *), no markdown headers (#), no backticks (`), and no bullet symbols (- or •). Write naturally in plain English with standard punctuation.\n"
            "2. DIRECT ANSWER FIRST: Lead with your actual direct answer in the very first sentence. Do not restate overview summaries unless requested.\n"
            "3. GROUNDED DATA ONLY: Use strictly the provided Product Analysis Context, Local Marketplace Pricing, and Site Glossary below. Never invent duty rates or prices.\n"
            "4. CHEAPEST / PLATFORM COMPARISON:\n"
            "   When asked which platform or source is cheapest, or where to buy from, compare Amazon India (amazonIndia), Flipkart (flipkart), and the import option (totalLandedCost).\n"
            "   Only include a source if it was actually found with a real price. State the cheapest option by name and price, note the runner-up, and state if a platform wasn't found.\n"
            "5. MISSING DATA / UNCHECKED PLATFORMS:\n"
            "   If asked about a marketplace not checked (e.g. eBay, AliExpress), state plainly: 'I only checked Amazon India and Flipkart for this analysis, so I don't have [Platform] data — you'd want to check that one manually.'\n"
            "6. QUANTITY SCALING ('What if I bought 2?'):\n"
            "   Compute or estimate scaled base prices and 2x/Nx total landed costs (including duties), and note customs scrutiny on bulk quantities.\n"
            "7. SCORES & RISK FACTORS ('What is the risk factors?', 'What do these numbers mean?'):\n"
            "   Explain the specific intelligence score breakdown (compliance, category, price, country) or actual compliance findings from context. Do NOT re-dump generic overviews.\n"
            "8. GLOSSARY QUESTIONS ('What is DGFT?', 'What is BCD?'):\n"
            "   Provide a clear plain text explanation of what the term stands for and its role in Indian import policy.\n"
            "9. FORMATTING:\n"
            "   Format duty percentages clearly (e.g. BCD 10%, IGST 18%). Format currency in whole rupees (e.g. ₹20,990). Never print internal signatures or engine names.\n\n"
            "FEW-SHOT EXAMPLES:\n"
            "Q: 'what is dgft'\n"
            "A: 'DGFT stands for Directorate General of Foreign Trade — the Indian government body under the Ministry of Commerce and Industry that sets import and export policy, including which products are restricted, licensed, or freely importable. That is the live source I check for compliance verdicts on this site.'\n\n"
            "Q: 'where can i get this the cheapest'\n"
            "A: 'Amazon India has it for ₹20,990 — that is your cheapest option by a good margin, and ₹9,045 less than importing it yourself (₹30,035 landed). I could not find a matching listing on Flipkart to compare. Unless you have a specific reason to import — a variant or color not sold locally, for instance — buying from Amazon India is the clear move here.'\n\n"
            "Q: 'what about eBay'\n"
            "A: 'I only checked Amazon India and Flipkart for this analysis, so I do not have an eBay price to compare — you would want to check that one manually. Based on what I do have, Amazon India at ₹20,990 is your best confirmed option.'\n\n"
            f"SITE GLOSSARY & APP TERMINOLOGY:\n{glossary_formatted}\n\n"
            f"CURRENT PRODUCT ANALYSIS CONTEXT:\n{compact_context}"
            f"{kb_text}"
        )

        history_str = ""
        if history:
            history_lines = []
            for msg in history[-6:]:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_lines.append(f"{role}: {msg.get('content', '')}")
            history_str = "RECENT CONVERSATION HISTORY:\n" + "\n".join(history_lines) + "\n\n"

        prompt_context = f"{history_str}USER QUESTION: {question}"

        answer_text = None

        # Attempt 1: Try new google.genai SDK
        if genai_new is not None:
            try:
                client = genai_new.Client(api_key=api_key)
                for m_name in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]:
                    try:
                        res = client.models.generate_content(
                            model=m_name,
                            contents=prompt_context,
                            config={"system_instruction": system_prompt, "max_output_tokens": 500}
                        )
                        if res and res.text:
                            answer_text = res.text.strip()
                            logger.info("emerald.llm_success", sdk="google.genai", model=m_name)
                            break
                    except Exception as err_m:
                        logger.warning("emerald.genai_model_err", model=m_name, error=str(err_m))
                        continue
            except Exception as sdk_err:
                logger.warning("emerald.genai_sdk_err", error=str(sdk_err))

        # Attempt 2: Try legacy google.generativeai SDK if new SDK failed
        if not answer_text and genai_legacy is not None:
            try:
                genai_legacy.configure(api_key=api_key)
                for m_name in ["gemini-2.5-flash", "gemini-1.5-flash-latest"]:
                    try:
                        model = genai_legacy.GenerativeModel(
                            model_name=m_name,
                            system_instruction=system_prompt,
                            generation_config={"max_output_tokens": 500}
                        )
                        response = model.generate_content(prompt_context)
                        if response and response.text:
                            answer_text = response.text.strip()
                            logger.info("emerald.llm_success", sdk="google.generativeai", model=m_name)
                            break
                    except Exception as leg_err:
                        logger.warning("emerald.legacy_model_err", model=m_name, error=str(leg_err))
                        break
            except Exception as leg_sdk_err:
                logger.warning("emerald.legacy_sdk_err", error=str(leg_sdk_err))

        if answer_text:
            return {
                "answer": answer_text,
                "sources_used": sources_used,
                "llm_available": True,
                "out_of_scope": False,
            }
        else:
            logger.info("emerald.llm_fallback_trigger", reason="LLM API call completed via Conversational Engine")
            fallback_res = generate_templated_fallback(question, analysis_context, history)
            fallback_res["llm_available"] = False
            return fallback_res

    except Exception as err:
        logger.error("emerald.llm_error", error=str(err))
        fallback_res = generate_templated_fallback(question, analysis_context, history)
        fallback_res["llm_available"] = False
        return fallback_res

