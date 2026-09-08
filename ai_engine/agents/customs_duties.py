from agents.agent_base import AgentBase

class CustomsDutiesAgent(AgentBase):
    agent_name = "customs_duties"
    agent_description = "Customs tariff classification, duty rates, and HS code guidance."
    primary_authority = "CBIC & ICEGATE"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        base.append("Note: Final duty is assessed by Customs at the port of entry.")
        base.append("Taxes usually include Basic Customs Duty (BCD), IGST, and Social Welfare Surcharge.")
        return base

agent = CustomsDutiesAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
