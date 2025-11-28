import json
from models.semantic_memory import SemanticMedicalMemory

memory = SemanticMedicalMemory()

with open("data/medical_cases.json") as f:
    cases = json.load(f)

for case in cases:
    memory.add_case(case["id"], case["text"])

print("✅ Medical memory loaded successfully.")
