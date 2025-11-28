import dspy
import os

api_key = os.environ.get("GEMINI_API_KEY")

dspy.configure(
    lm=dspy.LM(
        model="gemini/gemini-2.5-flash",
        api_key=api_key,
        max_output_tokens=4096
    )
)

print("✔️ DSPy configured with Gemini 2.5 Flash")
