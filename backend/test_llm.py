#!/usr/bin/env python
"""Quick test for LLM module."""

from llm.root_cause import RootCauseAnalyzer
from llm.prompts import get_root_cause_prompt

print("Testing RootCauseAnalyzer...")
try:
    analyzer = RootCauseAnalyzer()
    print("[OK] Analyzer initialized")

    # Test with a sample standard
    standards = [
        {
            "source": "Buyer Spec v3",
            "clause_id": "4.2.1",
            "text": "Visible stains on visible areas are not acceptable."
        }
    ]

    # Generate prompt
    prompt = get_root_cause_prompt("stain", 0.85, standards, "shirt")
    print("[OK] Prompt generated")

    # Test analysis
    result = analyzer.analyze(prompt, "stain", standards)
    print("[OK] Analysis completed")

    # Verify result structure
    required_keys = {"root_cause", "recommended_action", "pass_fail", "cited_standard"}
    if required_keys.issubset(result.keys()):
        print("[OK] Result has all required fields")
    else:
        print(f"[FAIL] Missing fields: {required_keys - set(result.keys())}")

    # Verify cited_standard has source and clause_id
    if "source" in result["cited_standard"] and "clause_id" in result["cited_standard"]:
        print("[OK] cited_standard structure valid")
    else:
        print("[FAIL] cited_standard missing required fields")

    # Print result
    print("\nGenerated Analysis:")
    print(f"  Root Cause: {result['root_cause'][:60]}...")
    print(f"  Action: {result['recommended_action'][:60]}...")
    print(f"  Status: {result['pass_fail']}")
    print(f"  Cited Standard: {result['cited_standard']['source']} - {result['cited_standard']['clause_id']}")

    print("\nTest passed!")

except Exception as e:
    print(f"[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()
