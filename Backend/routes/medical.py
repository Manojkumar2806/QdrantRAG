import os
import io
import uuid
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
import PyPDF2
from docx import Document
from typing import List

# ---------- Gemini ----------
import google.generativeai as genai

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if not GOOGLE_API_KEY:
    raise RuntimeError("Set GOOGLE_API_KEY first")

genai.configure(api_key=GOOGLE_API_KEY)
GEMINI = genai.GenerativeModel("gemini-2.5-flash")

# ---------- Qdrant 1.7.3 + FastEmbed ----------
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding

COLLECTION_NAME = "Health_QA_CoT"
DIM = 384

EMBEDDING = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

CLIENT = QdrantClient(":memory:")

def collection_exists(name):
    try:
        CLIENT.get_collection(name)
        return True
    except:
        return False

if not collection_exists(COLLECTION_NAME):
    CLIENT.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE)
    )

# ---------- Router ----------
router = APIRouter()

ALLOWED_EXTS = {"pdf", "docx", "png", "jpg", "jpeg", "webp"}

PREDEFINED_SUGGESTIONS = [
    "Summarize the given given document.",
    "Give the overview of the given document?",
    "What are the key findings from the document?"
]

MEDICAL_KEYWORDS = [
    "patient","diagnosis","scan","mri","ct","xray","symptom","treatment",
    "doctor","medication","blood","report","prescription","test","clinic"
]


# ---------- Models ----------
class AskRequest(BaseModel):
    question: str
    n_results: int = 5


# ---------- TEXT EXTRACTORS ----------
def extract_text_from_image(data: bytes):
    try:
        image = Image.open(io.BytesIO(data))
        resp = GEMINI.generate_content([
            "Extract ALL medical text from this image. Return ONLY the text.",
            image
        ])
        return resp.text.strip() if resp and resp.text else ""
    except:
        return ""


def extract_text_from_pdf(data: bytes):
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        return "\n".join([(p.extract_text() or "") for p in reader.pages])
    except:
        return ""


def extract_text_from_docx(data: bytes):
    try:
        doc = Document(io.BytesIO(data))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except:
        return ""


def extract_text(file_bytes: bytes, ext: str):
    ext = ext.lower()
    if ext in ["png", "jpg", "jpeg", "webp"]:
        return extract_text_from_image(file_bytes)
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    if ext == "docx":
        return extract_text_from_docx(file_bytes)
    return ""


# ---------- HELPERS ----------
def is_medical(text: str):
    text = text.lower()
    return any(k in text for k in MEDICAL_KEYWORDS)


def chunk_text(text: str, chunk=350, step=300) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        c = " ".join(words[i:i+chunk])
        if c.strip():
            chunks.append(c)
        i += step
    return chunks or ["[EMPTY]"]


# ---------------------------- UPLOAD --------------------------------
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = file.filename.lower().split(".")[-1]
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, "Only pdf, docx, png, jpg, jpeg, webp allowed.")

    raw = await file.read()
    text = extract_text(raw, ext)

    if not text.strip():
        raise HTTPException(400, "Unable to extract text from file.")

    if not is_medical(text):
        raise HTTPException(400, "Document does not appear medical. Only medical files allowed.")

    chunks = chunk_text(text)
    points = []

    for c in chunks:
        vec = list(EMBEDDING.embed([c]))[0].tolist()
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={"text": c, "file": file.filename}
        ))

    CLIENT.upsert(collection_name=COLLECTION_NAME, points=points)

    return {
        "status": "success",
        "file": file.filename,
        "chunks": len(chunks),
        "suggested_questions": PREDEFINED_SUGGESTIONS
    }


# ---------------------------- ASK --------------------------------
@router.post("/ask")
async def ask(req: AskRequest):
    qvec = list(EMBEDDING.embed([req.question]))[0]
    results = CLIENT.search(
        collection_name=COLLECTION_NAME,
        query_vector=qvec,
        limit=req.n_results
    )

    # If no retrieved results → fallback LLM
    if not results:
        resp = GEMINI.generate_content([
            "You are a safe medical assistant. "
            "Answer cautiously using general medical knowledge. Recommend clinical verification.",
            req.question
        ])
        answer = resp.text.strip() if resp and resp.text else "Unable to answer."
        
        # Generate dynamic suggestions even for no results
        context = "No documents available."
        sugg_resp = GEMINI.generate_content([
            "Generate exactly 3 smart short follow-up questions based on this medical question.",
            f"Original question: {req.question}"
        ])
        suggested = parse_suggestions(sugg_resp.text)
        
        return {
            "question": req.question,
            "answer": answer,
            "sources": [],
            "source_type": "LLM",
            "suggested_questions": suggested
        }

    # Build context
    sources = []
    context = ""
    max_score = 0

    for r in results:
        text = r.payload.get("text", "")
        score = r.score or 0
        max_score = max(max_score, score)

        sources.append({
            "text": text[:350] + ("..." if len(text) > 350 else ""),
            "file": r.payload.get("file"),
            "score": round(score, 4)
        })

        context += text + "\n\n"

    # Generate dynamic suggestions FIRST (works for all cases)
    sugg_resp = GEMINI.generate_content([
        "Generate exactly 3 smart, specific follow-up short questions for this medical query. "
        "Make them relevant to the context and question. Number them 1., 2., 3.",
        f"Context (from medical documents):\n{context[:4000]}",
        f"User Question: {req.question}"
    ])
    suggested_questions = parse_suggestions(sugg_resp.text)

    # Weak retrieval → fallback LLM
    if max_score < 0.15:
        resp = GEMINI.generate_content([
            "You are a cautious medical assistant. Retrieved documents are weak. "
            "Use content only if clearly relevant. Otherwise answer using safe medical knowledge.",
            f"Documents:\n{context[:3000]}",
            f"Question:\n{req.question}"
        ])
        answer = resp.text.strip() if resp and resp.text else "Unable to answer."
        return {
            "question": req.question,
            "answer": answer,
            "sources": sources,
            "source_type": "LLM_FALLBACK",
            "suggested_questions": suggested_questions
        }

    # Strong retrieval → RAG answer
    resp = GEMINI.generate_content([
        "You are a medical assistant. Use ONLY the context below. "
        "Do NOT hallucinate. If answer is unclear, say so.",
        f"Context:\n{context[:8000]}",
        f"Question:\n{req.question}"
    ])
    answer = resp.text.strip() if resp and resp.text else "Unable to answer."

    return {
        "question": req.question,
        "answer": answer,
        "sources": sources,
        "source_type": "DOCUMENT",
        "suggested_questions": suggested_questions
    }

def parse_suggestions(raw_text: str) -> List[str]:
    """Parse Gemini response to extract exactly 3 clean questions."""
    suggested = []
    lines = raw_text.split("\n")
    
    for line in lines:
        line = line.strip()
        if line.startswith(("1.", "2.", "3.", "1)", "2)", "3)")) and len(suggested) < 3:
            # Extract question after numbering
            parts = line.split(maxsplit=1)
            q = parts[1] if len(parts) > 1 else line[2:]
            q = q.strip(" .)\"'").strip()
            if len(q) > 8:  # Ensure meaningful length
                suggested.append(q)
    
    # Fallback if parsing fails
    while len(suggested) < 3:
        suggested.append("What are the treatment options?")
    
    return suggested[:3]

# ---------------------------- CLEAR --------------------------------
@router.post("/clear")
async def clear():
    CLIENT.delete_collection(collection_name=COLLECTION_NAME)
    CLIENT.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE)
    )
    return {"status": "cleared"}


# ---------------------------- MAIN APP --------------------------------
app = FastAPI(title="MedSage – Medical RAG")

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"message": "MedSage Medical RAG (Gemini 2.5 Flash) is running"}
