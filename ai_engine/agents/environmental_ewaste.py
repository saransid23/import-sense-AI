from agents.agent_base import AgentBase

class EnvironmentalEwasteAgent(AgentBase):
    agent_name = "environmental_ewaste"
    agent_description = "E-waste, renewable energy, and BIS safety standards."
    primary_authority = "CPCB, MNRE & BIS"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level in ["RESTRICTED", "MODERATE"]:
            base.append(f"Ensure {product_name} complies with BIS Compulsory Registration Scheme (CRS).")
            base.append("Check Extended Producer Responsibility (EPR) requirements for e-waste.")
        return base

agent = EnvironmentalEwasteAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
