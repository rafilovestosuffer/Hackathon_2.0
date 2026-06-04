# PRD: InspectAI

## 0. Assumptions

* [Confirmed] Three-layer system: vision defect detection, FAISS RAG over quality standards, quantized small LLM for root-cause analysis.
* [Confirmed] Target domain is Bangladesh's RMG (ready-made garment) export industry.
* [Confirmed] Primary compute is free-tier Kaggle (T4/P100, 16GB VRAM).
* [Assumed] Hackathon demo target is DIU National AI Hackathon, July 2026 — so MVP must be a 2-minute live demo, not a production deployment.
* [Assumed] Defect detection is image classification + bounding box on a small fixed defect taxonomy (e.g. stitching error, stain, hole, misaligned seam, color deviation) rather than open-set detection.
* [Assumed] The "quality standards" corpus for RAG is a curated set of buyer/compliance checklists (e.g. AQL sampling, ISO 9001 clauses, buyer spec sheets) ingested as text — not the full Bangladesh-Legal-Acts-Dataset, which is a nice-to-have.
* [Assumed] Quantized LLM runs via a 4-bit GGUF/transformers model small enough for 16GB VRAM (e.g. a 3B–7B instruct model).
* [Assumed] Single inspector user per session; no multi-tenant auth in MVP.

## 1. One-Line Product Summary

InspectAI helps garment-factory QA inspectors solve slow, inconsistent export-compliance inspection by detecting fabric/stitch defects from a photo, matching them to the relevant quality standard, and generating a root-cause explanation with a remediation step — producing an audit-ready defect report in seconds.

## 2. Target Users

* **Primary user:** QA inspector / line supervisor on the factory floor who photographs sampled garments.
* **Secondary user:** Compliance manager who needs an audit trail for buyer inspections.
* **Pain points:** Manual visual inspection is slow and subjective; standards knowledge lives in a few experts' heads; failed buyer audits cost contracts; root-cause analysis is ad hoc.
* **Current alternative:** Manual AQL inspection + spreadsheets + tribal knowledge.
* **Why this is better:** Consistent detection, standard-grounded justification (not hallucinated), and an automatic root-cause + fix suggestion that a junior inspector can act on.

## 3. Problem Statement

* **What:** Export garment QA depends on scarce expert inspectors and undocumented standards knowledge.
* **Why it matters:** Bangladesh RMG is ~80%+ of national exports; failed buyer/compliance audits directly threaten revenue and contracts.
* **If unsolved:** Inconsistent quality, rework cost, lost buyers, and no defensible audit trail.
* **Why now:** Small vision models + quantized LLMs now run on free 16GB GPUs, making an on-prem/offline-capable inspection assistant feasible without cloud cost.

## 4. MVP Scope

The smallest demo-winning version:

* **Main flow:** Inspector uploads a garment image → defect detected and labeled → relevant standard retrieved → LLM explains root cause + fix → report generated.
* **Core input:** A single garment image (+ optional product type dropdown).
* **Core processing:** Vision classifier → defect label + confidence → FAISS retrieval of top-k standard passages → LLM root-cause prompt grounded on retrieved passages.
* **Core output:** A defect card: label, confidence, cited standard clause, root-cause text, recommended action, pass/fail flag.
* **Must work in demo:** Upload → detect → cite → explain → downloadable/printable report.

## 5. Core User Flow

1. Inspector opens the app and selects product type (optional).
2. Inspector uploads or captures a garment image.
3. System shows a **loading** state while the vision model runs.
4. System displays the detected defect with confidence (**success**), or "No defect detected above threshold" (**empty**).
5. System retrieves and cites the matching standard, then shows the LLM root-cause + recommended fix.
6. Inspector clicks "Generate Report" to export an audit-ready summary.

**States:** loading (model inference), empty (no defect / low confidence), success (defect card), error (model/API failure → see fallback in §13).

## 6. Must-Have Features

### Feature: Defect Detection

**Description:**
* Classify (and optionally localize) the primary defect in an uploaded garment image.

**Acceptance criteria:**
* [ ] Returns a defect label from the fixed taxonomy + a confidence score.
* [ ] Confidence below threshold returns "no defect detected" rather than a forced label.
* [ ] Inference completes in < 5s on a T4.

**Likely files:**
* `models/vision/infer.py`
* `app/components/UploadPanel.tsx`

### Feature: Standard Retrieval (FAISS RAG)

**Description:**
* Given a detected defect, retrieve the top-k most relevant quality-standard passages.

**Acceptance criteria:**
* [ ] Returns at least one cited passage with a source identifier.
* [ ] Retrieval is grounded — the cited passage is shown verbatim alongside the explanation.
* [ ] Empty/irrelevant retrieval degrades gracefully (LLM told "no standard found").

**Likely files:**
* `rag/index.py`
* `rag/retrieve.py`
* `data/standards/`

### Feature: Root-Cause Analysis (Quantized LLM)

**Description:**
* Generate a grounded root-cause explanation + one recommended remediation, constrained to retrieved passages.

**Acceptance criteria:**
* [ ] Output is valid JSON (root_cause, recommended_action, pass_fail, cited_standard).
* [ ] Explanation references the retrieved standard, not invented clauses.
* [ ] Returns a deterministic fallback message if the LLM fails to produce valid JSON.

**Likely files:**
* `llm/root_cause.py`
* `llm/prompts.py`

### Feature: Audit Report

**Description:**
* Compile the defect card into an exportable report.

**Acceptance criteria:**
* [ ] Report includes image thumbnail, defect, confidence, cited standard, root cause, action, timestamp.
* [ ] Exportable as a single printable view (PDF or print-styled HTML).

**Likely files:**
* `app/components/Report.tsx`

## 7. Nice-to-Have Features

* **High leverage:** Bounding-box localization overlay on the image.
* **High leverage:** Batch upload (inspect a sampled lot at once).
* **Medium leverage:** Bangladesh-Legal-Acts-Dataset ingestion for legal-compliance grounding.
* **Medium leverage:** Inspector feedback loop (thumbs up/down to log false positives).
* **Low leverage:** Multi-language (Bangla) report output.
* **Low leverage:** Auth + per-factory history dashboard.

## 8. Non-Goals

* Real-time video / camera-stream inspection.
* Open-set defect discovery beyond the fixed taxonomy.
* Production multi-tenant auth, RBAC, or factory-wide deployment.
* Fine-tuning the LLM (use prompting + RAG only for MVP).
* Cloud GPU dependency or paid APIs in the demo path.
* Full legal-compliance certification (research demo, not a certified tool).

## 9. System Modules

**System Overview:** A web frontend sends an image to a backend API; the API runs a vision classifier, uses the label to query a FAISS index of standards, then prompts a locally-hosted quantized LLM grounded on the retrieved passages, returning a structured defect card. (Full detail in ARCHITECTURE.md.)

### Frontend

* **Framework:** Next.js (React).
* **Pages:** Single inspection page + report view.
* **Components:** UploadPanel, DefectCard, StandardCitation, Report, StatusBanner.
* **State:** Local React state; no global store needed for MVP.
* **UI states:** loading, empty, success, error.

### Backend

* **Framework:** FastAPI (Python) — co-locates with the ML stack.
* **API routes:** `/api/inspect`, `/api/report`.
* **Auth:** None in MVP.
* **DB:** Optional SQLite for inspection history (nice-to-have).
* **File handling:** In-memory image upload, max size cap.

### AI / ML / Agentic Module

* **Vision:** Fine-tuned / pretrained CNN or ViT classifier on a small defect taxonomy.
* **RAG:** Sentence-embedding model + FAISS flat index over chunked standards.
* **LLM:** 4-bit quantized 3B–7B instruct model (transformers / llama.cpp), JSON-constrained prompt.
* **Validation:** JSON schema check on LLM output; confidence threshold on vision.
* **Fallback:** Rule-based template if LLM JSON invalid (see §13).
* **Evaluation:** Held-out labeled defect images for vision accuracy; manual spot-check of grounding for RAG+LLM.

### Database / Storage

* `standards` (FAISS index + metadata: source, clause_id, text).
* `inspections` (optional SQLite: id, image_ref, defect, confidence, cited_clause, root_cause, action, created_at).

## 10. API Specification

```txt
POST /api/inspect
Purpose: Run full pipeline on one image and return a defect card.
Request body: multipart/form-data { image: file, product_type?: string }
Response body: { defect: string, confidence: float, cited_standard: {source, clause_id, text}, root_cause: string, recommended_action: string, pass_fail: "pass"|"fail" }
Error response: { error: string, stage: "vision"|"rag"|"llm", fallback_used: bool }
Validation: image present, mime image/*, size <= 8MB, confidence threshold applied.
```

```txt
POST /api/report
Purpose: Compile a defect card into an exportable report payload.
Request body: { card: DefectCard }
Response body: { report_html: string, generated_at: ISO8601 }
Error response: { error: string }
Validation: card has required fields.
```

## 11. UI Specification

* **Pages:** Inspection page, Report view.
* **Sections:** Upload zone, result card, standard citation panel, action bar.
* **Components:** UploadPanel, DefectCard, StandardCitation, Report, StatusBanner.
* **User states:** Loading spinner, empty ("no defect"), success card, error banner.
* **Responsive:** Mobile-first (inspectors use phones on the floor).
* **Demo-focused visual priorities:** Big confident defect label, visible cited clause (proves grounding to judges), clean one-screen result.

## 12. Data Schema

```json
{
  "defect": "broken_stitch",
  "confidence": 0.91,
  "cited_standard": {
    "source": "Buyer Spec v3",
    "clause_id": "4.2.1",
    "text": "..."
  },
  "root_cause": "Likely tension misconfiguration on the overlock machine...",
  "recommended_action": "Recalibrate thread tension and re-sample 5 units.",
  "pass_fail": "fail"
}
```

```txt
inspections (SQLite, optional)
id PK | image_ref | defect | confidence | cited_clause | root_cause | action | created_at
```

## 13. AI Prompt / Model Contract

* **System role:** "You are a garment QA compliance assistant. Use ONLY the provided standard passages. If they do not cover the defect, say so."
* **Input variables:** `defect_label`, `confidence`, `retrieved_passages[]`, `product_type`.
* **Output JSON schema:** `{ root_cause: string, recommended_action: string, pass_fail: "pass"|"fail", cited_standard: {source, clause_id} }`.
* **Guardrails:** No clause invention; must cite from `retrieved_passages`; refuse if retrieval empty.
* **Failure behavior:** If output is not valid JSON or omits a cited clause, return rule-based template: "Defect: {label}. No grounded standard match — manual review required."
* **Confidence/explanation:** Include the vision confidence and the cited clause id so the judge can verify grounding.

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| LLM hallucinates a standard clause | High — kills credibility | Strict RAG grounding + JSON schema check + refuse on empty retrieval |
| Quantized LLM too slow / OOM on 16GB | High — demo stalls | Pre-load model once; cap tokens; pre-cache demo responses as fallback |
| Vision model low accuracy on real defects | Medium | Curate a clean demo set; show confidence; threshold to "no defect" |
| Slow end-to-end response | Medium | Warm models at startup; show staged loading states |
| UI complexity creeps | Medium | Single-page flow; defer batch/auth to nice-to-have |
| Live demo failure (network/model) | High | Offline mode + pre-recorded fallback inference for 2-3 demo images |

## 15. Acceptance Checklist

* [ ] Main flow works end-to-end (upload → card → report)
* [ ] UI is demo-ready (mobile, one screen)
* [ ] `/api/inspect` returns a stable, schema-valid response
* [ ] LLM JSON-invalid fallback exists and is tested
* [ ] Error + empty states handled
* [ ] README runs the project from scratch
* [ ] 2-minute demo script rehearsed with fallback images

## 16. Demo Script

1. **Problem:** "Bangladesh's garment exports depend on QA that's slow, subjective, and audit-risky."
2. **Input:** Upload a defective garment photo on a phone screen.
3. **Processing:** Show the staged pipeline — detect → retrieve standard → reason.
4. **Result:** Defect card with confidence **and the cited clause** highlighted (grounding!).
5. **Impact:** "A junior inspector now produces an expert, audit-ready verdict in seconds — offline, on a single 16GB GPU."
6. **Closing:** "InspectAI turns scarce QA expertise into a standard every line can run."
