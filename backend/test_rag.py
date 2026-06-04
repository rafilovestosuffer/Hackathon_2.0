#!/usr/bin/env python
"""Quick test for RAG module."""

from rag.index import StandardsIndex

print("Testing StandardsIndex...")
try:
    idx = StandardsIndex("data/standards/standards.txt")
    print(f"[OK] Standards loaded: {len(idx.standards)}")
    print(f"[OK] Index built: {idx.index is not None}")

    # Test retrieval
    results = idx.retrieve("stain", k=3)
    print(f"[OK] Retrieved {len(results)} standards for 'stain'")

    if results:
        for i, r in enumerate(results):
            print(f"  {i+1}. {r['source']} - Clause {r['clause_id']}")

    print("\nTest passed!")
except Exception as e:
    print(f"[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()
