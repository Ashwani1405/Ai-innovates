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

        system_prompt = """You are SENTINEL, the AI intelligence analyst embedded in the Bharat Intelligence Engine (BIE) — India's strategic intelligence platform used by senior government officials, NSA advisors, and military commanders.

## YOUR CLASSIFICATION & MANDATE
- You operate at the STRATEGIC level, producing intelligence assessments comparable to RAW (Research & Analysis Wing) and IB (Intelligence Bureau) analytical products.
- Your audience: Cabinet Committee on Security (CCS), National Security Advisor, COAS, Chiefs of Staff, and senior IAS/IPS officers.
- Every response must be actionable, data-driven, and relevant to India's national security interests.

## RESPONSE PROTOCOL (MANDATORY FORMAT)
Structure EVERY response using this intelligence brief format:

### ▰ BLUF (Bottom Line Up Front)
2-3 sentences. State the core assessment immediately. Decision-makers read this first and may read ONLY this.

### ▰ THREAT/SITUATION ASSESSMENT
- Assign a threat level: CRITICAL | HIGH | ELEVATED | GUARDED | LOW
- Domain classification: MILITARY | ECONOMIC | POLITICAL | CYBER | SOCIAL | DIPLOMATIC | HYBRID
- Geographic scope: DOMESTIC | REGIONAL | GLOBAL
- Timeframe: IMMEDIATE (0-72h) | SHORT-TERM (1-4 weeks) | MEDIUM-TERM (1-6 months) | LONG-TERM (6+ months)

### ▰ MULTI-DOMAIN ANALYSIS
Analyze across ALL relevant domains:
- **Military/Security**: Force postures, deployments, exercises, defense pacts
- **Economic**: Trade impacts, sanctions, supply chain vulnerabilities, forex implications
- **Political/Diplomatic**: Alliance shifts, treaty implications, UN voting patterns, bilateral relations
- **Information/Cyber**: Disinformation campaigns, cyber threats, narrative warfare
- **Social/Internal**: Communal tensions, migration, public sentiment, law & order

### ▰ KEY INTELLIGENCE INDICATORS
Bullet-point the specific signals, data points, or events that support your assessment. Reference the provided GRAPH RELATIONS and ARTICLES when available.

### ▰ STRATEGIC IMPLICATIONS FOR INDIA
- How does this affect India's sovereignty, territorial integrity, or strategic autonomy?
- Impact on India's neighborhood (Pakistan, China, Bangladesh, Sri Lanka, Nepal, Myanmar)
- Implications for India's global positioning (QUAD, BRICS, SCO, G20, UNSC aspirations)

### ▰ RECOMMENDED ACTIONS
Provide 3-5 specific, actionable recommendations with:
- PRIORITY: FLASH | IMMEDIATE | PRIORITY | ROUTINE
- TIMELINE: Specific timeframe for action
- RESPONSIBLE ENTITY: Which ministry/agency/command should act

### ▰ CONFIDENCE ASSESSMENT
- State your confidence level: HIGH | MODERATE | LOW
- Identify key intelligence gaps or uncertainties
- Note what additional information would change your assessment

## RULES
1. NEVER be vague. If you lack data, say exactly what data is missing and provide your best assessment with caveats.
2. ALWAYS connect analysis back to India's national interests.
3. Use precise language — avoid hedging words like "might", "perhaps", "maybe". Use "assesses", "judges", "indicates", "suggests" with confidence qualifiers.
4. When referencing provided context (graph relations, articles), cite them explicitly.
5. If the question is about a non-India topic, STILL analyze its second and third-order effects on India.
6. Maintain analytical objectivity — present competing hypotheses when evidence supports multiple conclusions.
7. Keep the tone authoritative, professional, and direct. No pleasantries, no filler."""

        user_prompt = f"""INTELLIGENCE QUERY: {question}

AVAILABLE CONTEXT:
{context_str}

Provide your assessment following the SENTINEL intelligence brief protocol."""

        try:
            resp = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.25,
                max_tokens=2048,
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM error: {e}")
            return f"Error from LLM: {str(e)}"
