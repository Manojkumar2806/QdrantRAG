import dspy

class EscalationDetector(dspy.Module):
    def __init__(self):
        super().__init__()
        self.checker = dspy.Predict("symptoms -> is_emergency")

    def check(self, symptoms):
        res = self.checker(symptoms=symptoms)
        text = (str(res).lower())

        return any(k in text for k in [
            "emergency", "urgent", "critical", "danger"
        ])
