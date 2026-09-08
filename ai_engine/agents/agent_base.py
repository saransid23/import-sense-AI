# ============================================================
# agent_base.py — Shared base class for all 7 AI agents
# All agents inherit from AgentBase for classification logic,
# confidence scoring, feedback integration, and reporting.
# ============================================================

import time
from typing import Optional
import structlog

from core.knowledge_base import get_knowledge_base
from core.feedback_loop import get_feedback_loop

logger = structlog.get_logger(__name__)

# ─── Compliance level hierarchy ───────────────────────────────
LEVELS = ["SAFE", "MODERATE", "RESTRICTED", "PROHIBITED"]
LEVEL_PRIORITY = {"SAFE": 0, "MODERATE": 1, "RESTRICTED": 2, "PROHIBITED": 3}

# ─── Semantic trigger phrases per level ──────────────────────
# These guide the AI to distinguish compliance level from matched text.
# When a retrieved chunk contains these phrases, it scores that level.
LEVEL_TRIGGERS = {
    "PROHIBITED": [
        "is prohibited", "are prohibited", "not allowed", "banned from import",
        "cannot be imported", "prohibited article", "absolute prohibition",
        "import not permitted", "shall not be imported", "strictly banned",
    ],
    "RESTRICTED": [
        "license required", "prior approval", "requires authorization",
        "restricted import", "special permission", "import license",
        "subject to conditions", "prior permission required", "conditional import",
        "requires certification", "clearance required", "noc required",
        "type approval", "equipment approval", "permit required",
    ],
    "MODERATE": [
        "certification required", "compliance required", "standards required",
        "must comply", "subject to inspection", "regulation applies",
        "registration required", "mandatory approval", "testing required",
        "applicable standard", "bis certification", "quality check",
    ],
    "SAFE": [
        "freely importable", "no restriction", "allowed for import",
        "not restricted", "permissible", "general item", "freely allowed",
        "no license required", "unrestricted",
    ],
}


def classify_from_matches(matches: list[dict]) -> dict:
    """
    Given retrieved semantic matches, determine compliance level
    by detecting level trigger phrases in matched texts.
    Returns { level, confidence, evidence }.
    """
    level_evidence = {"PROHIBITED": [], "RESTRICTED": [], "MODERATE": [], "SAFE": []}

    for match in matches:
        text_lower = match["text"].lower()
        score = match["score"]

        for level, phrases in LEVEL_TRIGGERS.items():
            for phrase in phrases:
                if phrase in text_lower:
                    level_evidence[level].append({
                        "phrase": phrase,
                        "text": match["text"][:200],
                        "source": match["source"],
                        "similarity_score": round(score, 4),
                    })
                    break  # one phrase per match per level is enough

    # Pick highest-priority level that has evidence
    chosen_level = "SAFE"
    for level in ["PROHIBITED", "RESTRICTED", "MODERATE"]:
        if level_evidence[level]:
            chosen_level = level
            break

    # Confidence: based on highest similarity score of the winning evidence
    evidence_list = level_evidence[chosen_level]
    top_score = max((e["similarity_score"] for e in evidence_list), default=0.0)

    # If no prohibitions/restrictions found but matches exist, score gives moderate confidence
    if chosen_level == "SAFE" and matches:
        top_score = max(m["score"] for m in matches[:3]) * 0.7  # dampened

    raw_confidence = min(99, int(top_score * 100))

    return {
        "level": chosen_level,
        "confidence": raw_confidence,
        "evidence": evidence_list,
        "all_evidence": {k: v for k, v in level_evidence.items() if v},
    }


class AgentBase:
    """
    Base class for all 7 compliance AI agents.
    Subclasses set: agent_name, agent_description, primary_authority.
    """

    agent_name: str = "base_agent"
    agent_description: str = "Base compliance agent"
    primary_authority: str = "Indian Government"
    version: str = "2.0.0-semantic"

    def __init__(self):
        self.kb = get_knowledge_base(self.agent_name)
        self.feedback = get_feedback_loop()

    async def ensure_knowledge(self, force_refresh: bool = False):
        """Ensure KB has data; refresh from live sources if needed."""
        if self.kb.index.index.ntotal == 0 or force_refresh:
            result = await self.kb.seed_from_live_sources(force=force_refresh)
            logger.info("agent.kb_seeded", agent=self.agent_name, result=result)

    async def classify(
        self,
        product_name: str,
        category: str = "",
        description: str = "",
        force_refresh: bool = False,
    ) -> dict:
        """
        Main classification method.
        1. Ensure knowledge base is populated
        2. Build a rich semantic query
        3. Search FAISS index
        4. Classify from matched text
        5. Apply feedback correction factor
        6. Return structured report
        """
        start = time.perf_counter()

        # Build rich query for semantic search
        query = self._build_query(product_name, category, description)

        # Ensure KB has live data
        await self.ensure_knowledge(force_refresh=force_refresh)

        kb_size = self.kb.index.index.ntotal
        using_live_data = kb_size > 0

        # Semantic search
        matches = self.kb.search(query, top_k=12, min_score=0.25) if using_live_data else []

        # Classify from matches
        if matches:
            classification = classify_from_matches(matches)
        else:
            # No KB data → default SAFE with low confidence
            classification = {"level": "SAFE", "confidence": 10, "evidence": [], "all_evidence": {}}

        # Add targeted critical rules to avoid false positives on general terms
        combined_text = f"{product_name} {category} {description}".lower()
        
        critical_override = None
        if any(w in combined_text for w in ["drone", "quadcopter", "uav"]):
            critical_override = {"level": "RESTRICTED", "reason": "Drones and UAVs require prior authorization from DGFT and WPC before import."}
        elif any(w in combined_text for w in ["medicine", "steroid", "drug", "pharmaceutical"]):
            critical_override = {"level": "RESTRICTED", "reason": "Medicines, steroids, and drugs require specific authorization and NOC from CDSCO for import into India."}
        elif "voice modulator" in combined_text:
            critical_override = {"level": "RESTRICTED", "reason": "Voice modulators require authorization due to telecom and security equipment regulations."}
        elif any(w in combined_text for w in ["spy camera", "hidden camera", "covert", "interception"]):
            critical_override = {"level": "PROHIBITED", "reason": "Covert spy equipment and interception tools are strictly prohibited from import."}

        if critical_override:
            classification["level"] = critical_override["level"]
            classification["confidence"] = 99
            classification["evidence"].insert(0, {
                "phrase": "critical strict rule",
                "text": critical_override["reason"],
                "source": "Indian Statutory Directives",
                "similarity_score": 1.0
            })

        # Apply feedback correction factor
        correction = self.feedback.get_correction_factor(self.agent_name, classification["level"])
        adjusted_confidence = min(99, int(classification["confidence"] * correction))

        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

        return self._build_report(
            product_name=product_name,
            category=category,
            query=query,
            classification=classification,
            matches=matches,
            adjusted_confidence=adjusted_confidence,
            correction_factor=correction,
            kb_size=kb_size,
            using_live_data=using_live_data,
            elapsed_ms=elapsed_ms,
        )

    def _build_query(self, product_name: str, category: str, description: str) -> str:
        """Construct a semantic query that captures regulatory context."""
        parts = [f"import regulation India {product_name}"]
        if category:
            parts.append(f"{category} import policy")
        if description:
            parts.append(description[:150])
        parts.append(f"{product_name} prohibited restricted banned allowed India customs")
        return " ".join(parts)

    def _build_report(self, **kw) -> dict:
        """Assemble the standardised agent report."""
        level = kw["classification"]["level"]
        confidence = kw["adjusted_confidence"]
        matches = kw["matches"]

        return {
            "agent": self.agent_name,
            "description": self.agent_description,
            "authority": self.primary_authority,
            "version": self.version,
            "success": True,

            # ── Core classification ──
            "compliance_level": level,
            "confidence_pct": confidence,
            "is_prohibited": level == "PROHIBITED",
            "is_restricted": level == "RESTRICTED",
            "is_moderate": level == "MODERATE",
            "is_safe": level == "SAFE",

            # ── AI reasoning ──
            "ai_reasoning": {
                "query": kw["query"],
                "evidence": kw["classification"].get("evidence", [])[:5],
                "all_evidence_by_level": kw["classification"].get("all_evidence", {}),
                "top_matches": [
                    {
                        "text": m["text"][:180],
                        "source": m["source"],
                        "similarity_score": round(m["score"], 4),
                    }
                    for m in matches[:5]
                ],
                "semantic_matches_found": len(matches),
                "correction_factor": round(kw["correction_factor"], 3),
            },

            # ── Knowledge base stats ──
            "knowledge_base": {
                "vectors_indexed": kw["kb_size"],
                "using_live_data": kw["using_live_data"],
                "self_learning_active": True,
                "last_expanded": self.kb._last_refresh,
            },

            # ── Recommendations ──
            "recommendations": self._get_recommendations(level, kw["product_name"]),

            # ── Meta ──
            "product_analyzed": kw["product_name"],
            "category": kw["category"],
            "analysis_time_ms": kw["elapsed_ms"],
            "analyzed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        """Default recommendations by level (subclasses can override)."""
        if level == "PROHIBITED":
            return [
                f"Importing {product_name} is prohibited under Indian regulations.",
                "Do not attempt to import. Legal consequences may apply.",
                "Consult a licensed customs broker or legal counsel.",
            ]
        elif level == "RESTRICTED":
            return [
                f"Obtain necessary import licenses/approvals before importing {product_name}.",
                "Contact the relevant authority for compliance guidance.",
                "Consider purchasing from certified Indian distributors.",
            ]
        elif level == "MODERATE":
            return [
                f"Verify {product_name} meets Indian standards and certifications.",
                "Engage a customs professional for compliance verification.",
            ]
        else:
            return [f"{product_name} appears importable subject to standard customs procedures."]
