# Architecture: InspectAI

## 1. System Overview

InspectAI is a three-tier system combining vision, retrieval, and language models to produce grounded, audit-ready defect analysis:

1. **Frontend (Next.js):** React single-page app for image upload, real-time result display, and report generation.
2. **Backend (FastAPI):** Python API orchestrating the ML pipeline; hosts models locally to avoid cloud cost and connectivity dependency.
3. **AI Pipeline:** Vision classifier → FAISS RAG retrieval → Quantized LLM reasoning.

The system is designed for offline operation on a single 16GB GPU (Kaggle T4/P100), with fallback mechanisms to ensure demo reliability.

---

## 2. Data Flow

```
Inspector Opens App (browser:3000)
    ↓
Inspector Selects Product Type & Uploads Image (multipart/form-data)
    ↓
Frontend UploadPanel sends POST /api/inspect to Backend (localhost:8000)
    ↓
Backend /api/inspect Endpoint
    ├─ Validates image: mime type, file size (max 8MB)
    ├─ Loads and runs Vision Model (ResNet18 / ViT)
    │   Input: Image tensor (224x224 RGB)
    │   Output: defect_label (str), confidence (float)
    ├─ Queries FAISS Index with defect label
    │   Input: defect_label (embedded as text)
    │   Output: top-k standard passages [{source, clause_id, text}]
    ├─ Prompts Quantized LLM with retrieved passages + defect + confidence
    │   Input: system_prompt + defect_label + confidence + retrieved_passages + product_type
    │   Output: JSON {root_cause, recommended_action, pass_fail, cited_standard}
    ├─ Validates LLM output: JSON schema, cited_standard from retrieved_passages
    └─ Returns DefectCard: {defect, confidence, cited_standard, root_cause, recommended_action, pass_fail}
    ↓
Frontend Receives DefectCard JSON
    ├─ Displays DefectCard Component
    ├─ Displays StandardCitation Component (highlighted clause)
    ├─ Offers "Generate Report" button
    └─ Offers "New Inspection" button
    ↓
Inspector Clicks "Generate Report"
    ├─ Calls POST /api/report with DefectCard
    ├─ Backend returns report_html (formatted report)
    └─ Frontend opens print dialog or downloads HTML
    ↓
Inspector Prints / Downloads Audit Report
```

---

## 3. Module Breakdown

### 3.1 Frontend (Next.js / React)

**Responsibility:** User interface for image upload, result display, report viewing.

**Key Files:**
- `app/page.tsx` — Main page orchestrating state and flow.
- `app/components/UploadPanel.tsx` — File upload form with validation.
- `app/components/DefectCard.tsx` — Display detected defect + confidence.
- `app/components/StandardCitation.tsx` — Highlight cited standard clause.
- `app/components/Report.tsx` — Printable / exportable report.
- `app/components/StatusBanner.tsx` — Loading / empty / error / success states.
- `app/globals.css` — Tailwind styling + custom CSS.

**Inputs:**
- User uploads image file + selects optional product_type.

**Outputs:**
- Displays DefectCard (if success) or error message.
- Exports printable HTML report.

**Key Dependencies:**
- React 18
- Next.js 14+
- Tailwind CSS
- No third-party ML libraries (all on backend).

**State Management:**
- Local React state (useState) for: current_state, result, error, loading.
- No Redux/Zustand needed for MVP.

---

### 3.2 Backend (FastAPI / Python)

**Responsibility:** Orchestrate ML pipeline, validate inputs/outputs, serve API endpoints.

**Key Files:**
- `main.py` — FastAPI app initialization, middleware (CORS), router includes.
- `routers/inspect.py` — `/api/inspect` and `/api/report` endpoints.
- `models/vision/infer.py` — Load and run vision model.
- `rag/index.py` — Build and query FAISS index.
- `rag/retrieve.py` — Retrieval helper functions.
- `llm/root_cause.py` — Quantized LLM inference.
- `llm/prompts.py` — System prompt and prompt templates.
- `data/standards/standards.txt` — Corpus of quality standards.
- `data/demo_responses.json` — Pre-recorded responses for demo mode.

**Inputs:**
- POST `/api/inspect`: image file, product_type (optional).
- POST `/api/report`: DefectCard JSON.

**Outputs:**
- `/api/inspect`: DefectCard JSON or error.
- `/api/report`: report_html string + timestamp.

**Key Dependencies:**
- FastAPI, Uvicorn
- Pillow (image I/O)
- PyTorch / torchvision (vision model)
- Transformers (LLM loading)
- Sentence-transformers (embeddings)
- FAISS (vector search)
- Pydantic (validation)

**Error Handling:**
- Image validation (mime, size).
- Model loading errors (fallback to stub).
- RAG empty retrieval (use default standard).
- LLM JSON parse failure (return fallback template).
- All errors return a valid DefectCard with `fallback_used: true`.

---

### 3.3 Vision Model (Defect Detection)

**Responsibility:** Classify the primary defect in a garment image.

**Key Files:**
- `models/vision/infer.py` — Load model, run inference.

**Inputs:**
- PIL Image (224x224 RGB).

**Outputs:**
- defect_label: string from fixed taxonomy.
- confidence: float [0.0, 1.0].

**Model Options:**
- **Option A (Recommended for MVP):** Fine-tuned ResNet18 on a small defect dataset (stitching error, stain, hole, misaligned seam, color deviation).
- **Option B:** Use a pre-trained model from Hugging Face (textile defect classifier).
- **Option C (Demo):** Mock classifier that returns deterministic labels for known test images.

**Constraints:**
- Inference < 5s on T4 GPU.
- Memory footprint < 2GB.
- Confidence threshold: label only if confidence > 0.5, else return "no_defect".

**Fallback:**
- If model fails to load or inference crashes, return {"label": "detection_failed", "confidence": 0.0}.

---

### 3.4 RAG – Retrieval & Standards

**Responsibility:** Retrieve the most relevant quality-standard passages for a detected defect.

**Key Files:**
- `rag/index.py` — Build FAISS index from standards corpus.
- `rag/retrieve.py` — Query index and return top-k passages.
- `data/standards/standards.txt` — Corpus (text file, newline-delimited).

**Inputs:**
- query: string (defect label or free-form query).
- k: number of top passages to retrieve.

**Outputs:**
- [{source, clause_id, text}, ...] — list of dicts.

**How It Works:**
1. Load standards corpus and chunk into passages.
2. Embed each passage using Sentence-BERT (e.g., all-MiniLM-L6-v2).
3. Build a FAISS flat index (L2 distance).
4. At query time: embed query, search FAISS, return top-k.

**Standards Corpus:**
- Format: newline-delimited, pipe-separated:
  ```
  source: Buyer Spec v3 | clause_id: 4.2.1 | Visible stains on visible areas are not acceptable.
  source: ISO 9001 | clause_id: 5.1.2 | All stitching must be uniform and even with no broken threads.
  ...
  ```
- Size for MVP: 20–50 passages covering common defect types.
- Future: ingest Bangladesh Legal Acts dataset (nice-to-have).

**Constraints:**
- Index build time < 1 minute.
- Index file size < 100MB.
- Query latency < 1s.

**Fallback:**
- If index fails to load or query returns empty, return a default standard: {"source": "Default", "clause_id": "0.0", "text": "No matching standard. Manual review required."}.

---

### 3.5 LLM – Root-Cause Analysis

**Responsibility:** Generate a grounded root-cause explanation constrained to retrieved standards.

**Key Files:**
- `llm/root_cause.py` — Load model, run inference, parse JSON output.
- `llm/prompts.py` — System role + prompt templates.

**Inputs:**
- defect_label: string.
- confidence: float.
- retrieved_passages: [{source, clause_id, text}, ...].
- product_type: string (optional).

**Outputs:**
- {root_cause, recommended_action, pass_fail, cited_standard} — JSON dict.

**Model:**
- **Model Name:** Mistral-7B-Instruct-v0.1 (or similar 7B instruct model).
- **Quantization:** 4-bit (using bitsandbytes + transformers load_in_4bit=True).
- **Device:** Auto-map to GPU (if available) or CPU with fallback.

**Prompting:**
- **System role:** "You are a garment QA compliance assistant. Use ONLY the provided standard passages. If they do not cover the defect, say so."
- **Input variables:** defect_label, confidence, retrieved_passages (formatted), product_type.
- **Output schema:** JSON with all required fields.
- **Guardrails:**
  - Must cite a clause from retrieved_passages (not invented).
  - Must use standard format: `{"source": "...", "clause_id": "...", ...}`.
  - If no standard matches, return: `{"source": "N/A", "clause_id": "N/A"}`.
  - Max output tokens: 200 (to cap latency).

**Constraints:**
- Inference < 10s on T4.
- Memory < 14GB (leave headroom for other processes).
- Output must be parseable JSON (enforced with schema validation).

**Fallback:**
- If JSON parsing fails, return rule-based template:
  ```json
  {
    "root_cause": "Unable to generate explanation.",
    "recommended_action": "Manual QA review required.",
    "pass_fail": "fail",
    "cited_standard": {"source": "N/A", "clause_id": "N/A"}
  }
  ```

---

### 3.6 Database / Storage (Optional)

**Responsibility:** Persist inspection history (nice-to-have for MVP).

**Files:**
- `backend/db/models.py` — SQLAlchemy models.
- `backend/db/database.py` — SQLite connection.

**Schema (Optional):**
```sql
CREATE TABLE inspections (
  id INTEGER PRIMARY KEY,
  image_ref TEXT,
  defect TEXT,
  confidence FLOAT,
  cited_clause TEXT,
  root_cause TEXT,
  action TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** For MVP demo, history is not required. Skip this and implement only if time permits.

---

## 4. Tech Stack Decision

| Layer | Choice | Reason |
| ----- | ------ | ------ |
| **Frontend** | Next.js + React | Fast development, built-in SSR, Tailwind support, mobile-friendly. |
| **Styling** | Tailwind CSS | Rapid UI iteration, mobile-first, professional look. |
| **Backend** | FastAPI | Async support, automatic OpenAPI docs, fast JSON serialization, good ML ecosystem fit. |
| **Vision Model** | ResNet18 (fine-tuned) | Lightweight, fast inference, good accuracy on small datasets. |
| **Embedding Model** | Sentence-BERT (all-MiniLM-L6-v2) | Efficient, no GPU required, good semantic understanding. |
| **Vector Index** | FAISS | Fast approximate search, lightweight, CPU-friendly. |
| **LLM** | Mistral-7B-Instruct-4bit | Fits 16GB VRAM, good instruction-following, low cost (free-tier Kaggle). |
| **LLM Inference** | Transformers + Bitsandbytes | Native PyTorch integration, 4-bit quantization, auto device mapping. |
| **Compute** | Kaggle Notebooks (free T4/P100) | Free GPU, reproducible environment, hackathon-friendly. |
| **Containerization** | Docker (optional) | Ensures reproducibility; skip for MVP if time is tight. |

---

## 5. Failure Handling

### Image Validation Fails
- **Response:** 400 Bad Request with error message.
- **Frontend:** Display "Invalid image. Please try PNG or JPG (max 8MB)."

### Vision Model Fails to Load
- **Fallback:** Return `{"label": "detection_failed", "confidence": 0.0}` and continue pipeline.
- **Frontend:** Display error: "Model temporarily unavailable. Please retry."

### Vision Inference Times Out (> 10s)
- **Fallback:** Return stub result or pre-cached fallback.
- **Frontend:** Show spinner, then fallback card if timeout.

### RAG Index Missing or Corrupted
- **Fallback:** Return default standard passage.
- **Pipeline:** LLM still runs with placeholder standard; output is less grounded but still valid.

### RAG Retrieval Returns Empty (No Matching Standards)
- **Fallback:** Use default standard: `{"source": "N/A", "clause_id": "N/A", "text": "No matching standard found. Manual review recommended."}`.
- **LLM:** Still runs and acknowledges the lack of standard.

### LLM Model Fails to Load
- **Fallback:** Return template: `{"root_cause": "System error.", "recommended_action": "Manual review.", "pass_fail": "fail", "cited_standard": {"source": "N/A", "clause_id": "N/A"}}`.
- **Frontend:** Display error; user can click "Try Again."

### LLM Output Invalid JSON
- **Fallback:** Apply template (same as above).
- **Logging:** Log raw output for debugging.

### LLM Hallucination / Citation Not in Retrieved Passages
- **Validation:** Check if cited_standard.clause_id is in one of the retrieved passages.
- **If validation fails:** Overwrite with the first retrieved standard.

### Network Error (Frontend ↔ Backend)
- **Frontend:** Catch fetch error, display "Connection error. Please check that the backend is running."
- **User action:** Retry button.

### Demo Mode Pre-Recorded Response Missing
- **Fallback:** Run live model inference (or return error if models not loaded).
- **Expected:** Demo images should always have corresponding pre-recorded responses.

---

## 6. Performance Targets

| Component | Target | Notes |
| --------- | ------ | ----- |
| Image upload validation | < 500ms | Client-side file validation. |
| Vision inference | < 5s | ResNet18 on 224x224 image. |
| RAG retrieval | < 1s | FAISS query on CPU or GPU. |
| LLM inference | < 10s | Mistral-7B-4bit, max 200 tokens. |
| **Total end-to-end** | < 20s | Includes overhead and network latency. |
| Frontend response latency | < 5s | Report generation / print. |
| Demo mode (pre-cached) | < 500ms | Instant response from JSON file. |

---

## 7. Security Considerations

- **Image Upload:** Validate file type and size on both client and server. Reject files > 8MB.
- **No Authentication (MVP):** Single-user demo; no auth required.
- **No Data Storage:** Images not persisted after inference (delete after processing).
- **Model Weights:** Downloaded from HuggingFace / PyTorch Hub; assume trusted sources.
- **LLM Prompt Injection:** Not a concern in this demo (defect_label and standards are system-generated, not user-provided).
- **CORS:** Configured to allow frontend (localhost:3000) to call backend (localhost:8000).

---

## 8. Scalability Notes (Post-MVP)

If scaling beyond a hackathon demo:

- **Multi-user:** Add user auth (OAuth, JWT) and per-user history.
- **Persistent Storage:** Replace optional SQLite with PostgreSQL.
- **Cloud Deployment:** Move to Lambda / Cloud Run + GPU endpoint (trade-off: cost).
- **Batch Processing:** Add async job queue (Celery + Redis) for batch uploads.
- **Monitoring:** Add Prometheus / Grafana for latency, model accuracy metrics.
- **Model Fine-Tuning:** Collect feedback and periodically retrain vision + LLM.

---

## 9. Deployment (MVP)

**Local Development (Recommended for Hackathon):**
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
DEMO_MODE=true uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Open http://localhost:3000
```

**Docker (Optional):**
```dockerfile
# backend/Dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04
RUN apt-get update && apt-get install -y python3.10 python3.10-venv
COPY backend /app
WORKDIR /app
RUN python3.10 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
CMD [". venv/bin/activate", "&&", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

**On Kaggle (Recommended for Demo):**
1. Create a Kaggle Notebook.
2. Install dependencies: `!pip install fastapi uvicorn torch transformers faiss-cpu sentence-transformers`.
3. Upload frontend (Next.js build as static folder) or run frontend locally and point to Kaggle backend.
4. Expose backend via ngrok tunnel (optional, for remote demo).

---

## 10. Testing Strategy

- **Vision Model:** Accuracy on 10–20 held-out defect images.
- **RAG:** Manual verification that top-k results are relevant.
- **LLM Output:** Spot-check 5–10 outputs for hallucination and citation accuracy.
- **End-to-End:** Run full pipeline on 3–5 demo images and verify all states.
- **Error Paths:** Test with invalid images, missing model files, empty retrieval, etc.
- **UI:** Manual testing on mobile (Chrome DevTools) and desktop.
