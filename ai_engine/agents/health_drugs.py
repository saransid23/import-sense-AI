from agents.agent_base import AgentBase

class HealthDrugsAgent(AgentBase):
    agent_name = "health_drugs"
    agent_description = "Medical devices, drugs, and food safety compliance."
    primary_authority = "CDSCO & FSSAI"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level == "RESTRICTED":
            base.append(f"Importing {product_name} requires a No Objection Certificate (NOC) from CDSCO or FSSAI.")
            base.append("Ensure the manufacturer is registered with Indian health authorities.")
        return base

agent = HealthDrugsAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
