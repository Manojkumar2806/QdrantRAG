from pydantic import BaseModel

class SymptomRequest(BaseModel):
    symptoms: str


class AskRequest(BaseModel):
    question: str
    n_results: int = 5
