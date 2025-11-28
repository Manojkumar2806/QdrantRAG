import dspy

class DiagnoseSignature(dspy.Signature):
    """LLM must return structured medical analysis."""

    symptoms = dspy.InputField()
    retrieved_cases = dspy.InputField()

    reasoning = dspy.OutputField(desc="step-by-step medical reasoning")
    diagnosis = dspy.OutputField()
    recommendations = dspy.OutputField()
    danger_signs = dspy.OutputField()
