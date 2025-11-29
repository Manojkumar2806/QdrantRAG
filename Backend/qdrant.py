import json
import os
import uuid
import gc
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding
from tqdm import tqdm

# ==================== CONFIG ====================
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "Health_QA_CoT"
JSON_FILE_PATH = "./Medical/medical-o1-reasoning-SFT_train_formatted.json"

if not QDRANT_URL or not QDRANT_API_KEY:
    raise EnvironmentError("Set QDRANT_URL and QDRANT_API_KEY in .env")

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

# ===============================================
print("Connecting to Qdrant Cloud...")
client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=120)
print("Connected!")

# ------------------- Initialize FastEmbed -------------------
print(f"Loading embedding model: {EMBEDDING_MODEL}")
embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)

print("Generating test embedding...")
test_embeddings = list(embedding_model.embed(["test sentence"]))
vector_size = len(test_embeddings[0])
print(f"Embedding dimension: {vector_size}")

# ------------------- Create / Reuse Collection (FIXED) -------------------
def collection_exists(client, name):
    try:
        client.get_collection(name)
        return True
    except Exception:
        return False

if not collection_exists(client, COLLECTION_NAME):
    print(f"Creating collection '{COLLECTION_NAME}'...")
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
else:
    print(f"Collection '{COLLECTION_NAME}' already exists → will upsert")

# ------------------- Helper Functions -------------------
def combine_entry(entry):
    parts = []
    if entry.get("Question"):
        parts.append(f"Question: {entry['Question'].strip()}")
    if entry.get("Complex_Cot"):
        parts.append(f"Reasoning: {entry['Complex_Cot'].strip()}")
    if entry.get("Response"):
        parts.append(f"Answer: {entry['Response'].strip()}")
    return "\n\n".join(parts)

def streaming_json(file_path):
    """Handles both normal JSON and huge ndjson-style files safely"""
    with open(file_path, 'r', encoding='utf-8') as f:
        # Try loading as full JSON first
        try:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    yield item
            else:
                yield data
            return
        except json.JSONDecodeError:
            pass  # Expected for large ndjson

        # Fallback: read line by line (common in medical datasets)
        print("Large JSON detected → switching to line-by-line streaming...")
        f.seek(0)
        for line in f:
            line = line.strip()
            if line and line.startswith('{'):
                # Remove trailing comma if present (common in exported JSONL)
                if line.endswith(','):
                    line = line[:-1]
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as e:
                    print(f"Skipping invalid line: {e}")
                    continue

# ------------------- Main Upload Loop -------------------
batch_size = 64
buffer = []
total_chunks = 0

print("\nStarting upload to Qdrant...\n")
for entry in tqdm(streaming_json(JSON_FILE_PATH), desc="Processing entries"):
    full_text = combine_entry(entry)
    if not full_text.strip():
        continue

    # Split only extremely long reasoning (medical CoT can be huge)
    if len(full_text) > 3000:
        texts = [full_text[i:i+2500] for i in range(0, len(full_text), 2500)]
    else:
        texts = [full_text]

    # Embed batch
    embeddings = list(embedding_model.embed(texts))

    for idx, (text, vector) in enumerate(zip(texts, embeddings)):
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector.tolist(),
            payload={
                "text": text,
                "question": entry.get("Question", "")[:2000],
                "response": entry.get("Response", "")[:2000],
                "complex_cot": entry.get("Complex_Cot", "")[:3000],
                "source": "medical-o1-reasoning-SFT_train_formatted.json",
                "domain": "Healthcare",
                "chunk_idx": idx
            }
        )
        buffer.append(point)
        total_chunks += 1

    # Upload when batch is full
    if len(buffer) >= batch_size:
        client.upsert(collection_name=COLLECTION_NAME, points=buffer)
        buffer.clear()
        gc.collect()

# Final upload
if buffer:
    client.upsert(collection_name=COLLECTION_NAME, points=buffer)

print(f"\nSUCCESS! Uploaded {total_chunks:,} medical QA chunks to Qdrant!")
print(f"Dashboard → {QDRANT_URL}/collections/{COLLECTION_NAME}")