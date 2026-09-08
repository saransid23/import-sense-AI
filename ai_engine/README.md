# ImportSense AI — Self-Learning Compliance Engine

A fully autonomous, self-learning regulatory compliance engine built in Python. Features 7 distinct AI agents that dynamically fetch laws, circulars, and notifications from 10 Indian government authorities (DGFT, CBIC, ICEGATE, CDSCO, WPC, etc.). The system uses semantic NLP (sentence-transformers) and FAISS vector databases to classify imports without hardcoded rules.

## Core Features
- **7 Autonomous Agents**: Import Compliance, Customs Duties, Health & Drugs, Telecom, Environmental, Security, and Surveillance.
- **Auto-expansion**: Live async spider fetching from HTML and extracting text from PDFs (using PyMuPDF) from government domains.
- **Semantic Classification**: NLP sentence-transformers determine meaning instead of rigid keyword matching.
- **Continuous Learning Loop**: Records actual outcomes via `/api/v1/feedback` to re-weight classification confidence.
- **Node.js Integration**: The main ImportSense platform queries this engine via FastAPI REST endpoint.

## Project Structure
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

## Setup & Running

**1. Install Python 3.10+ dependencies**
```bash
cd ai_engine
pip install -r requirements.txt
```

**2. Start the FastAPI AI Engine**
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Alternatively, simply run the generated `start_ai.bat` in the project root.

The AI Engine will run on `http://127.0.0.1:8000`. You can test it via Swagger UI at `http://127.0.0.1:8000/docs`.

### Bootstrapping (Auto-warming)
On startup, the AI engine will asynchronously spider all 10 registered government sources in the background to build the initial semantic vector indexes for all 7 agents. The FAISS indexes are saved to disk under `./data/faiss_indices`.

## API Endpoints

- **`POST /api/v1/classify`**
  - Payload: `{ "product_name": "Drone", "category": "Electronics", "agent": "all" }`
  - Runs all 7 agents and returns aggregate risk + reasoning.
- **`POST /api/v1/feedback`**
  - Payload: `{ "agent": "import_compliance", "product_name": "Drone", "predicted_level": "RESTRICTED", "outcome": "approved" }`
  - Adjusts confidence factors based on real outcomes.
- **`GET /api/v1/stats`**
  - Returns current FAISS index sizes, vector counts, and scraping status for each agent.
