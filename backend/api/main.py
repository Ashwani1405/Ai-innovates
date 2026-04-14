from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import json
from dotenv import load_dotenv
load_dotenv()

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="Global Ontology Engine API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
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

# ── Fallback Helper ──────────────────────────────
def _read_fallback(key, default=None):
    try:
        fallback_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Fallback.txt")
        with open(fallback_path, "r", encoding="utf-8") as f:
            return json.load(f).get(key, default if default is not None else [])
    except Exception as e:
        logger.error(f"Failed to read Fallback.txt for {key}: {e}")
        return default if default is not None else []

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
    hotspots = _read_fallback("geo_hotspots")
    return {"hotspots": hotspots}

@app.get("/air-traffic")
def air_traffic():
    """Proxies OpenSky Network API with OAuth2 authentication."""
    import requests
    try:
        ua_headers = {"User-Agent": "BharatIntelligenceEngine/1.0 (India Hackathon Pitch)"}
        
        # Step 1: Get OAuth2 access token
        token_url = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
        token_res = requests.post(token_url, headers=ua_headers, data={
            "grant_type": "client_credentials",
            "client_id": os.getenv("OPENSKY_CLIENT_ID"),
            "client_secret": os.getenv("OPENSKY_CLIENT_SECRET")
        }, timeout=15)

        if token_res.status_code != 200:
            return {"states": [], "error": f"Token failed: {token_res.status_code} - {token_res.text}"}

        access_token = token_res.json().get("access_token")

        # Step 2: Fetch flight data with the token
        res_headers = {
            "Authorization": f"Bearer {access_token}",
            "User-Agent": "BharatIntelligenceEngine/1.0 (India Hackathon Pitch)"
        }
        res = requests.get(
            "https://opensky-network.org/api/states/all",
            params={"lamin": 6.7, "lomin": 68.1, "lamax": 35.5, "lomax": 97.4},
            headers=res_headers,
            timeout=15
        )
        if res.status_code == 200:
            data = res.json()
            data["error"] = None # mark success
            return data
            
        return {"states": [], "error": f"Flight API failed: {res.status_code} - {res.text}"}
    except Exception as e:
        return {"states": [], "error": f"Exception: {str(e)}"}

# ── Intelligence Panel Endpoints (Real Data) ─────

@app.get("/disasters")
def disasters():
    """Returns real disaster data from USGS + weather APIs."""
    try:
        from intelligence.disaster_fetcher import DisasterFetcher
        fetcher = DisasterFetcher()
        events = fetcher.get_all_disasters()
        return {"events": events, "source": "USGS + OpenMeteo"}
    except Exception as e:
        logger.error(f"/disasters error: {e}")
        return {"events": [], "source": "error"}

@app.get("/economic")
def economic():
    """Returns real economic signals from exchange rate + commodity APIs."""
    try:
        from intelligence.economic_fetcher import EconomicFetcher
        fetcher = EconomicFetcher()
        signals = fetcher.get_economic_signals()
        return {"signals": signals, "source": "ExchangeRate-API + commodity APIs"}
    except Exception as e:
        logger.error(f"/economic error: {e}")
        return {"signals": [], "source": "error"}

@app.get("/state-volatility")
def state_volatility():
    """Returns LLM-computed state volatility scores from real news analysis."""
    try:
        from intelligence.analyzer import IntelligenceAnalyzer
        from ingestion.gdelt_fetcher import GDELTFetcher
        from ingestion.rss_fetcher import RSSFetcher

        # Fetch real news
        gdelt = GDELTFetcher()
        rss = RSSFetcher()
        articles = gdelt.fetch_recent_articles(["India", "state", "protest", "violence", "security"], max_records=15)
        articles.extend(rss.fetch_rss_articles(max_records=10))

        analyzer = IntelligenceAnalyzer()
        states = analyzer.compute_state_volatility(articles)
        return {"states": states, "source": "LLM analysis of GDELT + RSS headlines"}
    except Exception as e:
        logger.error(f"/state-volatility error: {e}")
        return {"states": [], "source": "error"}

@app.get("/border-posture")
def border_posture():
    """Returns LLM-computed border posture from real news analysis."""
    try:
        from intelligence.analyzer import IntelligenceAnalyzer
        from ingestion.gdelt_fetcher import GDELTFetcher

        gdelt = GDELTFetcher()
        articles = gdelt.fetch_recent_articles(["India", "border", "LAC", "LOC", "military", "navy", "Indian Ocean"], max_records=15)

        analyzer = IntelligenceAnalyzer()
        theaters = analyzer.compute_border_posture(articles)
        return {"theaters": theaters, "source": "LLM analysis of GDELT headlines"}
    except Exception as e:
        logger.error(f"/border-posture error: {e}")
        return {"theaters": [], "source": "error"}

@app.get("/risk-score")
def risk_score():
    """Returns aggregate national risk score computed from all intelligence sources."""
    try:
        from intelligence.analyzer import IntelligenceAnalyzer
        from intelligence.disaster_fetcher import DisasterFetcher
        from intelligence.economic_fetcher import EconomicFetcher
        from ingestion.gdelt_fetcher import GDELTFetcher
        from ingestion.rss_fetcher import RSSFetcher

        gdelt = GDELTFetcher()
        rss = RSSFetcher()
        articles = gdelt.fetch_recent_articles(["India"], max_records=10)
        articles.extend(rss.fetch_rss_articles(max_records=5))

        analyzer = IntelligenceAnalyzer()
        disaster_fetcher = DisasterFetcher()
        economic_fetcher = EconomicFetcher()

        disasters_data = disaster_fetcher.get_all_disasters()
        economic_data = economic_fetcher.get_economic_signals()
        states_data = analyzer.compute_state_volatility(articles)
        borders_data = analyzer.compute_border_posture(articles)

        result = analyzer.compute_risk_score(disasters_data, economic_data, states_data, borders_data)
        return result
    except Exception as e:
        logger.error(f"/risk-score error: {e}")
        return {"score": 45, "trend": "stable", "source": "fallback"}

def _demo_graph_elements():
    """Fallback demo graph if Neo4j has no data."""
    return _read_fallback("demo_graph_elements")
