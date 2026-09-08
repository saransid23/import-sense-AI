# ============================================================
# CORE: Knowledge Base
# High-level API wrapping FAISSIndex + scraper + pdf_ingester.
# Each agent gets its own knowledge base that self-expands
# by scraping live sources and ingesting PDFs.
# ============================================================

import asyncio
import time
from typing import Optional

import structlog

from core.embeddings import FAISSIndex
from core.scraper import scrape_source, scrape_multiple, extract_text_blocks
from core.pdf_ingester import ingest_pdf_list

logger = structlog.get_logger(__name__)

# ─── Agent → Source mapping ───────────────────────────────────
AGENT_SOURCES = {
    "import_compliance": {
        "sources": ["DGFT", "CBIC", "ICEGATE"],
        "source_pages": {"DGFT": "notifications", "CBIC": "notifications", "ICEGATE": "tariff"},
        "compliance_terms": ["prohibited", "restricted", "banned", "scomet", "license required", "import policy", "not allowed", "restricted article"],
    },
    "customs_duties": {
        "sources": ["CBIC", "ICEGATE"],
        "source_pages": {"CBIC": "tariff", "ICEGATE": "tariff"},
        "compliance_terms": ["customs duty", "basic customs duty", "igst", "tariff", "surcharge", "HS code", "classification"],
    },
    "health_drugs": {
        "sources": ["CDSCO", "FSSAI"],
        "source_pages": {"CDSCO": "drugs", "FSSAI": "imports"},
        "compliance_terms": ["prescription", "prohibited drug", "controlled substance", "noc required", "clinical trial", "fssai approval", "drug import"],
    },
    "electronics_telecom": {
        "sources": ["DoT", "WPC"],
        "source_pages": {"DoT": "licensing", "WPC": "approvals"},
        "compliance_terms": ["wpc approval", "equipment type approval", "restricted", "spectrum", "telecom license", "wireless", "dot authorization"],
    },
    "environmental_ewaste": {
        "sources": ["MNRE", "CPCB", "BIS"],
        "source_pages": {"MNRE": "notifications", "CPCB": "ewaste", "BIS": "crs"},
        "compliance_terms": ["e-waste", "cpcb authorization", "extended producer responsibility", "solar energy", "bis certification", "hazardous waste", "battery waste"],
    },
    "security_encryption": {
        "sources": ["MeitY"],
        "source_pages": {"MeitY": "notifications"},
        "compliance_terms": ["encryption", "import authorization", "meity clearance", "security device", "it act", "data security", "crypto"],
    },
    "surveillance_spy": {
        "sources": ["DoT", "MeitY"],
        "source_pages": {"DoT": "circulars", "MeitY": "it_act"},
        "compliance_terms": ["surveillance", "interception", "spy equipment", "hidden camera", "covert", "telegraph act", "eavesdropping", "keylogger"],
    },
}


class KnowledgeBase:
    """
    Per-agent knowledge base. Auto-ingests from live government sources.
    Wraps FAISSIndex for semantic search.
    """

    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.index = FAISSIndex(agent_name)
        self.config = AGENT_SOURCES.get(agent_name, {})
        self._last_refresh: Optional[float] = None
        self._refresh_interval = float(3600)  # 1 hour

    # ── seeding ───────────────────────────────────────────────

    async def seed_from_live_sources(self, force: bool = False) -> dict:
        """
        Scrape the configured government sources and add text chunks to the index.
        Respects refresh interval unless force=True.
        """
        now = time.time()
        if not force and self._last_refresh and (now - self._last_refresh) < self._refresh_interval:
            return {
                "agent": self.agent_name,
                "skipped": True,
                "reason": "Recently refreshed",
                "vectors": self.index.index.ntotal,
            }

        source_keys = self.config.get("sources", [])
        page_map = self.config.get("source_pages", {})

        results = []
        total_added = 0

        # Scrape HTML pages
        for source_key in source_keys:
            page_key = page_map.get(source_key, "notifications")
            result = await scrape_source(source_key, page_key)
            results.append(result)
            if result.get("success"):
                blocks = result.get("text_blocks", [])
                added = self.index.add(blocks, source=f"{source_key}:{page_key}")
                total_added += added
                logger.info("kb.ingested_html", agent=self.agent_name, source=source_key, blocks=len(blocks), added=added)

                # Also ingest discovered PDFs
                pdf_links = result.get("pdf_links", [])
                if pdf_links:
                    pdf_data_list = await ingest_pdf_list([
                        {**lnk, "source": source_key} for lnk in pdf_links[:5]
                    ])
                    for pdf_data in pdf_data_list:
                        if pdf_data.get("success"):
                            pdf_added = self.index.add(
                                pdf_data["chunks"],
                                source=f"{source_key}:pdf",
                                metadata={"url": pdf_data["url"], **pdf_data.get("metadata", {})},
                            )
                            total_added += pdf_added

        self._last_refresh = now

        return {
            "agent": self.agent_name,
            "sources_scraped": len(source_keys),
            "total_added": total_added,
            "vectors_total": self.index.index.ntotal,
            "source_results": [{"source": r.get("source"), "success": r.get("success"), "blocks": r.get("block_count", 0)} for r in results],
        }

    def add_manual(self, texts: list[str], source: str = "manual"):
        """Add manually provided regulatory text to the knowledge base."""
        return self.index.add(texts, source=source)

    # ── querying ─────────────────────────────────────────────

    def search(self, query: str, top_k: int = 10, min_score: float = 0.28) -> list[dict]:
        """Semantic search across the knowledge base."""
        return self.index.search(query, top_k=top_k, min_score=min_score)

    def stats(self) -> dict:
        return {
            **self.index.stats(),
            "last_refresh": self._last_refresh,
            "refresh_interval_s": self._refresh_interval,
            "configured_sources": self.config.get("sources", []),
        }


# ─── Global registry of knowledge bases (one per agent) ──────
_kb_registry: dict[str, KnowledgeBase] = {}


def get_knowledge_base(agent_name: str) -> KnowledgeBase:
    """Get or create the KnowledgeBase for an agent."""
    if agent_name not in _kb_registry:
        _kb_registry[agent_name] = KnowledgeBase(agent_name)
    return _kb_registry[agent_name]


async def warm_all_knowledge_bases():
    """
    Called at startup: background-seed all 7 agent KBs from live sources.
    Run without awaiting results so the server starts immediately.
    """
    logger.info("kb.warming_all")
    tasks = [get_knowledge_base(name).seed_from_live_sources() for name in AGENT_SOURCES]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for name, result in zip(AGENT_SOURCES.keys(), results):
        if isinstance(result, Exception):
            logger.warning("kb.warm_failed", agent=name, error=str(result))
        else:
            logger.info("kb.warm_done", agent=name, added=result.get("total_added", 0))
