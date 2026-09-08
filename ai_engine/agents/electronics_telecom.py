from agents.agent_base import AgentBase

class ElectronicsTelecomAgent(AgentBase):
    agent_name = "electronics_telecom"
    agent_description = "Wireless, radio, and telecom equipment compliance."
    primary_authority = "WPC & DoT"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level in ["RESTRICTED", "MODERATE"]:
            base.append(f"Verify if {product_name} requires WPC Equipment Type Approval (ETA).")
            base.append("Check if the operating frequency falls within de-licensed bands in India.")
        return base

agent = ElectronicsTelecomAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
