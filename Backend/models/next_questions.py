import dspy

class NextQuestions(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate = dspy.Predict("symptoms -> questions")

    def forward(self, symptoms):
        res = self.generate(symptoms=symptoms)
        return res
