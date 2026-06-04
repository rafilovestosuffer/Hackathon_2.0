# InspectAI

Offline garment QA inspection with defect detection, standards-grounded root-cause analysis, and audit-ready reports.

For product requirements, architecture, and implementation blocks, see:
- `PRD.md` — Product spec and acceptance criteria
- `ARCHITECTURE.md` — System design and data flow
- `TASKS.md` — Block-by-block implementation plan
- `CLAUDE.md` — Implementation rules for Claude Code

---

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

---

## Running the Application

### Terminal 1: Start the Backend

```bash
cd backend

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

Check health: `curl http://localhost:8000/health`

### Terminal 2: Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Demo Mode

To run with pre-recorded demo responses (useful for testing without models):

```bash
cd backend
.\venv\Scripts\activate  # Windows or source venv/bin/activate
DEMO_MODE=true uvicorn main:app --reload
```

---

## Project Structure

```
.
├── frontend/              Next.js React app
├── backend/               FastAPI backend
│   ├── venv/             Python virtual environment
│   ├── main.py           FastAPI app entry point
│   ├── requirements.txt   Python dependencies
│   ├── routers/          API endpoint modules
│   ├── models/           Vision model code
│   ├── rag/              RAG/retrieval code
│   ├── llm/              LLM integration code
│   └── data/             Standards corpus, demo images
├── models/                Vision model weights (not committed)
├── data/                  Additional data files
├── PRD.md                Product requirements
├── ARCHITECTURE.md       System design
├── TASKS.md              Implementation blocks
├── CLAUDE.md             Implementation rules
└── README.md             This file
```

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.8+
- **Vision:** PyTorch, torchvision, ResNet18
- **RAG:** FAISS, Sentence-BERT
- **LLM:** Transformers, Mistral-7B-4bit
- **Compute:** Kaggle (free-tier T4/P100, 16GB VRAM)

---

## Implementation Progress

All blocks complete! ✅

- **Block 1:** Project Setup ✅
- **Block 2:** Frontend Upload Panel ✅
- **Block 3:** Backend Image Endpoint ✅
- **Block 4:** Vision Model ✅
- **Block 5:** RAG Integration ✅
- **Block 6:** LLM Integration ✅
- **Block 7:** Result Display ✅
- **Block 8:** Report Generation ✅
- **Block 9:** Error Handling & Fallbacks ✅
- **Block 10:** Demo Fallback & Pre-Cached Responses ✅
- **Block 11:** UI Polish & Mobile Responsiveness ✅
- **Block 12:** Demo Script & Acceptance Checklist ✅

---

## Demo Script

See `DEMO_SCRIPT.md` for the 2-minute judge-facing demo flow.

**Quick demo run:**

```bash
# Terminal 1: Backend with demo mode
cd backend
.\venv\Scripts\activate
DEMO_MODE=true uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Open http://localhost:3000 and upload demo_stain.jpg
```

---

## Next Steps

Ready to deploy! See `DEMO_SCRIPT.md` for presentation flow.

---

## Support

For implementation details, see:
- `CLAUDE.md` — How Claude Code should approach implementation
- `PRD.md` — What the product should do
- `ARCHITECTURE.md` — How the system is structured
- `TASKS.md` — Step-by-step build plan
