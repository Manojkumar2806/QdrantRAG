# --- 1. Standard Library ---
import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from fastembed import TextEmbedding

from utils.qdrant_connection import CLIENT, COLLECTION_NAME, EMBEDDING


COLLECTION_NAME = "Health_QA_CoT"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

# backend/models/semantic_memory.py

def upsert_chunks_to_qdrant(chunks, filename, ext):
    points = []
    for c in chunks:
        vec = list(EMBEDDING.embed([c]))[0].tolist()
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vec,
                payload={"text": c, "file": filename, "type": ext.upper()},
            )
        )
    CLIENT.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)

def search_qdrant(question, top=5):
    vec = list(EMBEDDING.embed([question]))[0]
    # 1.7.x search API expects query_vector param
    results = CLIENT.search(collection_name=COLLECTION_NAME, query_vector=vec, limit=top)
    return results  # list of scored points


class SemanticMedicalMemory:
    def __init__(self):
        self.embedder = TextEmbedding(model_name=EMBEDDING_MODEL)

        # New-style Qdrant client (v1.16+)
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )

        self.collection = COLLECTION_NAME

    def get_embedding(self, text: str):
        return list(self.embedder.embed(text))[0]

    def query(self, query_text: str, top_k: int = 5, domain_filter: str = "Healthcare"):
        vector = self.get_embedding(query_text)

        query_filter = {
            "must": [
                {"key": "domain", "match": {"value": domain_filter}}
            ]
        }

        # ✔ Correct search method for qdrant-client v1.16+
        results = self.client.search(
            collection_name=self.collection,
            query_vector=vector,
            limit=top_k,
            query_filter=query_filter,
            search_params={"hnsw_ef": 64}   # IMPORTANT
        )

        hits = []
        for hit in results:
            payload = hit.payload or {}
            hits.append({
                "score": float(getattr(hit, "score", None)),
                "text": payload.get("text", ""),
                "response": payload.get("response", ""),
                "complex_cot": payload.get("complex_cot", ""),
                "source": payload.get("source", ""),
                "domain": payload.get("domain", ""),
                "chunk_idx": payload.get("chunk_idx", "")
            })

        return hits


