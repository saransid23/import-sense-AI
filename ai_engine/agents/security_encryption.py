from agents.agent_base import AgentBase

class SecurityEncryptionAgent(AgentBase):
    agent_name = "security_encryption"
    agent_description = "Information security and encrypted devices."
    primary_authority = "MeitY"

    def _get_recommendations(self, level: str, product_name: str) -> list[str]:
        base = super()._get_recommendations(level, product_name)
        if level in ["RESTRICTED", "PROHIBITED"]:
            base.append(f"High-strength encryption products may require prior approval from DoT/MeitY.")
            base.append("Ensure the item does not violate Indian data localization and security norms.")
        return base

agent = SecurityEncryptionAgent()
async def classify(*args, **kwargs):
    return await agent.classify(*args, **kwargs)
