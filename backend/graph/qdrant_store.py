import os
import uuid
import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QdrantStore:
    def __init__(self):
        url = os.getenv("QDRANT_URL", "http://qdrant:6333")
        try:
            self.client = QdrantClient(url=url)
            self.collection_name = "articles"
            self._ensure_collection()
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            self.client = None
        
    def _ensure_collection(self):
        try:
            collections = self.client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                )
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")
            
    def upsert_article(self, article_id: str, vector: list, payload: dict):
        if not self.client:
            return
        # stable hash for article_id -> UUID
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, article_id))
        
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=[PointStruct(id=point_id, vector=vector, payload=payload)]
            )
        except Exception as e:
            logger.error(f"Qdrant write error: {e}")
            
    def search_similar(self, query_vector: list, limit: int = 5):
        if not self.client:
            return []
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit
            )
            return [res.payload for res in results]
        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            return []
