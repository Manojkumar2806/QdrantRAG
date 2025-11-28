# backend/routes/system.py
from fastapi import APIRouter, File, UploadFile, HTTPException
from utils.extractors import extract_text, chunk_text
from models.semantic_memory import upsert_chunks_to_qdrant
from utils.genai_wrapper import gemini_generate_text
from utils.qdrant_connection import COLLECTION_NAME

router = APIRouter()

@router.post("/upload/")
async def upload(file: UploadFile = File(...)):
    allowed = ["pdf","docx","pptx","ppt","xlsx","xls","csv","txt","json","png","jpg","jpeg","webp","mp3","wav","m4a","ogg"]
    ext = file.filename.lower().split(".")[-1]
    if ext not in allowed:
        raise HTTPException(400, "Unsupported file")

    content = await file.read()
    text = extract_text(content, file.filename, ext)
    chunks = chunk_text(text)

    uploaded = upsert_chunks_to_qdrant(chunks, file.filename, ext)

    # summary via Gemini
    summary = "File processed."
    suggested_questions = ["What is this about?", "Can you summarize it?", "What are the key points?"]

    if text.strip() and len(text.strip()) > 20:
        prompt = [
            f"Here is text extracted from a file:\n\n{text[:9000]}\n\n"
            "Your task:\n"
            "1. Give a clear 2-sentence summary of this content.\n"
            "2. Suggest exactly 3 specific, intelligent short questions the user should ask about this document.\n\n"
            "Format exactly like this:\n"
            "SUMMARY: [your 2-sentence summary here]\n"
            "QUESTION 1: [question]\n"
            "QUESTION 2: [question]\n"
            "QUESTION 3: [question]"
        ]
        raw = gemini_generate_text(prompt)
        lines = raw.split("\n")
        for line in lines:
            if line.upper().startswith("SUMMARY:"):
                summary = line[8:].lstrip(": ").strip()
                break
        questions = []
        for line in lines:
            if line.upper().startswith("QUESTION ") and ":" in line:
                q = line.split(":", 1)[1].strip()
                if len(q) > 8:
                    questions.append(q)
        if len(questions) >= 3:
            suggested_questions = questions[:3]
        elif questions:
            suggested_questions = questions + ["Tell me more?", "Any key insights?"]

    return {
        "status": "success",
        "file": file.filename,
        "chunks": len(chunks),
        "summary": summary,
        "suggested_questions": suggested_questions
    }

@router.post("/clear/")
async def clear():
    from utils.qdrant_connection import CLIENT, DIM
    # delete & recreate collection (1.7.3 style)
    CLIENT.delete_collection(collection_name=COLLECTION_NAME)
    CLIENT.create_collection(collection_name=COLLECTION_NAME,
                             vectors_config={"size": DIM, "distance": "Cosine"} )
    return {"status": "cleared"}

@router.get("/")
def home():
    return {"message": "GEMINI FULL MULTIMODAL RAG – Images + Audio PERFECT!"}
