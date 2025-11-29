from fastapi import APIRouter
from schema.request import ConsultRequest
from models.semantic_memory import SemanticMedicalMemory, search_qdrant
from models.medical_reasoner import MedicalReasoner
from models.next_questions import NextQuestions
from models.escalation_detector import EscalationDetector
from models.request_models import AskRequest
from utils.genai_wrapper import ask_perplexity
from utils.qdrant_connection import COLLECTION_NAME

router = APIRouter()

memory = SemanticMedicalMemory()
reasoner = MedicalReasoner()
questioner = NextQuestions()
escalation = EscalationDetector()


def format_retrieved_cases(hits):
    """
    Convert Qdrant vector search results into clean strings
    that can be used in DSPy prompting.
    """

    if not hits:
        return "No similar medical cases found."

    visible = []
    internal = []

    for h in hits:
        # visible high-level case summary
        visible.append(f"Case: {h['text']}")

        # internal reasoning (not shown to patient directly)
        if h.get("complex_cot"):
            internal.append(h["complex_cot"])

    visible_block = "\n\n".join(visible)
    internal_block = "\n\n".join(internal)

    final_text = (
        "Relevant medical cases:\n" + visible_block +
        ("\n\nInternal clinical reasoning snippets:\n" + internal_block 
         if internal_block else "")
    )

    return final_text


@router.post("/consult")
async def consult(req: ConsultRequest):
    symptoms = req.symptoms

    # Retrieve from Qdrant
    hits = memory.query(symptoms)

    # Convert retrievals for LLM input
    retrieved_cases = format_retrieved_cases(hits)

    # DSPy Reasoner
    result = reasoner(
        symptoms=symptoms,
        retrieved_cases=retrieved_cases
    )

    # Next questions
    next_q = questioner(symptoms=symptoms)

    # Emergency check
    emergency = escalation.check(symptoms)

    return {
        "reasoning": result.reasoning,
        "diagnosis": result.diagnosis,
        "recommendations": result.recommendations,
        "danger_signs": result.danger_signs,
        "next_questions": next_q.questions,
        "is_emergency": emergency
    }



@router.post("/ask/")
async def ask(req: AskRequest):
    # search returns list of points (1.7.3)
    results = search_qdrant(req.question, top=req.n_results or 5)

    if not results:
        return {"answer": "No files yet!", "suggested_questions": ["Upload something!"]}

    context = "\n\n".join((getattr(p, "payload", {}).get("text", "") for p in results))
    answer = ask_perplexity(f"Context:\n{context}\n\nQuestion: {req.question}\nAnswer clearly:")

    raw = ask_perplexity(f"Give exactly 3 smart follow-up very short questions for:\n\nUser: {req.question}\nContent: {context[:6000]}")
    suggested = []
    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith(("1.", "2.", "3.", "1)", "2)", "3)")) and len(suggested) < 3:
            parts = line.split(maxsplit=1)
            q = parts[1] if len(parts) > 1 else line[2:]
            q = q.strip(' .)"\'')
            if len(q) > 8:
                suggested.append(q)
    if len(suggested) < 3:
        suggested = ["Can you explain more?", "What else should I know?", "Summarize the key points?"]

    sources = []
    for p in results:
        payload = getattr(p, "payload", {}) or {}
        text_preview = payload.get("text", "")
        if len(text_preview) > 500:
            text_preview = text_preview[:500] + "..."
        sources.append({
            "text": text_preview,
            "file": payload.get("file"),
            "type": payload.get("type"),
            "score": round(getattr(p, "score", 0.0), 4)
        })

    return {
        "question": req.question,
        "answer": answer,
        "sources": sources,
        "suggested_questions": suggested
    }
