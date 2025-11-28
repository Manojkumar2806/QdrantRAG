import dspy

class DiagnoseSignature(dspy.Signature):
    """Medical diagnostic reasoning with structured JSON output."""
    
    symptoms = dspy.InputField(desc="User's described symptoms")
    retrieved_cases = dspy.InputField(desc="Similar medical cases from vector DB")
    
    reasoning = dspy.OutputField(desc="Step-by-step clinical reasoning leading to diagnosis")
    diagnosis = dspy.OutputField(desc="Most likely medical condition")
    recommendations = dspy.OutputField(desc="Suggested care and what to do next")
    danger_signs = dspy.OutputField(desc="Red-flag symptoms requiring emergency care")
    next_questions = dspy.OutputField(desc="Follow-up questions to refine diagnosis")
    is_emergency = dspy.OutputField(desc="Boolean: whether this may be an emergency")
