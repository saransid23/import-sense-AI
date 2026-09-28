<div align="center">

# 🛃 ImportSense AI

### Self-Learning Compliance Engine

<img src="https://readme-typing-svg.demolab.com/?lines=Fetch+laws.+Learn+outcomes.;Classify+imports+without+hardcoded+rules.&amp;center=true&amp;width=520&amp;height=35&amp;color=E8664A&amp;vCenter=true&amp;size=18" />

<img src="https://img.shields.io/badge/agents-7-E8664A?style=flat-square" />
<img src="https://img.shields.io/badge/sources-10_gov_authorities-5FA83C?style=flat-square" />
<img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&amp;logo=python&amp;logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&amp;logo=fastapi&amp;logoColor=white" />
<img src="https://img.shields.io/badge/FAISS-0467DF?style=flat-square&amp;logo=meta&amp;logoColor=white" />

</div>

<br>

A fully autonomous, self-learning regulatory compliance engine built in Python. Seven AI agents dynamically fetch laws, circulars and notifications from 10 Indian government authorities (DGFT, CBIC, ICEGATE, CDSCO, WPC and more). It uses semantic NLP (sentence-transformers) and FAISS vector databases to classify imports without hardcoded rules.

<br>

## ✨ Core Features

| | Feature | What it does |
|:---:|---|---|
| 🤖 | **7 Autonomous Agents** | Import Compliance, Customs Duties, Health & Drugs, Telecom, Environmental, Security and Surveillance |
| 🕷️ | **Auto-expansion** | Live async spider fetches HTML and extracts PDF text (PyMuPDF) from government domains |
| 🧠 | **Semantic Classification** | Sentence-transformers judge meaning, not rigid keywords |
| 🔁 | **Continuous Learning Loop** | Records real outcomes via `/api/v1/feedback` to re-weight classification confidence |
| 🔌 | **Node.js Integration** | The main ImportSense platform queries this engine through a FastAPI REST endpoint |

<br>

## 🔥 Bootstrapping (Auto-warming)

On startup, the engine asynchronously spiders all 10 registered government sources in the background to build initial semantic vector indexes for all 7 agents. FAISS indexes are saved to disk under `./data/faiss_indices`.

<br>

## 🧩 Project Structure

```text
ai_engine/
 ├── main.py                  # FastAPI server (entrypoint)
 ├── requirements.txt         # Python dependencies
 ├── core/
 │   ├── scraper.py           # Async live government data fetcher + caching
 │   ├── pdf_ingester.py      # PyMuPDF processing + text chunker
 │   ├── embeddings.py        # Sentence-transformers + per-agent FAISS indices
 │   ├── knowledge_base.py    # Per-agent logic linking scraper, PDFs, and FAISS
 │   └── feedback_loop.py     # Outcome reinforcement JSONL store
 └── agents/                  # The 7 AI Classification Experts
     ├── agent_base.py
     ├── import_compliance.py
     ├── customs_duties.py
     ├── health_drugs.py
     ├── electronics_telecom.py
     ├── environmental_ewaste.py
     ├── security_encryption.py
     └── surveillance_spy.py
```

<br>

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|:---:|---|---|
| `POST` | `/api/v1/classify` | Runs all 7 agents and returns aggregate risk and reasoning |
| `POST` | `/api/v1/feedback` | Adjusts confidence factors based on real outcomes |
| `GET` | `/api/v1/stats` | Returns FAISS index sizes, vector counts and scraping status per agent |

<details>
<summary><b>📦 Example payloads</b></summary>
<br>

**Classify**
```json
{ "product_name": "Drone", "category": "Electronics", "agent": "all" }
```

**Feedback**
```json
{ "agent": "import_compliance", "product_name": "Drone", "predicted_level": "RESTRICTED", "outcome": "approved" }
```

</details>

<br>

<div align="center">

*ImportSense AI: compliance that keeps learning.*

</div>
