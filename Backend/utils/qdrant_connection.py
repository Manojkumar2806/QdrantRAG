from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from fastembed import TextEmbedding


CLIENT = QdrantClient(":memory:")
COLLECTION_NAME = "Health_QA_CoT"
DIM = 384

def collection_exists(client, name):
    try:
        client.get_collection(name)
        return True
    except Exception:
        return False

if not collection_exists(CLIENT, COLLECTION_NAME):
    CLIENT.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
    )


def get_qdrant_client():
    client = QdrantClient(":memory:")
    return client

# Embedding model (fastembed by Qdrant)
EMBEDDING = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
