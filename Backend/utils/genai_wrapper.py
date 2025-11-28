# backend/utils/genai_wrapper.py
import os
import tempfile
import requests
import google.generativeai as genai

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

if not GOOGLE_API_KEY:
    raise RuntimeError("Set GOOGLE_API_KEY environment variable")

genai.configure(api_key=GOOGLE_API_KEY)
GEMINI = genai.GenerativeModel("gemini-2.5-flash")

def ask_perplexity(prompt: str) -> str:
    try:
        r = requests.post(
            "https://api.perplexity.ai/chat/completions",
            json={"model": "sonar", "messages": [{"role": "user", "content": prompt}], "temperature": 0.3},
            headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}"},
            timeout=30,
        )
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return "Answer generation failed."

def gemini_generate_text(prompt_and_inputs: list):
    """
    prompt_and_inputs: list with prompt strings and optionally media (image object or genai.upload_file)
    """
    try:
        resp = GEMINI.generate_content(prompt_and_inputs)
        return resp.text.strip() if resp and resp.text else ""
    except Exception as e:
        return f"[Gemini error: {str(e)}]"

def genai_generate_text(prompt_and_inputs: list) -> str:
    """
    Generic wrapper for GEMINI.generate_content.
    prompt_and_inputs: list mixing prompt strings and optionally uploaded file refs.
    """
    try:
        resp = GEMINI.generate_content(prompt_and_inputs)
        return resp.text.strip() if resp and getattr(resp, "text", None) else ""
    except Exception as e:
        return f"[Gemini error: {str(e)}]"

def upload_file_and_generate(file_path: str, prompt: str) -> str:
    """
    Upload a local file and call Gemini with the uploaded reference.
    Returns Gemini text or error string.
    """
    try:
        uploaded = genai.upload_file(file_path)
        resp = GEMINI.generate_content([prompt, uploaded])
        return resp.text.strip() if resp and getattr(resp, "text", None) else ""
    except Exception as e:
        return f"[Gemini upload/generate error: {str(e)}]"

def transcribe_audio_bytes(audio_bytes: bytes, filename: str) -> str:
    """
    Writes audio bytes to a temp file, uploads it to Gemini, requests transcription,
    then deletes the temp file. Returns transcript text or error string.
    """
    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=os.path.splitext(filename)[1] or ".mp3")
        with os.fdopen(fd, "wb") as f:
            f.write(audio_bytes)

        prompt = "Transcribe this audio file completely and accurately. Include timestamps if possible. Return only the transcript."
        result = upload_file_and_generate(tmp_path, prompt)
        return result or "[No transcript returned]"
    except Exception as e:
        return f"[Audio error: {str(e)}]"
    finally:
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass