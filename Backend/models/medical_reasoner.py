import dspy
from signatures.diagnose import DiagnoseSignature

class MedicalReasoner(dspy.Module):
    def __init__(self):
        super().__init__()
        self.predict_step = dspy.ChainOfThought(DiagnoseSignature)

    def forward(self, symptoms, retrieved_cases):
        return self.predict_step(
            symptoms=symptoms,
            retrieved_cases=retrieved_cases
        )
