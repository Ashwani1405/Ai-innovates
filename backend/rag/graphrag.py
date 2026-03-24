import logging
import os
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GraphRAG:
    def __init__(self):
        logger.info("Initializing GraphRAG...")
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

        # Try connecting to Neo4j / Qdrant, but don't crash if unavailable
        self.graph_reader = None
        self.qdrant_store = None
        try:
            from graph.neo4j_query import Neo4jReader
            self.graph_reader = Neo4jReader()
        except Exception as e:
            logger.warning(f"Neo4j unavailable: {e}")
        try:
            from graph.qdrant_store import QdrantStore
            self.qdrant_store = QdrantStore()
        except Exception as e:
            logger.warning(f"Qdrant unavailable: {e}")

        try:
            from nlp.ner import NERExtractor
            self.ner = NERExtractor()
        except Exception as e:
            logger.warning(f"NER init failed: {e}")
            self.ner = None

    def answer_question(self, question: str) -> str:
        if not self.client:
            return "GROQ_API_KEY is not set. Cannot generate intelligence response."

        # Step 1: Extract entities from question
        entity_names = []
        if self.ner:
            try:
                entities = self.ner.extract_entities(question)
                entity_names = [e[0] for e in entities] if entities else []
            except Exception:
                pass
        logger.info(f"Entities: {entity_names}")

        # Step 2: Graph context (if Neo4j available)
        graph_context = []
        if self.graph_reader and entity_names:
            try:
                edges = self.graph_reader.get_subgraph_for_entities(entity_names, limit=20)
                graph_context = [f"{e['source']} → {e['relation']} → {e['target']}" for e in edges]
            except Exception as e:
                logger.warning(f"Graph query failed: {e}")

        # Step 3: Semantic context (if Qdrant available)
        semantic_results = []
        if self.qdrant_store:
            try:
                from nlp.embedder import TextEmbedder
                emb = TextEmbedder()
                vec = emb.generate_embedding(question)
                if vec:
                    similar = self.qdrant_store.search_similar(vec, limit=5)
                    semantic_results = [f"• {r.get('title','')}" for r in similar if r]
            except Exception as e:
                logger.warning(f"Semantic search failed: {e}")

        # Step 4: Build context
        ctx_parts = []
        if graph_context:
            ctx_parts.append("GRAPH RELATIONS:\n" + "\n".join(graph_context))
        if semantic_results:
            ctx_parts.append("RELATED ARTICLES:\n" + "\n".join(semantic_results))
        context_str = "\n\n".join(ctx_parts) if ctx_parts else "(No stored context yet — answering from general knowledge)"

        prompt = f"""You are an expert strategic intelligence analyst for the Global Ontology Engine (GOE).
Answer this geopolitical question with a clear, structured, analytical response.
Use the provided context if available. Always provide actionable insights.

QUESTION: {question}

CONTEXT:
{context_str}

Format your answer with:
1. Brief executive summary (2-3 sentences)
2. Key analysis points (bullet points)
3. Strategic implications
"""
        try:
            resp = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM error: {e}")
            return f"Error from LLM: {str(e)}"
