from pydantic import BaseModel

class ConsultRequest(BaseModel):
    symptoms: str
