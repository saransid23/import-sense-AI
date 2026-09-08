import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

def test_api(product_name, category):
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/classify', 
        data=json.dumps({"product_name": product_name, "category": category, "agent": "all"}).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        response = urllib.request.urlopen(req)
        data = json.loads(response.read())
        print(f"[{product_name}]")
        print("  Level:", data["aggregate_compliance_level"])
        for agent, agent_data in data["agents"].items():
            if agent_data.get("compliance_level") != "SAFE":
                print(f"    {agent}: {agent_data.get('compliance_level')}")
                for ev in agent_data.get("ai_reasoning", {}).get("evidence", []):
                    print(f"      - {ev['phrase']} (score {ev['similarity_score']}): {ev['text']}")
    except Exception as e:
        print(e)

test_api("cotton t-shirt", "clothing")
