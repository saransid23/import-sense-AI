from agents.agent_base import AgentBase

class ImportComplianceAgent(AgentBase):
    agent_name = "import_compliance"
    agent_description = "General import policy, prohibitions, and trade restrictions."
    primary_authority = "DGFT & CBIC"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level in ["PROHIBITED", "RESTRICTED"]:
            base.append(f"Check the ITC-HS schedule via DGFT for {product_name} exact requirements.")
            base.append("Ensure you have a valid Importer Exporter Code (IEC).")
        return base

agent = ImportComplianceAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
