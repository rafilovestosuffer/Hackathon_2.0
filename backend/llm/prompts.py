"""Prompt templates for root-cause analysis."""


def get_root_cause_prompt(defect_label: str, confidence: float, standards: list, product_type: str) -> str:
    """
    Generate a prompt for LLM root-cause analysis.

    Args:
        defect_label: Detected defect type (e.g., "stain")
        confidence: Confidence score [0.0, 1.0]
        standards: List of relevant standards with keys: source, clause_id, text
        product_type: Type of product being inspected (e.g., "shirt")

    Returns:
        Formatted prompt string for LLM
    """
    # Format standards into readable text
    standard_text = "\n".join([
        f"- Source: {s['source']}, Clause: {s['clause_id']}\n  {s['text']}"
        for s in standards
    ]) if standards else "No standards found."

    prompt = f"""You are a garment QA compliance assistant. Your task is to analyze a detected defect and provide grounded recommendations based on quality standards.

Defect Detected: {defect_label.replace('_', ' ').title()}
Confidence Level: {confidence:.1%}
Product Type: {product_type.title()}

Relevant Quality Standards:
{standard_text}

Instructions:
1. Analyze why this defect likely occurred in the production process
2. Recommend a specific corrective action
3. Determine if the garment should PASS or FAIL inspection
4. Cite one of the standards above (do NOT invent new standards)

Generate a JSON response with exactly this structure:
{{
  "root_cause": "One or two sentences explaining why this defect likely occurred.",
  "recommended_action": "One specific action to fix this issue.",
  "pass_fail": "fail",
  "cited_standard": {{"source": "Standard source name", "clause_id": "clause ID"}}
}}

IMPORTANT:
- Only cite standards from the list above
- Use JSON format only, no other text
- Set pass_fail to 'fail' if defect detected, 'pass' if no defect"""

    return prompt


def get_fallback_response(defect_label: str) -> dict:
    """
    Get a fallback response when LLM is unavailable.

    Args:
        defect_label: Detected defect type

    Returns:
        Dictionary with root cause analysis fields
    """
    fallback_text = defect_label.replace("_", " ").lower()

    return {
        "root_cause": f"The detected {fallback_text} indicates a quality issue that requires attention.",
        "recommended_action": "Perform a detailed inspection and remediate according to quality standards.",
        "pass_fail": "fail" if defect_label != "no_defect" else "pass",
        "cited_standard": {
            "source": "Quality Assurance",
            "clause_id": "0.0"
        }
    }
