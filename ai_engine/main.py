# ============================================================
# ImportSense AI — Self-Learning Compliance Engine
# FastAPI Server exposing the 7 AI agents
# ============================================================

import asyncio
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import structlog

from core.knowledge_base import warm_all_knowledge_bases
from core.feedback_loop import get_feedback_loop

# Import all 7 agents
from agents import (
    import_compliance,
    customs_duties,
    health_drugs,
    electronics_telecom,
    environmental_ewaste,
    security_encryption,
    surveillance_spy,
)

logger = structlog.get_logger(__name__)

# ─── App Lifespan (Startup / Shutdown) ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("api.startup", msg="Starting Self-Learning Compliance Engine")
    # Trigger background seeding of all knowledge bases
    asyncio.create_task(warm_all_knowledge_bases())
    yield
    logger.info("api.shutdown", msg="Shutting down")


app = FastAPI(
    title="ImportSense AI — Self-Learning Compliance Engine",
    version="2.0.0",
    lifespan=lifespan,
)

# ─── Request / Response Models ────────────────────────────────
class ClassifyRequest(BaseModel):
    product_name: str
    category: Optional[str] = ""
    description: Optional[str] = ""
    agent: Optional[str] = "all"        # "all" or specific agent name
    force_refresh: Optional[bool] = False

class FeedbackRequest(BaseModel):
    agent: str
    product_name: str
    predicted_level: str
    outcome: str                        # approved, rejected, flagged, incorrect_classification
    actual_level: Optional[str] = None
    notes: Optional[str] = ""


# ─── Endpoints ────────────────────────────────────────────────

ALL_AGENTS = {
    "import_compliance": import_compliance.agent,
    "customs_duties": customs_duties.agent,
    "health_drugs": health_drugs.agent,
    "electronics_telecom": electronics_telecom.agent,
    "environmental_ewaste": environmental_ewaste.agent,
    "security_encryption": security_encryption.agent,
    "surveillance_spy": surveillance_spy.agent,
}

@app.post("/api/v1/classify")
async def classify_product(req: ClassifyRequest):
    """
    Run semantic classification on a product.
    If agent="all", runs all 7 agents concurrently.
    """
    start = time.perf_counter()

    target_agents = list(ALL_AGENTS.values()) if req.agent == "all" else [ALL_AGENTS.get(req.agent)]
    if not target_agents[0]:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {req.agent}")

    tasks = [
        agent.classify(
            product_name=req.product_name,
            category=req.category,
            description=req.description,
            force_refresh=req.force_refresh,
        )
        for agent in target_agents
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle exceptions in individual agents
    final_results = {}
    aggregate_level = "SAFE"
    level_priority = {"SAFE": 0, "MODERATE": 1, "RESTRICTED": 2, "PROHIBITED": 3}

    for agent_obj, res in zip(target_agents, results):
        if isinstance(res, Exception):
            logger.error("api.agent_error", agent=agent_obj.agent_name, error=str(res))
            final_results[agent_obj.agent_name] = {"success": False, "error": str(res)}
        else:
            final_results[agent_obj.agent_name] = res
            # Determine overall aggregate safety level
            res_level = res.get("compliance_level", "SAFE")
            if level_priority[res_level] > level_priority[aggregate_level]:
                aggregate_level = res_level

    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

    return {
        "success": True,
        "product_analyzed": req.product_name,
        "aggregate_compliance_level": aggregate_level,
        "total_analysis_time_ms": elapsed_ms,
        "agents": final_results,
    }

@app.post("/api/v1/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    Record real-world outcomes into the reinforcement loop.
    This continuous learning phase adjusts agent confidence.
    """
    if req.agent not in ALL_AGENTS and req.agent != "overall":
        raise HTTPException(status_code=400, detail="Unknown agent")

    fb = get_feedback_loop()
    record_id = fb.record_outcome(
        agent=req.agent,
        product_name=req.product_name,
        predicted_level=req.predicted_level,
        outcome=req.outcome,
        actual_level=req.actual_level,
        notes=req.notes,
    )
    return {"success": True, "record_id": record_id}

@app.get("/api/v1/stats")
def get_stats():
    """Return health & knowledge base stats for all agents."""
    stats = {}
    for name, agent in ALL_AGENTS.items():
        stats[name] = agent.kb.stats()
    
    return {
        "success": True,
        "knowledge_bases": stats,
        "feedback_loop": get_feedback_loop().summary(),
    }
