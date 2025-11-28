# backend/scripts/setup_qdrant.py
import os
from dotenv import load_dotenv
load_dotenv()

from qdrant_client import QdrantClient

COLLECTION_NAME = "Health_QA_CoT"

def main():
    QDRANT_URL = os.getenv("QDRANT_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

    print("Loaded URL:", QDRANT_URL)

    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print("Connected to Qdrant Cloud:", QDRANT_URL)

    print("Creating payload index for 'domain'... (safe even if exists)")
    try:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="domain",
            field_schema="keyword"
        )
        print("✔ Index created.")
    except Exception as e:
        print("ℹ Already exists or cloud locked index:", e)

    print("✔ Setup complete.")

if __name__ == "__main__":
    main()
