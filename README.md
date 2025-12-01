# MedSage 🏥 | Memory-First Medical AI with Qdrant

**MedSage** is a *retrieval-first medical AI platform* that combines **live clinical consultation**, **medical document Q&A**, and **multimodal file intelligence**. Built on **Qdrant** vector database and **FastEmbed**, MedSage prioritizes semantic memory over raw model capacity, delivering context-aware medical reasoning through advanced RAG (Retrieval-Augmented Generation) pipelines.

> *"Memory over models — real retrieval, real context, and real medical workflows."*

This project was built for the **Memory Over Models — AI Hackathon** (HiDevs × Qdrant × Lamatic × AI Collective), addressing both the **Unstructured Data RAG Challenge** and **Domain-Specific AI Systems (Healthcare)** themes.

---

## 🎯 Project Overview

MedSage delivers three core capabilities:

* **Live Medical Consultation** – Symptom-based clinical decision support with real-time diagnosis, reasoning, and emergency detection
* **Medical Document Q&A** – Upload and query PDFs, DOCX, and medical images using semantic search over Qdrant-stored vectors
* **Advanced File Intelligence** – Multimodal processing for PPTX, XLSX, CSV, JSON, and audio files with OCR and transcription

### Architecture Philosophy

* **Retrieval-first design** – Qdrant vector database serves as the primary knowledge source, not the LLM
* **Dual-mode Qdrant** – Cloud instances for persistence + in-memory instances for speed
* **Unified embedding space** – All modalities (text, OCR, audio transcripts) share the same 384-dimensional vector space  
---

## 🏆 Hackathon Context

**Event:** Memory Over Models — AI Hackathon
**Organizers:** HiDevs (GenAI workforce) × Qdrant (vector DB) × Lamatic (AI automation) × AI Collective (global AI community)

### How MedSage Demonstrates the Themes

1. **Unstructured Data RAG** – Converts messy medical PDFs, scanned reports, handwritten notes (via OCR), and audio dictations into a queryable vector database
2. **Domain-Specific Healthcare AI** – Medical keyword validation, graduated retrieval strategies, emergency detection, and structured clinical reasoning
3. **Memory-First Architecture** – Qdrant handles semantic search and context retrieval; LLMs generate answers only after retrieval, not from scratch  

---

## 🧠 Qdrant-Powered Memory Architecture

### Qdrant Cloud (Primary Vector DB)

* **Persistent storage** for production-grade medical document vectors
* Powers semantic search in `MedFileChatbot` and `FileChatPro`
* Stores rich metadata: file IDs, page numbers, modality type, retrieval scores

### Qdrant In-Memory (`:memory`)

* **Fast, ephemeral sessions** for interactive experimentation
* Used in `MedFileChatbot.tsx` for quick file indexing and Q&A
* Used in `FileChatPro.tsx` for high-speed local vector search
* Enables per-session vector stores that reset cleanly 

### FastEmbed Integration

MedSage uses **Qdrant's FastEmbed** library with the `BAAI/bge-small-en-v1.5` model (384-dimensional vectors). Benefits:

* Native Qdrant Embeddings: Optimized for vector operations
* Model: BAAI/bge-small-en-v1.5 generating 384-dimensional vectors
* Performance: Sub-50ms embedding generation
* Language: Optimized for English medical text
* Lightweight and fast (ONNX-based)
* Optimized for semantic search in Qdrant
* Consistent embedding space across all modalities  

#### Example: Embedding & Upserting to Qdrant

```python
from fastembed import TextEmbedding
from qdrant_client.models import PointStruct

# Initialize embedding model
EMBEDDING = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Generate embeddings
chunks = ["Patient presents with fever...", "Blood pressure 120/80..."]
vectors = [list(EMBEDDING.embed([chunk]))[0].tolist() for chunk in chunks]

# Upsert to Qdrant
points = [
    PointStruct(
        id=str(uuid.uuid4()),
        vector=vec,
        payload={"text": chunk, "file": "report.pdf"}
    )
    for vec, chunk in zip(vectors, chunks)
]
CLIENT.upsert(collection_name="Health_QA_CoT", points=points)
```

---

## 📄 Multimodal Content & Embeddings

### Text Documents (PDF, DOCX, TXT)

* Extract text using `PyPDF2`, `python-docx`, or plain text readers
* Chunk into **~350-word segments** with **~300-word overlap** for context preservation
* Embed with FastEmbed (`BAAI/bge-small-en-v1.5`) and store in Qdrant with metadata 

### Images (PNG, JPG, JPEG, WEBP)

* Use **Gemini Vision** for OCR to extract medical text from scans, charts, and handwritten notes
* Embed extracted text using the same FastEmbed model to maintain a unified vector space  

### Audio (MP3, WAV, M4A, OGG)

* Perform **speech-to-text transcription** for medical dictations and audio notes
* Chunk transcripts and embed with FastEmbed
* Attach timestamps and file IDs in Qdrant payload for precise source attribution

**Result:** All modalities land in Qdrant with rich metadata, enabling unified semantic retrieval across text, images, and audio. 

---

## 📋 Application Pages Overview

| Page               | Location                                | Description                                                                                    |                                                                         
| ------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------- | 
| **MedChatbot**     | `Frontend/src/pages/MedChatbot.tsx`     | Live clinical consultation with symptom analysis, voice I/O, and emergency detection           |                                                                         
| **MedFileChatbot** | `Frontend/src/pages/MedFileChatbot.tsx` | Medical document upload and Q&A over PDFs, DOCX, and images using Qdrant retrieval             |                                                                         
| **FileChatPro**    | `Frontend/src/pages/FileChatPro.tsx`    | Advanced file intelligence over PPTX, XLSX, CSV, JSON, and audio with multimodal vector search |
---

## 🏥 MedChatbot – Live Clinical Consultation **(Uses Qdrant Cloud DB)**

**Location:** `Frontend/src/pages/MedChatbot.tsx`

### Core Features

* **Real-time Symptom Analysis** – Users describe symptoms; system returns structured diagnosis, reasoning, and recommendations
* **Voice Integration** – Uses `webkitSpeechRecognition` for speech-to-text and `speechSynthesis` for text-to-speech
* **Emergency Detection** – Detects red-flag symptoms and surfaces alerts/SOS options
* **Session Statistics** – Tracks consultation count and average response times 

### Technical Implementation

#### API Configuration

```typescript
const API_PREFIX = "http://localhost:8000/api/chat";
const CONSULT_URL = `${API_PREFIX}/consult`;
```

#### Structured Response Rendering

The system uses React hooks to manage state and renders responses in structured blocks:

* **Diagnosis** – Primary medical assessment
* **Clinical Reasoning** – Chain-of-thought explanation
* **Recommendations** – Treatment and next steps
* **Danger Signs** – Red-flag symptoms requiring immediate attention
* **Follow-up Questions** – AI-generated clarifying questions 

Responses are structured using DSPy-style outputs for consistency and quality control.

---

## 📑 MedFileChatbot – Medical Document Q&A **(Uses Qdrant Inmemory (:memory))**

**Location:** `Frontend/src/pages/MedFileChatbot.tsx`

### Core Features

* **Multi-format Support:** PDF, DOCX, PNG, JPG, JPEG, WEBP
* **Vector Processing Pipeline:** Auto extract → chunk → embed → upsert into Qdrant
* **Semantic Search:** Qdrant-powered similarity search with source highlighting and relevance scores
* **Upload Animation:** Multi-step visual feedback showing processing stages 
#### Upload Steps

1. "Uploading file"
2. "Analyzing document"
3. "Chunking text"
4. "Creating embeddings"
5. "Storing vectors in Qdrant"

### Processing Pipeline

1. **Medical Content Validation** – Keyword-based checks in backend (`medical.py`)
2. **Specialized Extractors** – Format-specific handlers for PDFs, DOCX, and images (OCR via Gemini Vision)
3. **Graduated RAG Architecture:**  

| Retrieval Quality | Score Threshold | Strategy                                             |                                                 |
| ----------------- | --------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **Strong RAG**    | score ≥ 0.15    | Use ONLY retrieved context; strict doc-based answers |                                                 |
| **Weak RAG**      | score < 0.15    | Cautious answers with general medical knowledge      |                                                 |
| **No Results**    | No matches      | Pure LLM answer with medical disclaimers             |   |

MedFileChatbot leverages **Qdrant in-memory** for fast experimentation and **Qdrant Cloud** for persistent storage.

---

## 📂 FileChatPro – Advanced File Intelligence **(Uses Qdrant Inmemory (:memory))**

**Location:** `Frontend/src/pages/FileChatPro.tsx`

### Enhanced Features

* **Extended File Support:** PPTX, XLSX, CSV, JSON, TXT + all MedFileChatbot formats + audio (MP3, WAV, M4A, OGG)
* **Advanced OCR:** Gemini Vision for slides, scans, and complex images
* **Audio Transcription:** Convert audio medical records into searchable text
* **Rich Text Rendering:** Markdown-style output with headings, bullet points, code blocks, and blockquotes
* **UI Enhancements:** Gradient backgrounds, smooth animations, AI suggestions with hover effects, file-type icons, detailed retrieval metadata 

### Technical Architecture

#### Constants

```typescript
const API_BASE = "http://localhost:8000/api/system";
const SUPPORTED_FILES = ".pdf,.docx,.pptx,.xlsx,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg";
```

#### Architecture Details

* **Multimodal Extraction** – OCR for images, transcription for audio, specialized parsing for tabular formats (XLSX, CSV)
* **Enhanced Chunking** – Format-specific strategies for slides, tables, and logs
* **Vector Storage** – Single Qdrant collection with metadata (modality, file type, section, timestamps)
* **Toast Notifications** – Uses `react-hot-toast` for user feedback 

FileChatPro uses **Qdrant in-memory** heavily for high-speed indexing and optionally syncs/persists to **Qdrant Cloud**.

---

## 🆘 Emergency & Accessibility Features

### Emergency SOS Feature

**One-Click Emergency Alert** with live GPS tracking is integrated throughout the platform:

* **SOS Button** – Prominently displayed in navigation bar (red background with phone icon) on both desktop and mobile
* **Emergency Detection** – AI-powered red-flag symptom detection in `MedChatbot` that automatically triggers alerts when `is_emergency` flag is true  
* **Live GPS Tracking** – Browser API-based location services for emergency coordination
* **Mock Hospital Integration** – Returns nearest facility suggestions and action steps (production requires real hospital integration)

### Multi-Language Support

**8 Major Indian Languages** with Google Translate integration:

* **Translation Widget** – Integrated in navigation bar with custom language selector
* **Google Translate Suppression** – Custom CSS and JavaScript to hide intrusive translation banners
* **LLM-Based Translation** – Medical content translated while preserving clinical accuracy
* **UI Localization** – Interface elements support dynamic language switching

### Voice Integration

**Speech-to-Text (STT)** and **Text-to-Speech (TTS)** capabilities:

* **STT Implementation** – Uses `webkitSpeechRecognition` for voice input in medical consultations  
* **TTS Implementation** – Uses `speechSynthesis` with configurable rate (0.95) and auto-play options 
* **Voice Controls** – Play, pause, stop, and replay functionality for all responses 
* **Accessibility Features** – Voice navigation for users with visual or motor impairments

---

## 🧠 AI & Machine Learning Stack

### DSPy Framework Usage

**DSPy** is a framework for declaratively building structured LM programs. MedSage uses it for:

* **Structured Prompting** – Standard medical response templates (Diagnosis, Reasoning, Recommendations, Danger Signs, Follow-ups)
* **Chain-of-Thought Reasoning** – Encoded in modules, not hard-coded prompts
* **Modular Architecture** – Multiple modules (triage, doc QA, SOS routing) sharing interfaces
* **Quality Control** – Schema-constrained outputs and validation hooks
  
### LLM Integration

* **Google Gemini 2.5 Flash** – Primary LLM for fast reasoning and generation (medical Q&A, triage, summarization)
* **Perplexity Sonar** – Complementary model for retrieval-augmented reasoning and external knowledge<cite repo="Manojkumar2806/QdrantRAG" path="Backend/routes/medical.py" start="19



---

## 🌐 Multi-Language Support (8 Indian Languages)

MedSage supports **8 major Indian languages** to ensure accessibility for users across regions:

* **English (EN)** 🇬🇧
* **Hindi (HI)** 🇮🇳
* **Telugu (TE)** 🇮🇳
* **Tamil (TA)** 🇮🇳
* **Kannada (KN)** 🇮🇳
* **Malayalam (ML)** 🇮🇳
* **Marathi (MR)** 🇮🇳
* **Bengali (BN)** 🇮🇳

### Language System Features

* **Auto-translation** for all chat responses
* **Dynamic UI translation** for menus, buttons, and labels
* **Medical-safe translation** ensuring clinical terms remain accurate
* **Integrated Google Translate widget** with custom styling
* **Full compatibility** with all 8 languages across MedChatbot, MedFileChatbot, and FileChatPro

