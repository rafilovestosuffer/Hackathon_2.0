# CLAUDE.md – InspectAI Implementation Rules

This file defines how Claude Code should implement InspectAI. It is the source of truth for coding behavior during development.

---

## Project Context

**InspectAI** is a solo hackathon MVP (DIU National AI Hackathon, July 2026) combining vision, RAG, and LLM to produce audit-ready garment-defect reports.

**Build priority:**
1. Working demo (over perfect code).
2. Small, safe changes (over large rewrites).
3. Block-by-block implementation (over full-stack coding).
4. Clear testing (over edge cases).
5. Offline reliability (over cloud integration).

**Compute constraint:** Free-tier Kaggle (16GB VRAM, T4/P100 GPU).

**Demo goal:** 2-minute live flow: upload image → detect → cite standard → explain → report.

---

## Source of Truth

Read these files **before** implementing any block:

1. **PRD.md** — Product requirements, MVP scope, acceptance criteria.
2. **TASKS.md** — Block-by-block implementation plan.
3. **ARCHITECTURE.md** — System design, data flow, module responsibilities.
4. **CLAUDE.md** — This file; coding behavior rules.

**Priority if files conflict:**
1. User's latest instruction (in the current message).
2. TASKS.md (the active block description).
3. PRD.md (product requirements).
4. CLAUDE.md (general coding rules).

---

## Workflow

Follow this workflow **strictly**:

1. **Read the assigned block from TASKS.md.** Understand the goal, steps, acceptance criteria, and risks.
2. **Implement exactly one block.** Do not implement future blocks or nice-to-have features.
3. **Make only changes needed for that block.** Do not refactor unrelated files.
4. **Run the test command specified in the block.** Verify it passes.
5. **Report:** Changed files, test result, risks noted, and next step.
6. **Wait for the next user command.** Do not proceed to the next block unless instructed.

**No exceptions.** Do not implement future blocks, add abstraction, or improve unrelated code.

---

## Coding Rules

### 1. Do Not Modify Unrelated Files
- Implement only files specified in the block's "Files likely changed" section.
- Do not refactor `utils/`, `helpers/`, or other modules unless explicitly required.
- Do not change the overall project structure without approval.

### 2. Keep the Tech Stack Fixed (Unless Told Otherwise)
- **Frontend:** Next.js + React + Tailwind CSS.
- **Backend:** FastAPI + Python.
- **Vision:** PyTorch + torchvision (or pre-trained model).
- **RAG:** FAISS + Sentence-BERT.
- **LLM:** Transformers + quantized model.

Do not add new libraries (e.g., Redux, GraphQL, Postgres) without explicit approval.

### 3. Add Dependencies Carefully
- Document new dependencies in `requirements.txt` (backend) or `package.json` (frontend).
- Test that the dependency is available on free-tier Kaggle before adding it.
- Prefer libraries that are lightweight and work on 16GB VRAM.

### 4. No Hardcoded Secrets or API Keys
- Use environment variables for all sensitive data.
- Example: `os.getenv("HF_MODEL_ID", "default-model")`.
- Never commit `.env` files with real values.

### 5. Prefer Simple, Maintainable Code
- Avoid premature abstraction (3 lines of duplication is OK).
- Keep functions < 50 lines where possible.
- Use descriptive variable names (not `x`, `tmp`, `result`).
- Comment only when the WHY is non-obvious.

### 6. Keep the MVP Demo-Safe
- **Never** break existing working features when adding new ones.
- **Always** add fallback/mock behavior for AI/API failures.
- **Always** include error states (loading, empty, error, success).
- **Always** include a "Try Again" or "New Inspection" button.

### 7. Add Loading, Empty, Error, Success States for UI Work
- Frontend must show:
  - **Loading:** Spinner, "Processing..." message.
  - **Empty:** "No defect detected." button to try again.
  - **Success:** DefectCard with full details.
  - **Error:** Error banner with "Try Again" button.
- Backend must return:
  - 200 JSON for success.
  - 400 JSON with `error` field for bad input.
  - 500 JSON with `error` field for server error.

### 8. Preserve Existing Working Behavior
- If a block changes a module that already works, ensure the old behavior still works.
- Example: If Block 3 adds validation to `/api/inspect`, ensure Block 2's stub endpoint still accepts files.

### 9. No Comments on What Code Does
- Code should be self-explanatory through naming.
- OK to comment: hidden constraints, workarounds, subtle bugs, non-obvious invariants.
- Not OK: "// get user email", "// loop through items", "// handle error".

### 10. No Half-Finished Implementations
- Do not commit code marked `TODO`, `FIXME`, or `WIP` unless the block explicitly allows it.
- If a block requires incomplete work, mark it in the acceptance criteria as "defer to next block."

---

## Testing Rules

### Run Only Relevant Commands

After each block, run **only** tests specified in the block's "Test" section.

**Common test commands (only if configured):**
```bash
# Frontend
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run build         # Next.js build
npm run dev           # Dev server (manual test)
npm test              # Jest (if configured)

# Backend
python -m compileall .  # Python syntax check
pytest                  # Unit tests (if configured)
python -m mypy .        # Type checking (if configured)
```

**Do not run tests that are not configured.** If the repo has no `npm test` script, do not try to run it.

### Manual Testing for UI Changes

For frontend/UI blocks:
1. Run `npm run dev` and open the app in a browser.
2. Test the feature described in the block (upload, display, click button, etc.).
3. Check the browser console for errors (no red errors).
4. Test on mobile (Chrome DevTools mobile emulation, 375px width).
5. Test the error case (e.g., upload a non-image file).

Document what you tested in the "Test result" section.

---

## Final Response Format

After completing each block, respond with:

```markdown
# Block Completed: [Block Name]

## What changed

- [One bullet point per file/change]

## Files changed

| File | Change |
|---|---|
| path/to/file | Added new component |
| path/to/file | Updated endpoint |

## Commands run

\`\`\`bash
command1
command2
\`\`\`

## Test result

* Status: PASS / FAIL / SKIPPED
* Details: [brief notes, e.g. "Spinner displays, result card renders, mobile responsive"]

## Risks / limitations

* [Any concerns for the next block or demo]

## Next recommended step

* [What to implement next, per TASKS.md]
```

---

## Special Cases

### Demo Mode
- If the block includes DEMO_MODE, test both live and demo modes.
- Verify that `DEMO_MODE=true` returns pre-cached responses.
- Verify that `DEMO_MODE=false` (or unset) runs the live pipeline.

### Kaggle Notebooks
- Assume the implementation will run on free-tier Kaggle (T4 GPU, 16GB RAM).
- Do not download large model files unless they fit in 16GB.
- Do not use GPU-only libraries without a CPU fallback.
- Test model loading time; if > 2 minutes, optimize or pre-cache.

### Error Handling
- Always return valid JSON for errors (not HTML or plain text).
- Always include an `error` field and optionally a `stage` field.
- Backend should never crash and return a 500 without a JSON body.

### Pre-Caching and Warmup
- If a block loads a large model (LLM, vision), pre-load it at startup.
- Document in the block's test section: "Model loads at startup in X seconds."

---

## Non-Negotiable Rules

- ❌ **Never implement multiple blocks** unless explicitly asked in a single message.
- ❌ **Never start future features early.** (e.g., batch upload, auth) unless PRD says they're must-haves.
- ❌ **Never perform large rewrites** without permission. (Small refactors within a block are OK.)
- ❌ **Never remove working code** unless required by the current block.
- ❌ **Never commit changes** unless the user explicitly asks (e.g., "create a commit").
- ❌ **Never use `/no-verify` on git hooks** unless the user explicitly asks.
- ❌ **Never add abstraction** beyond what the block requires. (Don't design for hypothetical future.)
- ❌ **Never ignore the TASKS.md block structure.** (It's the agreed-upon plan.)

---

## When to Ask for Clarification

Ask the user if:

1. **The block spec is ambiguous.** ("Do you want me to add X before Y?")
2. **You discover a bug in an existing block.** ("Block 3 has an issue with validation. Should I fix it?")
3. **A dependency is not available on Kaggle.** ("Library X is not available on free-tier Kaggle. Should I use Y instead?")
4. **A risk is too high to proceed alone.** ("This requires resetting the DB. Should I proceed?")
5. **The user changes the requirements mid-block.** ("The PRD was updated. Should I restart or continue?")

Do **not** ask about:
- Style preferences (use Tailwind, no custom CSS for MVP).
- Code formatting (use consistent naming, no extra comments).
- Testing (run the tests specified in the block).
- Nice-to-have features (they're explicitly deferred post-MVP).

---

## Acceptance Criteria Review

Before marking a block complete, verify:

- [ ] Code runs without crashes.
- [ ] No obvious broken imports or syntax errors.
- [ ] Main feature (from block goal) is implemented.
- [ ] Error state is handled.
- [ ] UI is still usable (if frontend block).
- [ ] No secrets committed.
- [ ] PRD requirements are respected.
- [ ] Test command passes (or is skipped if not configured).

---

## Example: Block Implementation Flow

**User:** "Implement Block 2: Frontend – Upload Panel Component"

**Claude Code:**
1. Reads Block 2 from TASKS.md.
2. Creates `frontend/app/components/UploadPanel.tsx`.
3. Updates `frontend/app/page.tsx` to include UploadPanel.
4. Runs `npm run dev` and manually tests upload behavior.
5. Tests on mobile (DevTools).
6. Tests error case (upload non-image, oversized file).
7. Reports:
   ```markdown
   # Block Completed: Frontend – Upload Panel Component

   ## What changed
   - Created UploadPanel component with file input, validation, and product type dropdown.
   - Updated home page to display UploadPanel on initial load.

   ## Files changed
   | File | Change |
   |---|---|
   | frontend/app/components/UploadPanel.tsx | New component |
   | frontend/app/page.tsx | Import and render UploadPanel |

   ## Commands run
   ```bash
   cd frontend && npm run dev
   ```

   ## Test result
   - Status: PASS
   - Tested: Upload field accepts images, rejects non-images, shows file name, disabled until file selected, mobile responsive.

   ## Risks / limitations
   - Client-side validation only (Block 3 adds server-side validation).

   ## Next recommended step
   - Implement Block 3: Backend – Image Upload Endpoint.
   ```
8. **Waits** for the user's next command (does not proceed to Block 3).

---

## Quick Reference

| Situation | Action |
| --------- | ------ |
| User says "implement Block X" | Read TASKS.md Block X, implement it, test it, report, wait. |
| You find a bug in a previous block | Ask if you should fix it, or note it for the user. |
| Block spec is unclear | Ask for clarification before implementing. |
| A library is unavailable | Ask before substituting. |
| You finish early | Report the block as complete, ask what's next. |
| User provides new instruction mid-block | Follow the new instruction; update the plan if needed. |
| Test command fails | Debug, fix, rerun test, report failure + fix. |
| Multiple blocks are requested in one message | Implement all of them; report each separately. |
| Nice-to-have features are mentioned | Defer them; focus on the must-haves in the PRD. |

---

## Final Note

Your job is to **turn the PRD into a working demo**, block by block, as fast as safely possible. The user will guide you through TASKS.md. Your job is to implement, test, and get out of the way so the user can iterate quickly.

**Do not overthink. Follow the plan. Build the demo.**
