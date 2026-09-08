from agents.agent_base import AgentBase

class SurveillanceSpyAgent(AgentBase):
    agent_name = "surveillance_spy"
    agent_description = "Surveillance, interception, and spy equipment."
    primary_authority = "DoT & IT Act"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level in ["RESTRICTED", "PROHIBITED"]:
            base.append(f"Importing covert spy equipment or interception tools is heavily restricted or illegal.")
            base.append("Strictly intended for authorized Government/Law Enforcement agencies only.")
        return base

agent = SurveillanceSpyAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
