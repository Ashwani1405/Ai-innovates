from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="Global Ontology Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

# ── Lazy singletons ──────────────────────────────
_rag = None
_writer = None
_reader = None

def _get_rag():
    global _rag
    if _rag is None:
        from rag.graphrag import GraphRAG
        _rag = GraphRAG()
    return _rag

def _get_writer():
    global _writer
    if _writer is None:
        from graph.neo4j_writer import Neo4jWriter
        _writer = Neo4jWriter()
    return _writer

def _get_reader():
    global _reader
    if _reader is None:
        from graph.neo4j_query import Neo4jReader
        _reader = Neo4jReader()
    return _reader

# ── Endpoints ────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "GOE Backend MVP running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/query")
def graphrag_query(request: QueryRequest):
    """GraphRAG intelligence endpoint."""
    try:
        engine = _get_rag()
        answer = engine.answer_question(request.query)
        return {"answer": answer}
    except Exception as e:
        logger.error(f"/query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph")
def cytoscape_graph():
    """Returns Cytoscape-formatted graph elements."""
    try:
        reader = _get_reader()
        elements = reader.get_all_nodes_edges(limit=200)
        if elements:
            return {"elements": elements}
    except Exception as e:
        logger.error(f"/graph error: {e}")
    # Return demo data if Neo4j is down or empty
    return {"elements": _demo_graph_elements()}

@app.post("/ingest")
def ingest_gdelt():
    """Trigger GDELT ingestion pipeline."""
    try:
        from ingestion.gdelt_fetcher import GDELTFetcher
        from ingestion.rss_fetcher import RSSFetcher
        from nlp.ner import NERExtractor
        from nlp.relations import RelationExtractor
        from nlp.embedder import TextEmbedder

        fetcher = GDELTFetcher()
        rss_fetcher = RSSFetcher()
        ner = NERExtractor()
        rel_ext = RelationExtractor()
        embedder = TextEmbedder()
        writer = _get_writer()

        articles = fetcher.fetch_recent_articles(["India", "China", "Geopolitics", "Border"], max_records=10)
        
        # Add hyper-local Indian RSS data
        rss_articles = rss_fetcher.fetch_rss_articles(max_records=5)
        articles.extend(rss_articles)
        
        ingested = 0

        for art in articles:
            title = art.get("title", "")
            if not title:
                continue
            entities = ner.extract_entities(title)
            relations = rel_ext.extract_relations(title)
            vector = embedder.generate_embedding(title)
            try:
                writer.write_article_and_entities(art, entities, relations)
            except Exception as ex:
                logger.error(f"Neo4j write failed: {ex}")
            # Qdrant write
            try:
                from graph.qdrant_store import QdrantStore
                qs = QdrantStore()
                qs.upsert_article(art.get("url", ""), vector, art)
            except Exception as ex:
                logger.error(f"Qdrant write failed: {ex}")
            ingested += 1

        return {"ingested": ingested, "total_fetched": len(articles)}
    except Exception as e:
        logger.error(f"/ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events")
def live_events():
    """Returns recent GDELT events for the Event Feed."""
    try:
        from ingestion.gdelt_fetcher import GDELTFetcher
        from ingestion.rss_fetcher import RSSFetcher
        
        fetcher = GDELTFetcher()
        rss_fetcher = RSSFetcher()
        articles = fetcher.fetch_recent_articles(
            ["India", "China", "Russia", "NATO", "Geopolitics", "Trade", "Border"],
            max_records=10
        )
        
        rss_articles = rss_fetcher.fetch_rss_articles(max_records=5)
        articles.extend(rss_articles)
        
        return {"events": articles}
    except Exception as e:
        logger.error(f"/events error: {e}")
        return {"events": []}

@app.get("/geo")
def geo_events():
    """Returns geopolitical hotspot coordinates for the map."""
    # Curated geopolitical hotspots for MVP map display
    hotspots = [
        {"lat": 34.5, "lng": 78.0, "label": "LAC / Ladakh", "type": "conflict", "desc": "India-China border tensions"},
        {"lat": 48.5, "lng": 37.5, "label": "Eastern Ukraine", "type": "conflict", "desc": "Russia-Ukraine conflict zone"},
        {"lat": 25.3, "lng": 51.5, "label": "Qatar / Gulf", "type": "diplomacy", "desc": "GCC diplomatic activity"},
        {"lat": 38.9, "lng": 125.7, "label": "Korean Peninsula", "type": "conflict", "desc": "DPRK missile activity"},
        {"lat": 23.5, "lng": 121.0, "label": "Taiwan Strait", "type": "tension", "desc": "US-China strategic competition"},
        {"lat": 9.0, "lng": 7.5, "label": "Nigeria / Sahel", "type": "conflict", "desc": "Sahel insurgency corridor"},
        {"lat": 33.9, "lng": 35.5, "label": "Lebanon / Levant", "type": "tension", "desc": "Hezbollah-Israel tensions"},
        {"lat": 15.4, "lng": 44.2, "label": "Yemen / Red Sea", "type": "conflict", "desc": "Houthi Red Sea disruptions"},
        {"lat": 28.6, "lng": 77.2, "label": "New Delhi", "type": "diplomacy", "desc": "Indian foreign policy hub"},
        {"lat": 39.9, "lng": 116.4, "label": "Beijing", "type": "diplomacy", "desc": "Chinese strategic command"},
    ]
    return {"hotspots": hotspots}

def _demo_graph_elements():
    """Fallback demo graph if Neo4j has no data."""
    nodes = [
        {"data": {"id": "India", "label": "India", "type": "GPE"}},
        {"data": {"id": "China", "label": "China", "type": "GPE"}},
        {"data": {"id": "USA", "label": "USA", "type": "GPE"}},
        {"data": {"id": "Russia", "label": "Russia", "type": "GPE"}},
        {"data": {"id": "Pakistan", "label": "Pakistan", "type": "GPE"}},
        {"data": {"id": "NATO", "label": "NATO", "type": "ORG"}},
        {"data": {"id": "BRICS", "label": "BRICS", "type": "ORG"}},
        {"data": {"id": "LAC Border", "label": "LAC Border", "type": "LOC"}},
        {"data": {"id": "Taiwan Strait", "label": "Taiwan Strait", "type": "LOC"}},
        {"data": {"id": "Modi", "label": "Modi", "type": "PERSON"}},
        {"data": {"id": "Xi Jinping", "label": "Xi Jinping", "type": "PERSON"}},
        {"data": {"id": "Ukraine", "label": "Ukraine", "type": "GPE"}},
    ]
    edges = [
        {"data": {"source": "India", "target": "China", "label": "border tensions"}},
        {"data": {"source": "India", "target": "LAC Border", "label": "disputes at"}},
        {"data": {"source": "China", "target": "LAC Border", "label": "claims over"}},
        {"data": {"source": "USA", "target": "China", "label": "strategic rivalry"}},
        {"data": {"source": "USA", "target": "Taiwan Strait", "label": "naval presence"}},
        {"data": {"source": "China", "target": "Taiwan Strait", "label": "military drills"}},
        {"data": {"source": "Russia", "target": "Ukraine", "label": "conflict"}},
        {"data": {"source": "USA", "target": "NATO", "label": "leads"}},
        {"data": {"source": "India", "target": "BRICS", "label": "member"}},
        {"data": {"source": "China", "target": "BRICS", "label": "member"}},
        {"data": {"source": "Russia", "target": "BRICS", "label": "member"}},
        {"data": {"source": "Modi", "target": "India", "label": "leads"}},
        {"data": {"source": "Xi Jinping", "target": "China", "label": "leads"}},
        {"data": {"source": "India", "target": "Pakistan", "label": "ongoing tensions"}},
        {"data": {"source": "China", "target": "Pakistan", "label": "strategic ally"}},
    ]
    return nodes + edges
