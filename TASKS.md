# TASKS: InspectAI

## Block 1: Project Setup

**Goal:** Initialize Next.js frontend + FastAPI backend with basic project structure.

**Files likely changed:**
* `frontend/` (new)
* `backend/` (new)
* `README.md` (new)
* `.gitignore` (new)

**Steps:**

1. Create a new directory structure:
   ```
   inspectai/
   ├── frontend/        (Next.js)
   ├── backend/         (FastAPI)
   ├── models/          (vision model, RAG index)
   ├── data/            (standards corpus)
   └── README.md
   ```

2. Initialize Next.js in `frontend/`:
   ```bash
   npx create-next-app@latest frontend --typescript --tailwind
   ```

3. Initialize FastAPI backend in `backend/`:
   ```bash
   mkdir backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\activate on Windows
   pip install fastapi uvicorn pillow pydantic python-multipart
   ```

4. Create `backend/main.py` with a minimal FastAPI app:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   app = FastAPI(title="InspectAI Backend")

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/health")
   def health():
       return {"status": "ok"}
   ```

5. Create a basic `README.md` explaining how to run both frontend and backend.

**Acceptance criteria:**

* [ ] Frontend `next dev` runs without error.
* [ ] Backend `uvicorn main:app --reload` runs without error.
* [ ] `http://localhost:3000` loads the Next.js default page.
* [ ] `http://localhost:8000/health` returns `{"status": "ok"}`.
* [ ] README explains how to start both servers.

**Test:**

```bash
# Terminal 1: backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2: frontend
cd frontend
npm run dev

# Terminal 3: check endpoints
curl http://localhost:8000/health
# expect: {"status":"ok"}
```

**Rollback:** Delete `inspectai/` and start over.

**Risk:** Environment setup (Python venv, npm) may fail depending on system. Ensure Node.js 18+ and Python 3.8+ are installed.

---

## Block 2: Frontend – Upload Panel Component

**Goal:** Create a React component that allows an inspector to upload a garment image.

**Files likely changed:**
* `frontend/app/page.tsx`
* `frontend/app/components/UploadPanel.tsx` (new)
* `frontend/app/styles/globals.css` (if needed)

**Steps:**

1. Create `frontend/app/components/UploadPanel.tsx`:
   - Input field for product type (optional dropdown: "shirt", "pants", "jacket").
   - File input (image only, max 8MB).
   - Upload button.
   - Visual feedback (e.g. file name shown after selection).

2. Add state to track:
   - Selected file
   - Product type
   - Loading state

3. On upload button click, call a `/api/inspect` endpoint (stub for now).

4. Replace the default Next.js home page with the UploadPanel.

**Acceptance criteria:**

* [ ] Upload field accepts image files (jpg, png).
* [ ] Rejects non-image files with a clear message.
* [ ] File size <= 8MB or show error.
* [ ] Product type dropdown has sensible defaults.
* [ ] Upload button is disabled until an image is selected.
* [ ] Component displays the selected file name.
* [ ] Mobile responsive (inspectors use phones).

**Test:**

```bash
# Visual inspection
cd frontend && npm run dev
# Open http://localhost:3000
# Try uploading various files (image, non-image, oversized)
# Check console for errors
```

**Rollback:** Remove `UploadPanel.tsx` and revert `page.tsx` to Next.js default.

**Risk:** File validation edge cases (MIME type spoofing). For MVP, trust client-side validation; add server-side checks in Block 3.

---

## Block 3: Backend – Image Upload Endpoint

**Goal:** Implement `/api/inspect` POST endpoint to accept image uploads.

**Files likely changed:**
* `backend/main.py`
* `backend/routers/inspect.py` (new)

**Steps:**

1. Create `backend/routers/inspect.py` with a route:
   ```python
   from fastapi import APIRouter, File, UploadFile, Form
   from pydantic import BaseModel
   import io
   from PIL import Image

   router = APIRouter(prefix="/api/inspect", tags=["inspect"])

   class DefectCard(BaseModel):
       defect: str
       confidence: float
       cited_standard: dict  # { source, clause_id, text }
       root_cause: str
       recommended_action: str
       pass_fail: str  # "pass" or "fail"

   @router.post("/inspect")
   async def inspect(
       image: UploadFile = File(...),
       product_type: str = Form(default="shirt")
   ):
       # Validate file
       if image.content_type not in ["image/jpeg", "image/png"]:
           return {"error": "Invalid image format"}
       
       if image.size > 8 * 1024 * 1024:
           return {"error": "Image too large"}
       
       # Read image
       contents = await image.read()
       img = Image.open(io.BytesIO(contents))
       
       # Stub response (vision/RAG/LLM to be filled in later blocks)
       return {
           "defect": "stain",
           "confidence": 0.85,
           "cited_standard": {
               "source": "Buyer Spec v3",
               "clause_id": "4.2.1",
               "text": "Visible stains on visible areas are not acceptable."
           },
           "root_cause": "[STUB] Likely washing water contamination.",
           "recommended_action": "[STUB] Re-wash and inspect.",
           "pass_fail": "fail"
       }
   ```

2. Include the router in `main.py`:
   ```python
   from backend.routers import inspect
   app.include_router(inspect.router)
   ```

3. Update frontend `UploadPanel` to POST to `/api/inspect` (use localhost:8000 proxy or env var).

**Acceptance criteria:**

* [ ] `/api/inspect` accepts POST with image file + product_type.
* [ ] Returns a valid DefectCard JSON response.
* [ ] Rejects non-images with 400 error.
* [ ] Rejects oversized images with 400 error.
* [ ] Frontend receives and displays the stub response.

**Test:**

```bash
# Terminal 1: backend
cd backend && uvicorn main:app --reload

# Terminal 2: frontend
cd frontend && npm run dev

# Terminal 3: test endpoint
curl -X POST -F "image=@test.jpg" -F "product_type=shirt" http://localhost:8000/api/inspect
# expect: {"defect": "stain", ...}
```

**Rollback:** Remove `routers/inspect.py` and revert `main.py`.

**Risk:** CORS issues between frontend (3000) and backend (8000). Add CORS middleware (already in place from Block 1).

---

## Block 4: Vision Model – Defect Detection

**Goal:** Integrate a pre-trained vision classifier to detect defects from images.

**Files likely changed:**
* `backend/models/vision/infer.py` (new)
* `backend/routers/inspect.py` (updated)
* `backend/requirements.txt` (updated: torch, torchvision, or huggingface)

**Steps:**

1. Download or load a pre-trained model. Options:
   - Use a fine-tuned model from Hugging Face (e.g., a textile defect classifier).
   - Use a zero-shot model (CLIP) with defect descriptions.
   - For demo: use a mock classification that returns deterministic results for known test images.

2. Create `backend/models/vision/infer.py`:
   ```python
   from PIL import Image
   import torch
   from torchvision import models, transforms
   
   class DefectDetector:
       def __init__(self, model_path=None):
           # Load a pre-trained ResNet18 or similar
           self.model = models.resnet18(pretrained=True)
           self.model.eval()
           self.transform = transforms.Compose([
               transforms.Resize(224),
               transforms.ToTensor(),
               transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                   std=[0.229, 0.224, 0.225])
           ])
           self.defect_classes = [
               "stain",
               "broken_stitch",
               "hole",
               "misaligned_seam",
               "color_deviation"
           ]
       
       def detect(self, image: Image.Image):
           # Preprocess
           img_tensor = self.transform(image).unsqueeze(0)
           
           # Inference
           with torch.no_grad():
               logits = self.model(img_tensor)
           
           # For demo: pick the highest logit and map to a defect label
           class_idx = logits.argmax(dim=1).item() % len(self.defect_classes)
           confidence = torch.softmax(logits, dim=1)[0, class_idx].item()
           
           return {
               "label": self.defect_classes[class_idx],
               "confidence": float(confidence)
           }
   ```

3. Update `backend/routers/inspect.py` to call the vision model:
   ```python
   from backend.models.vision.infer import DefectDetector
   
   detector = DefectDetector()  # Load once at startup
   
   @router.post("/inspect")
   async def inspect(...):
       # ... validate image ...
       img = Image.open(io.BytesIO(contents))
       vision_result = detector.detect(img)
       
       # Continue pipeline with vision_result["label"] and vision_result["confidence"]
       ...
   ```

**Acceptance criteria:**

* [ ] Model loads without error at backend startup.
* [ ] Returns a defect label + confidence score.
* [ ] Confidence is between 0.0 and 1.0.
* [ ] Inference completes in < 5s on a T4 GPU (or CPU).
* [ ] Returns "no_defect" if confidence < 0.5 (threshold).

**Test:**

```bash
cd backend && python -c "from models.vision.infer import DefectDetector; d = DefectDetector(); print(d.detect(Image.new('RGB', (224, 224))))"
# expect: {"label": "...", "confidence": 0.XX}
```

**Rollback:** Remove `backend/models/vision/` and revert `inspect.py` to use stub.

**Risk:** Model download/loading may fail or be slow on first run. Pre-cache model weights or use a lightweight model (e.g. MobileNet).

---

## Block 5: RAG – FAISS Index & Standard Retrieval

**Goal:** Build and integrate a FAISS vector index of quality-standard passages.

**Files likely changed:**
* `backend/rag/index.py` (new)
* `backend/rag/retrieve.py` (new)
* `backend/data/standards/standards.txt` (new)
* `backend/routers/inspect.py` (updated)
* `backend/requirements.txt` (updated: faiss-cpu, sentence-transformers)

**Steps:**

1. Create a sample standards corpus in `backend/data/standards/standards.txt`:
   ```txt
   source: Buyer Spec v3 | clause_id: 4.2.1 | Visible stains on visible areas are not acceptable.
   source: ISO 9001 | clause_id: 5.1.2 | Stitching must be uniform and even with no broken threads.
   source: Bangladesh RMG Code | clause_id: 3.4.5 | Seams must be aligned and symmetrical.
   ...
   ```

2. Create `backend/rag/index.py` to build the FAISS index:
   ```python
   from sentence_transformers import SentenceTransformer
   import faiss
   import json
   
   class StandardsIndex:
       def __init__(self, corpus_path):
           self.model = SentenceTransformer("all-MiniLM-L6-v2")
           self.standards = self._load_standards(corpus_path)
           self.index = self._build_index()
       
       def _load_standards(self, path):
           standards = []
           with open(path, "r") as f:
               for line in f:
                   if line.strip():
                       parts = line.split(" | ")
                       standards.append({
                           "source": parts[0].split(": ")[1],
                           "clause_id": parts[1].split(": ")[1],
                           "text": parts[2].split(": ")[1]
                       })
           return standards
       
       def _build_index(self):
           texts = [s["text"] for s in self.standards]
           embeddings = self.model.encode(texts)
           index = faiss.IndexFlatL2(len(embeddings[0]))
           index.add(embeddings.astype('float32'))
           return index
       
       def retrieve(self, query, k=3):
           query_embedding = self.model.encode([query])[0]
           distances, indices = self.index.search(
               query_embedding.astype('float32').reshape(1, -1),
               k
           )
           results = []
           for idx in indices[0]:
               if idx < len(self.standards):
                   results.append(self.standards[idx])
           return results
   ```

3. Create `backend/rag/retrieve.py`:
   ```python
   def retrieve_standards(detector_label, index):
       passages = index.retrieve(detector_label, k=3)
       return passages
   ```

4. Update `backend/routers/inspect.py` to call the RAG:
   ```python
   from backend.rag.index import StandardsIndex
   
   standards_index = StandardsIndex("backend/data/standards/standards.txt")
   
   @router.post("/inspect")
   async def inspect(...):
       # ... vision detection ...
       vision_result = detector.detect(img)
       
       # RAG retrieval
       standards = standards_index.retrieve(vision_result["label"], k=3)
       
       # Continue pipeline with standards ...
   ```

**Acceptance criteria:**

* [ ] FAISS index builds without error.
* [ ] `.retrieve()` returns top-k passages with source and clause_id.
* [ ] Passages are sorted by relevance (distance).
* [ ] Returns empty list gracefully if no matches.
* [ ] Index size is manageable (< 100MB for MVP).

**Test:**

```bash
cd backend && python -c "from rag.index import StandardsIndex; idx = StandardsIndex('data/standards/standards.txt'); print(idx.retrieve('stain', k=3))"
# expect: [{"source": "...", "clause_id": "...", "text": "..."}, ...]
```

**Rollback:** Remove `backend/rag/` and revert `inspect.py`.

**Risk:** Large corpus may slow index build. For MVP, keep corpus small (10–50 passages). Pre-build and serialize the index.

---

## Block 6: LLM – Root-Cause Analysis with Quantized Model

**Goal:** Integrate a quantized 4-bit LLM to generate grounded root-cause explanations.

**Files likely changed:**
* `backend/llm/root_cause.py` (new)
* `backend/llm/prompts.py` (new)
* `backend/routers/inspect.py` (updated)
* `backend/requirements.txt` (updated: transformers, bitsandbytes, torch)

**Steps:**

1. Create `backend/llm/prompts.py` with the system prompt:
   ```python
   def get_root_cause_prompt(defect_label, confidence, standards, product_type):
       standard_text = "\n".join([
           f"- Source: {s['source']}, Clause: {s['clause_id']}\n  {s['text']}"
           for s in standards
       ])
       
       prompt = f"""You are a garment QA compliance assistant.

   Defect detected: {defect_label}
   Confidence: {confidence:.2%}
   Product type: {product_type}

   Relevant quality standards:
   {standard_text if standard_text else "No standards found."}

   Generate a JSON response with:
   {{
     "root_cause": "One sentence explaining why this defect likely occurred.",
     "recommended_action": "One specific action to fix this.",
     "pass_fail": "fail" or "pass",
     "cited_standard": {{"source": "...", "clause_id": "..."}}
   }}

   Use ONLY the standards above. Do not invent clauses."""
       return prompt
   ```

2. Create `backend/llm/root_cause.py`:
   ```python
   import json
   from transformers import AutoModelForCausalLM, AutoTokenizer
   
   class RootCauseAnalyzer:
       def __init__(self):
           # Load a quantized model (e.g., Mistral-7B-4bit)
           self.model_name = "mistralai/Mistral-7B-Instruct-v0.1"
           self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
           self.model = AutoModelForCausalLM.from_pretrained(
               self.model_name,
               load_in_4bit=True,
               device_map="auto"
           )
       
       def analyze(self, prompt):
           inputs = self.tokenizer(prompt, return_tensors="pt")
           outputs = self.model.generate(
               **inputs,
               max_new_tokens=200,
               temperature=0.7
           )
           response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
           
           # Extract JSON from response
           try:
               # Try to parse JSON from response
               json_start = response_text.find('{')
               json_end = response_text.rfind('}') + 1
               json_str = response_text[json_start:json_end]
               result = json.loads(json_str)
               return result
           except:
               # Fallback if JSON parsing fails
               return {
                   "root_cause": "Unable to determine cause.",
                   "recommended_action": "Manual review required.",
                   "pass_fail": "fail",
                   "cited_standard": {"source": "N/A", "clause_id": "N/A"}
               }
   ```

3. Update `backend/routers/inspect.py`:
   ```python
   from backend.llm.root_cause import RootCauseAnalyzer
   from backend.llm.prompts import get_root_cause_prompt
   
   analyzer = RootCauseAnalyzer()
   
   @router.post("/inspect")
   async def inspect(...):
       # ... vision detection, RAG retrieval ...
       
       # LLM root-cause analysis
       prompt = get_root_cause_prompt(
           vision_result["label"],
           vision_result["confidence"],
           standards,
           product_type
       )
       llm_result = analyzer.analyze(prompt)
       
       # Combine into final DefectCard
       return {
           "defect": vision_result["label"],
           "confidence": vision_result["confidence"],
           "cited_standard": llm_result.get("cited_standard"),
           "root_cause": llm_result.get("root_cause"),
           "recommended_action": llm_result.get("recommended_action"),
           "pass_fail": llm_result.get("pass_fail")
       }
   ```

**Acceptance criteria:**

* [ ] Model loads in 4-bit quantization without OOM on 16GB VRAM.
* [ ] Returns valid JSON with all required fields.
* [ ] Cited standard is one of the retrieved standards (not invented).
* [ ] Response time < 10s per inference.
* [ ] Fallback triggers if JSON parsing fails.

**Test:**

```bash
cd backend && python -c "
from llm.root_cause import RootCauseAnalyzer
from llm.prompts import get_root_cause_prompt
analyzer = RootCauseAnalyzer()
prompt = get_root_cause_prompt('stain', 0.85, [{'source': 'Spec', 'clause_id': '1.0', 'text': 'No stains.'}], 'shirt')
result = analyzer.analyze(prompt)
print(result)
"
```

**Rollback:** Remove `backend/llm/` and revert `inspect.py` to return stub.

**Risk:** Model download (7B) may be large. Pre-cache model weights or use a smaller model (3B). Quantization may reduce quality; validate with demo images.

---

## Block 7: Frontend – DefectCard & Result Display

**Goal:** Create React components to display the defect card, standard citation, and result state.

**Files likely changed:**
* `frontend/app/components/DefectCard.tsx` (new)
* `frontend/app/components/StandardCitation.tsx` (new)
* `frontend/app/components/StatusBanner.tsx` (new)
* `frontend/app/page.tsx` (updated)

**Steps:**

1. Create `frontend/app/components/DefectCard.tsx`:
   ```tsx
   export interface DefectCardData {
     defect: string;
     confidence: number;
     cited_standard: { source: string; clause_id: string; text: string };
     root_cause: string;
     recommended_action: string;
     pass_fail: "pass" | "fail";
   }

   export function DefectCard({ card }: { card: DefectCardData }) {
     return (
       <div className="border rounded p-4 bg-white shadow">
         <h2 className="text-2xl font-bold">{card.defect.replace(/_/g, " ")}</h2>
         <p className={`text-sm ${card.confidence > 0.8 ? "text-green-600" : "text-yellow-600"}`}>
           Confidence: {(card.confidence * 100).toFixed(1)}%
         </p>
         <hr className="my-4" />
         <h3 className="font-bold">Root Cause</h3>
         <p className="text-sm">{card.root_cause}</p>
         <h3 className="font-bold mt-4">Recommended Action</h3>
         <p className="text-sm">{card.recommended_action}</p>
         <h3 className="font-bold mt-4">Status</h3>
         <p className={`font-bold ${card.pass_fail === "fail" ? "text-red-600" : "text-green-600"}`}>
           {card.pass_fail === "fail" ? "FAIL" : "PASS"}
         </p>
       </div>
     );
   }
   ```

2. Create `frontend/app/components/StandardCitation.tsx`:
   ```tsx
   export function StandardCitation({ standard }: { standard: any }) {
     return (
       <div className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4">
         <p className="text-xs font-bold text-blue-700">{standard.source}</p>
         <p className="text-xs text-blue-700">Clause: {standard.clause_id}</p>
         <p className="text-sm italic">{standard.text}</p>
       </div>
     );
   }
   ```

3. Create `frontend/app/components/StatusBanner.tsx`:
   ```tsx
   export function StatusBanner({ state, message }: { state: "loading" | "empty" | "success" | "error"; message?: string }) {
     const colors = {
       loading: "bg-blue-100",
       empty: "bg-gray-100",
       success: "bg-green-100",
       error: "bg-red-100"
     };
     return (
       <div className={`p-4 ${colors[state]} rounded`}>
         {state === "loading" && "Processing..."}
         {state === "empty" && "No defect detected above threshold."}
         {state === "error" && `Error: ${message}`}
       </div>
     );
   }
   ```

4. Update `frontend/app/page.tsx` to orchestrate the flow:
   ```tsx
   "use client";
   import { useState } from "react";
   import UploadPanel from "./components/UploadPanel";
   import { DefectCard } from "./components/DefectCard";
   import { StandardCitation } from "./components/StandardCitation";
   import { StatusBanner } from "./components/StatusBanner";

   export default function Home() {
     const [state, setState] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle");
     const [result, setResult] = useState<any>(null);
     const [error, setError] = useState<string>("");

     const handleUpload = async (file: File, productType: string) => {
       setState("loading");
       const formData = new FormData();
       formData.append("image", file);
       formData.append("product_type", productType);

       try {
         const res = await fetch("http://localhost:8000/api/inspect", {
           method: "POST",
           body: formData
         });
         const data = await res.json();
         
         if (data.error) {
           setState("error");
           setError(data.error);
         } else if (data.defect === "no_defect") {
           setState("empty");
         } else {
           setState("success");
           setResult(data);
         }
       } catch (err: any) {
         setState("error");
         setError(err.message);
       }
     };

     return (
       <div className="container mx-auto p-4">
         <h1 className="text-4xl font-bold my-4">InspectAI</h1>
         
         {state === "idle" && <UploadPanel onUpload={handleUpload} />}
         {state !== "idle" && <StatusBanner state={state} message={error} />}
         
         {state === "success" && result && (
           <>
             <DefectCard card={result} />
             <StandardCitation standard={result.cited_standard} />
             <button onClick={() => setState("idle")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
               New Inspection
             </button>
           </>
         )}
       </div>
     );
   }
   ```

**Acceptance criteria:**

* [ ] DefectCard displays all required fields (label, confidence, root_cause, action, status).
* [ ] StandardCitation highlights the cited clause visually.
* [ ] StatusBanner shows correct message for each state.
* [ ] Mobile responsive (single column on phone).
* [ ] "New Inspection" button clears state and resets form.
* [ ] No console errors.

**Test:**

```bash
cd frontend && npm run dev
# Upload an image via UI, verify the result card displays correctly
```

**Rollback:** Remove new components and revert `page.tsx`.

**Risk:** Styling may vary across browsers. Use Tailwind consistently; test on mobile.

---

## Block 8: Report Generation & Export

**Goal:** Implement report generation as HTML/PDF and an export endpoint.

**Files likely changed:**
* `frontend/app/components/Report.tsx` (new)
* `frontend/app/page.tsx` (updated)
* `backend/routers/inspect.py` (updated: add `/api/report` endpoint)

**Steps:**

1. Create `frontend/app/components/Report.tsx`:
   ```tsx
   export function Report({ card, imageUrl }: { card: any; imageUrl?: string }) {
     return (
       <div id="report" className="p-8 bg-white text-black">
         <h1 className="text-3xl font-bold mb-4">Inspection Report</h1>
         <p className="text-sm text-gray-500">{new Date().toISOString()}</p>
         
         {imageUrl && <img src={imageUrl} alt="Inspected garment" className="w-full max-w-sm my-4" />}
         
         <h2 className="text-xl font-bold mt-6">Defect</h2>
         <p>{card.defect.replace(/_/g, " ")} (Confidence: {(card.confidence * 100).toFixed(1)}%)</p>
         
         <h2 className="text-xl font-bold mt-6">Quality Standard</h2>
         <p><strong>{card.cited_standard.source}</strong> - Clause {card.cited_standard.clause_id}</p>
         <p>{card.cited_standard.text}</p>
         
         <h2 className="text-xl font-bold mt-6">Root Cause</h2>
         <p>{card.root_cause}</p>
         
         <h2 className="text-xl font-bold mt-6">Recommended Action</h2>
         <p>{card.recommended_action}</p>
         
         <h2 className="text-xl font-bold mt-6">Status</h2>
         <p className={`text-lg font-bold ${card.pass_fail === "fail" ? "text-red-600" : "text-green-600"}`}>
           {card.pass_fail === "fail" ? "FAIL" : "PASS"}
         </p>
       </div>
     );
   }
   ```

2. Add a "Generate Report" button in `frontend/app/page.tsx`:
   ```tsx
   const printReport = () => {
     const printWindow = window.open("", "", "width=800,height=600");
     const reportElement = document.getElementById("report");
     if (printWindow && reportElement) {
       printWindow.document.write(reportElement.innerHTML);
       printWindow.print();
     }
   };
   
   // Inside JSX:
   {state === "success" && result && (
     <>
       <Report card={result} />
       <button onClick={printReport} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
         Print / Download Report
       </button>
     </>
   )}
   ```

3. Add a backend endpoint in `backend/routers/inspect.py`:
   ```python
   @router.post("/api/report")
   async def generate_report(card: DefectCard):
       # Build HTML report
       html = f"""
       <html>
         <body style="font-family: Arial;">
           <h1>Inspection Report</h1>
           <p>Timestamp: {datetime.now().isoformat()}</p>
           <h2>Defect</h2>
           <p>{card.defect} (Confidence: {card.confidence:.1%})</p>
           <h2>Standard</h2>
           <p><strong>{card.cited_standard['source']}</strong> - {card.cited_standard['clause_id']}</p>
           <p>{card.cited_standard['text']}</p>
           <h2>Root Cause</h2>
           <p>{card.root_cause}</p>
           <h2>Action</h2>
           <p>{card.recommended_action}</p>
           <h2>Status</h2>
           <p>{card.pass_fail}</p>
         </body>
       </html>
       """
       return {"report_html": html, "generated_at": datetime.now().isoformat()}
   ```

**Acceptance criteria:**

* [ ] Report displays all defect card fields.
* [ ] Timestamp is included.
* [ ] Print button opens a printable window.
* [ ] Report is mobile-readable.
* [ ] No personal data is leaked.

**Test:**

```bash
# Visual test in frontend
cd frontend && npm run dev
# Generate a report and print/preview it
```

**Rollback:** Remove Report component and print button from page.tsx.

**Risk:** Print styling varies across browsers. Test print preview before demo.

---

## Block 9: Error Handling & Fallbacks

**Goal:** Add robust error handling and fallback behavior for model failures.

**Files likely changed:**
* `backend/routers/inspect.py` (updated)
* `backend/llm/root_cause.py` (updated)
* `frontend/app/page.tsx` (updated)

**Steps:**

1. Update vision model to handle failures:
   ```python
   try:
       vision_result = detector.detect(img)
   except Exception as e:
       vision_result = {
           "label": "detection_failed",
           "confidence": 0.0
       }
   ```

2. Update RAG to handle empty retrieval:
   ```python
   if not standards or len(standards) == 0:
       standards = [{
           "source": "Default",
           "clause_id": "0.0",
           "text": "No matching standard found. Manual review recommended."
       }]
   ```

3. Update LLM to handle JSON parse failures and use fallback:
   ```python
   def get_fallback_response(defect_label):
       return {
           "root_cause": f"Defect '{defect_label}' requires manual inspection.",
           "recommended_action": "Review by senior QA inspector.",
           "pass_fail": "fail",
           "cited_standard": {"source": "N/A", "clause_id": "N/A"}
       }
   ```

4. Wrap `/api/inspect` in try-catch:
   ```python
   @router.post("/inspect")
   async def inspect(...):
       try:
           # Full pipeline
           ...
       except Exception as e:
           return {
               "error": str(e),
               "stage": "unknown",
               "fallback_used": True,
               "defect": "inspection_error",
               "confidence": 0.0,
               "root_cause": "System error. Please retry.",
               "recommended_action": "Contact system administrator.",
               "pass_fail": "fail",
               "cited_standard": {"source": "N/A", "clause_id": "N/A"}
           }
   ```

5. Update frontend to display error gracefully:
   ```tsx
   {state === "error" && (
     <div className="p-4 bg-red-100 rounded">
       <h3 className="font-bold">Error</h3>
       <p>{error}</p>
       <button onClick={() => setState("idle")} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
         Try Again
       </button>
     </div>
   )}
   ```

**Acceptance criteria:**

* [ ] Backend gracefully handles vision model failure.
* [ ] Backend gracefully handles empty RAG retrieval.
* [ ] Backend gracefully handles LLM JSON parse failure.
* [ ] All errors return a valid DefectCard (with fallback fields).
* [ ] Frontend displays error message to user.
* [ ] "Try Again" button allows user to retry.

**Test:**

```bash
# Test with invalid image
curl -X POST -F "image=@nonexistent.jpg" http://localhost:8000/api/inspect
# expect: {"error": "...", "fallback_used": true, ...}

# Test with corrupted image data
# expect: graceful error response
```

**Rollback:** Remove error handling (revert to unguarded code).

**Risk:** Falling back too aggressively may mask real bugs. Log errors for debugging.

---

## Block 10: Demo Fallback & Pre-Cached Responses

**Goal:** Add pre-recorded inference results to ensure demo doesn't fail if models are slow or unavailable.

**Files likely changed:**
* `backend/data/demo_responses.json` (new)
* `backend/routers/inspect.py` (updated)
* `backend/main.py` (updated: add environment variable for demo mode)

**Steps:**

1. Create `backend/data/demo_responses.json` with 3 pre-recorded results:
   ```json
   {
     "demo_stain.jpg": {
       "defect": "stain",
       "confidence": 0.92,
       "cited_standard": {
         "source": "Buyer Spec v3",
         "clause_id": "4.2.1",
         "text": "Visible stains on visible areas are not acceptable."
       },
       "root_cause": "Likely water contamination during washing process.",
       "recommended_action": "Re-wash with clean water and re-inspect.",
       "pass_fail": "fail"
     },
     "demo_broken_stitch.jpg": {
       "defect": "broken_stitch",
       "confidence": 0.88,
       "cited_standard": {
         "source": "ISO 9001",
         "clause_id": "5.1.2",
         "text": "All stitching must be uniform, even, with no breaks or loose threads."
       },
       "root_cause": "Thread tension misconfiguration on the overlock machine.",
       "recommended_action": "Recalibrate thread tension and re-sample 5 units.",
       "pass_fail": "fail"
     }
   }
   ```

2. Update `backend/routers/inspect.py` to check for demo mode:
   ```python
   import os
   import json
   
   DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
   
   if DEMO_MODE:
       with open("backend/data/demo_responses.json") as f:
           DEMO_RESPONSES = json.load(f)
   
   @router.post("/inspect")
   async def inspect(...):
       # Check if filename is in demo set
       if DEMO_MODE and image.filename in DEMO_RESPONSES:
           return DEMO_RESPONSES[image.filename]
       
       # Otherwise, run full pipeline
       ...
   ```

3. Add startup instruction to README:
   ```bash
   # For demo mode (uses pre-recorded results):
   DEMO_MODE=true uvicorn main:app --reload
   
   # For live mode (runs actual models):
   uvicorn main:app --reload
   ```

**Acceptance criteria:**

* [ ] Demo image files have corresponding entries in `demo_responses.json`.
* [ ] DEMO_MODE environment variable enables/disables fallback.
* [ ] Frontend can upload demo images and get pre-recorded results instantly.
* [ ] Live mode still works with real models.

**Test:**

```bash
# Demo mode
DEMO_MODE=true uvicorn main:app --reload
# Upload demo_stain.jpg via UI → should return pre-recorded response instantly

# Live mode
uvicorn main:app --reload
# Upload any image → should run actual models
```

**Rollback:** Remove `demo_responses.json` and revert `inspect.py`.

**Risk:** Demo responses should match real model output format. Test both modes before the hackathon.

---

## Block 11: UI Polish & Mobile Responsiveness

**Goal:** Ensure the UI is visually polished, mobile-first, and ready for demo.

**Files likely changed:**
* `frontend/app/globals.css` (updated)
* `frontend/app/layout.tsx` (updated)
* `frontend/app/page.tsx` (updated)
* `frontend/app/components/*.tsx` (updated styling)

**Steps:**

1. Update `frontend/app/globals.css` for a professional look:
   ```css
   @import "tailwindcss/base";
   @import "tailwindcss/components";
   @import "tailwindcss/utilities";

   body {
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     min-height: 100vh;
     font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
   }

   .container {
     max-width: 600px;
   }

   .card {
     @apply bg-white rounded-lg shadow-lg p-6;
   }

   .button-primary {
     @apply px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600;
   }

   .button-success {
     @apply px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600;
   }

   .status-fail {
     @apply text-red-600 font-bold text-lg;
   }

   .status-pass {
     @apply text-green-600 font-bold text-lg;
   }
   ```

2. Add a mobile-first viewport meta tag in `frontend/app/layout.tsx`:
   ```tsx
   export const metadata = {
     title: "InspectAI",
     viewport: "width=device-width, initial-scale=1"
   };
   ```

3. Add loading spinner to UploadPanel:
   ```tsx
   {isLoading && (
     <div className="flex justify-center items-center py-8">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
     </div>
   )}
   ```

4. Test on mobile (use Chrome DevTools mobile emulation):
   - Verify single column layout.
   - Ensure buttons are large enough to tap.
   - Check text readability.

**Acceptance criteria:**

* [ ] UI uses a cohesive color scheme.
* [ ] All buttons are clearly labeled and large (>40px height).
* [ ] Form inputs are touch-friendly on mobile.
* [ ] No horizontal scrolling on 375px width.
* [ ] Loading spinners show during inference.
* [ ] Empty and error states have clear messaging.
* [ ] Report is printable and readable.

**Test:**

```bash
cd frontend && npm run dev
# Open in Chrome DevTools, toggle device emulation to iPhone/Android
# Test upload flow, verify responsiveness
```

**Rollback:** Revert CSS and component styling.

**Risk:** Over-styling can bloat CSS. Keep Tailwind concise; avoid custom CSS where Tailwind covers it.

---

## Block 12: Demo Script & Acceptance Checklist

**Goal:** Document the 2-minute demo flow and run final acceptance checks.

**Files likely changed:**
* `DEMO_SCRIPT.md` (new)
* `README.md` (updated)
* Acceptance checklist verification (manual)

**Steps:**

1. Create `DEMO_SCRIPT.md`:
   ```markdown
   # InspectAI Demo Script (2 minutes)

   ## Problem Statement (20 seconds)
   - "Bangladesh's garment exports are worth billions, but QA depends on slow, subjective manual inspection."
   - "Failed buyer audits cost contracts and livelihoods."

   ## Demo Setup (10 seconds)
   - Open frontend at http://localhost:3000 on a phone screen (or desktop emulating mobile).
   - Demo mode enabled: `DEMO_MODE=true` for instant responses.

   ## Flow: Upload → Detect → Cite → Explain (60 seconds)
   1. Show upload panel with the product type dropdown.
   2. Upload `demo_stain.jpg` (a defective garment photo).
   3. Show loading spinner briefly (or skip if pre-cached).
   4. Display defect card: **Stain detected** with 92% confidence.
   5. Highlight the cited standard clause (proves grounding!): "Visible stains on visible areas are not acceptable" — Buyer Spec v3, Clause 4.2.1.
   6. Show root-cause: "Water contamination during washing."
   7. Show recommended action: "Re-wash and re-inspect."
   8. Show status: **FAIL**.
   9. Click "Generate Report" to show printable audit trail.

   ## Impact Statement (30 seconds)
   - "In seconds, a junior inspector produces an expert, grounded, audit-ready verdict."
   - "This runs offline, on a single 16GB GPU — no cloud cost, no connectivity required."
   - "InspectAI turns scarce expertise into a standard every production line can run."

   ## Closing (5 seconds)
   - "Bangladesh's garment industry stays competitive by automating QA."
   ```

2. Update `README.md`:
   ```markdown
   # InspectAI

   Offline garment QA inspection with defect detection, standards-grounded root-cause analysis, and audit-ready reports.

   ## Setup

   ### Backend
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

   ### Frontend
   ```bash
   cd frontend
   npm install
   ```

   ## Run

   ### Terminal 1: Backend
   ```bash
   cd backend
   source venv/bin/activate
   DEMO_MODE=true uvicorn main:app --reload
   ```

   ### Terminal 2: Frontend
   ```bash
   cd frontend
   npm run dev
   ```

   Open http://localhost:3000 in your browser.

   ## Demo Images

   Place demo images in `backend/data/demo_images/`:
   - `demo_stain.jpg`
   - `demo_broken_stitch.jpg`

   Upload these to trigger instant pre-recorded responses.

   ## Project Structure

   - `frontend/` — Next.js React app
   - `backend/` — FastAPI server with vision, RAG, LLM
   - `models/` — Vision classifier and FAISS index
   - `data/` — Standards corpus and demo images

   ## Tech Stack

   - **Frontend:** Next.js, React, Tailwind CSS
   - **Backend:** FastAPI, Python
   - **Vision:** ResNet18 (or fine-tuned model)
   - **RAG:** Sentence-BERT + FAISS
   - **LLM:** Mistral-7B-4bit (or compatible)

   ## Demo

   See `DEMO_SCRIPT.md` for a 2-minute judge-facing flow.
   ```

3. Run final acceptance checklist:
   ```
   - [ ] Main flow works end-to-end (upload → detect → cite → report).
   - [ ] UI is demo-ready (mobile, responsive, no console errors).
   - [ ] `/api/inspect` returns stable, schema-valid response.
   - [ ] LLM fallback exists and handles invalid JSON.
   - [ ] Error and empty states are gracefully handled.
   - [ ] README explains how to run the project from scratch.
   - [ ] DEMO_MODE works with pre-recorded responses.
   - [ ] Print report looks professional.
   - [ ] All dependencies are documented (requirements.txt, package.json).
   ```

**Acceptance criteria:**

* [ ] DEMO_SCRIPT.md is written and timed to 2 minutes.
* [ ] README is complete and tested.
* [ ] All acceptance checklist items pass.
* [ ] No console errors or warnings.
* [ ] Demo runs smoothly on a laptop with DEMO_MODE=true.

**Test:**

```bash
# Run through the full demo script manually
DEMO_MODE=true uvicorn main:app --reload  # Backend
npm run dev  # Frontend
# Upload demo_stain.jpg and verify all UI states display correctly
# Print report and verify formatting
```

**Rollback:** This is the final block; rollback only if critical bugs are found in earlier blocks.

**Risk:** Timing the demo to exactly 2 minutes requires practice. Rehearse before the hackathon.

---

## Summary

**Total expected effort:** ~20–30 hours for a solo developer.

**Build order:**
1. Setup (structure & boilerplate)
2. Upload UI (frontend foundation)
3. Image endpoint (backend foundation)
4. Vision (ML integration)
5. RAG (grounding)
6. LLM (reasoning)
7. Result UI (frontend display)
8. Report (export)
9. Errors (reliability)
10. Demo fallback (demo safety)
11. Polish (UX)
12. Final checks (demo readiness)

**Key risks to manage:**
- Model load times and memory (test on Kaggle T4 early).
- LLM hallucination (strict RAG grounding + JSON schema).
- Demo failure (DEMO_MODE fallback is critical).
- UI responsiveness (test on phone early and often).
