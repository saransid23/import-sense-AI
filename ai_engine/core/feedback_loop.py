# ============================================================
# CORE: Feedback Loop
# Records real-world compliance outcomes and re-weights
# classifier decisions. Implements a lightweight online
# learning / reinforcement mechanism.
# ============================================================

import os
import json
import time
import hashlib
from collections import defaultdict
from typing import Literal

import structlog

logger = structlog.get_logger(__name__)

FEEDBACK_DIR = "./data/feedback"
OUTCOME_FILE = os.path.join(FEEDBACK_DIR, "outcomes.jsonl")

# ─── Outcome types ────────────────────────────────────────────
OutcomeType = Literal["approved", "rejected", "flagged", "incorrect_classification"]


class FeedbackLoop:
    """
    Lightweight feedback and reinforcement system.
    - Records outcomes (customs approval/rejection, user corrections)
    - Maintains per-class correction statistics
    - Provides a score adjustment factor for classification
    """

    def __init__(self):
        os.makedirs(FEEDBACK_DIR, exist_ok=True)
        self._stats: dict = defaultdict(lambda: {"approved": 0, "rejected": 0, "flagged": 0, "incorrect": 0})
        self._load_stats()

    def _load_stats(self):
        """Replay outcome log to rebuild in-memory stats."""
        if not os.path.exists(OUTCOME_FILE):
            return
        try:
            with open(OUTCOME_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                        agent = record.get("agent", "unknown")
                        predicted = record.get("predicted_level", "SAFE")
                        outcome = record.get("outcome", "approved")
                        key = f"{agent}:{predicted}"
                        if outcome == "incorrect_classification":
                            self._stats[key]["incorrect"] += 1
                        else:
                            self._stats[key][outcome] = self._stats[key].get(outcome, 0) + 1
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.warning("feedback.load_failed", error=str(e))

    def record_outcome(
        self,
        agent: str,
        product_name: str,
        predicted_level: str,
        outcome: OutcomeType,
        actual_level: str = None,
        notes: str = "",
    ) -> str:
        """
        Record a real-world outcome for a prediction.
        Returns a unique record ID.
        """
        record_id = hashlib.md5(f"{agent}{product_name}{time.time()}".encode()).hexdigest()[:12]
        record = {
            "id": record_id,
            "agent": agent,
            "product": product_name,
            "predicted_level": predicted_level,
            "actual_level": actual_level,
            "outcome": outcome,
            "notes": notes,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        try:
            with open(OUTCOME_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception as e:
            logger.warning("feedback.write_failed", error=str(e))

        key = f"{agent}:{predicted_level}"
        if outcome == "incorrect_classification":
            self._stats[key]["incorrect"] += 1
        else:
            self._stats[key][outcome] = self._stats[key].get(outcome, 0) + 1

        logger.info("feedback.recorded", id=record_id, agent=agent, outcome=outcome, predicted=predicted_level)
        return record_id

    def get_correction_factor(self, agent: str, predicted_level: str) -> float:
        """
        Returns a confidence adjustment factor (0.5–1.5) based on historical
        accuracy of this agent's predictions at this compliance level.
        - High incorrect rate → factor < 1.0 (reduces confidence)
        - High approved rate → factor = 1.0 (no adjustment)
        - Many rejections for SAFE/MODERATE → factor > 1.0 (raise alert)
        """
        key = f"{agent}:{predicted_level}"
        stats = self._stats.get(key, {})
        total = sum(stats.values()) if stats else 0

        if total < 5:
            return 1.0  # not enough data

        incorrect = stats.get("incorrect", 0)
        rejected = stats.get("rejected", 0)
        approved = stats.get("approved", 0)

        # Penalty for high incorrect rate
        incorrect_rate = incorrect / total
        if incorrect_rate > 0.3:
            return max(0.5, 1.0 - incorrect_rate)

        # Boost caution if SAFE/MODERATE predictions are frequently rejected at customs
        if predicted_level in ("SAFE", "MODERATE") and total > 0:
            rejection_rate = rejected / total
            if rejection_rate > 0.2:
                return min(1.5, 1.0 + rejection_rate)

        return 1.0

    def summary(self) -> dict:
        """Returns aggregated feedback statistics."""
        return {
            "total_records": sum(sum(v.values()) for v in self._stats.values()),
            "by_agent_level": {k: dict(v) for k, v in self._stats.items()},
        }


# Global singleton
_feedback_loop: FeedbackLoop = None


def get_feedback_loop() -> FeedbackLoop:
    global _feedback_loop
    if _feedback_loop is None:
        _feedback_loop = FeedbackLoop()
    return _feedback_loop
