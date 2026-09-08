# ============================================================
# CORE: Embeddings Engine
# sentence-transformers + FAISS vector index management
# Per-agent isolated indices for modular self-expansion
# ============================================================

import os
import time
import pickle
import hashlib
import numpy as np
import structlog

logger = structlog.get_logger(__name__)

# Lazy-loaded to avoid slow startup when not needed
_model = None
_model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")   # fast 384-dim model


def get_model():
    """Lazy-load the sentence-transformer model (cached after first call)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("embeddings.loading_model", model=_model_name)
        _model = SentenceTransformer(_model_name)
        logger.info("embeddings.model_loaded", model=_model_name)
    return _model


def embed_texts(texts: list[str], batch_size: int = 64, show_progress: bool = False) -> np.ndarray:
    """
    Embed a list of text strings.
    Returns float32 numpy array of shape (N, embedding_dim).
    """
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=show_progress,
        normalize_embeddings=True,   # L2-normalize for cosine similarity via dot product
        convert_to_numpy=True,
    )
    return embeddings.astype(np.float32)


def embed_query(text: str) -> np.ndarray:
    """Embed a single query string. Returns shape (1, dim) float32."""
    return embed_texts([text])


# ─── FAISS Index Wrapper ──────────────────────────────────────

class FAISSIndex:
    """
    A per-agent FAISS index that stores text chunks + their embeddings.
    Supports: add, search, persist, load, clear.
    """

    def __init__(self, agent_name: str, index_dir: str = "./data/faiss_indices"):
        import faiss
        self.agent_name = agent_name
        self.index_dir = index_dir
        os.makedirs(index_dir, exist_ok=True)

        self.dim = 384    # all-MiniLM-L6-v2 output dim
        self.index = faiss.IndexFlatIP(self.dim)   # inner product = cosine on normalised vecs
        self.documents: list[dict] = []            # parallel list to FAISS ids

        # Try to load persisted index
        self._load()
        logger.info("faiss_index.ready", agent=agent_name, vectors=self.index.ntotal)

    # ── persistence paths ──────────────────────────────────────
    @property
    def _index_path(self):
        return os.path.join(self.index_dir, f"{self.agent_name}.faiss")

    @property
    def _docs_path(self):
        return os.path.join(self.index_dir, f"{self.agent_name}.pkl")

    def _load(self):
        import faiss
        if os.path.exists(self._index_path) and os.path.exists(self._docs_path):
            try:
                self.index = faiss.read_index(self._index_path)
                with open(self._docs_path, "rb") as f:
                    self.documents = pickle.load(f)
                logger.info("faiss_index.loaded", agent=self.agent_name, vectors=self.index.ntotal)
            except Exception as e:
                logger.warning("faiss_index.load_failed", agent=self.agent_name, error=str(e))

    def save(self):
        import faiss
        try:
            faiss.write_index(self.index, self._index_path)
            with open(self._docs_path, "wb") as f:
                pickle.dump(self.documents, f)
            logger.info("faiss_index.saved", agent=self.agent_name, vectors=self.index.ntotal)
        except Exception as e:
            logger.warning("faiss_index.save_failed", agent=self.agent_name, error=str(e))

    # ── deduplication ──────────────────────────────────────────
    def _doc_hash(self, text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()

    def _existing_hashes(self) -> set:
        return {d.get("hash", "") for d in self.documents}

    # ── add documents ──────────────────────────────────────────
    def add(self, chunks: list[str], source: str, metadata: dict = None) -> int:
        """
        Add text chunks to the index. Deduplicates by content hash.
        Returns the number of newly added vectors.
        """
        if not chunks:
            return 0

        existing = self._existing_hashes()
        new_chunks = []
        new_docs = []

        for chunk in chunks:
            h = self._doc_hash(chunk)
            if h not in existing:
                new_chunks.append(chunk)
                new_docs.append({
                    "text": chunk,
                    "source": source,
                    "hash": h,
                    "metadata": metadata or {},
                    "added_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })
                existing.add(h)

        if not new_chunks:
            return 0

        embeddings = embed_texts(new_chunks)
        self.index.add(embeddings)
        self.documents.extend(new_docs)
        self.save()

        logger.info("faiss_index.added", agent=self.agent_name, count=len(new_chunks), source=source)
        return len(new_chunks)

    # ── semantic search ────────────────────────────────────────
    def search(self, query: str, top_k: int = 8, min_score: float = 0.30) -> list[dict]:
        """
        Semantic similarity search.
        Returns list of { text, source, score, metadata }.
        """
        if self.index.ntotal == 0:
            return []

        q_embedding = embed_query(query)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q_embedding, k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or score < min_score:
                continue
            doc = self.documents[idx]
            results.append({
                "text": doc["text"],
                "source": doc["source"],
                "score": float(score),
                "metadata": doc.get("metadata", {}),
                "added_at": doc.get("added_at"),
            })

        return sorted(results, key=lambda x: x["score"], reverse=True)

    # ── stats ──────────────────────────────────────────────────
    def stats(self) -> dict:
        sources = {}
        for doc in self.documents:
            s = doc.get("source", "unknown")
            sources[s] = sources.get(s, 0) + 1
        return {
            "agent": self.agent_name,
            "total_vectors": self.index.ntotal,
            "unique_sources": len(sources),
            "source_breakdown": sources,
        }

    def clear(self):
        import faiss
        self.index = faiss.IndexFlatIP(self.dim)
        self.documents = []
        self.save()
        logger.info("faiss_index.cleared", agent=self.agent_name)
