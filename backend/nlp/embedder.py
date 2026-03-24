import hashlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextEmbedder:
    """Lightweight text embedder using hash-based vectors.
    For MVP, this generates deterministic 384-dim vectors from text.
    In production, swap for sentence-transformers or OpenAI embeddings.
    """
    def __init__(self):
        logger.info("Using lightweight hash-based embedder (no PyTorch needed)")

    def generate_embedding(self, text: str) -> list:
        if not text:
            return []
        # Generate a deterministic 384-dimensional vector from text hash
        # This allows semantic-ish grouping (same text = same vector)
        h = hashlib.sha512(text.encode()).hexdigest()
        # Extend hash to fill 384 dimensions
        extended = (h * 3)[:384]
        vector = [int(c, 16) / 15.0 for c in extended]
        return vector
