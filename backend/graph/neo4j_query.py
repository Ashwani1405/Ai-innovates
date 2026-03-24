import os
import logging
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Neo4jReader:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        
    def close(self):
        self.driver.close()
        
    def get_subgraph_for_entities(self, entity_names: list, limit: int = 50):
        """
        Retrieve 1-hop and 2-hop graph data for given entities to build context for GraphRAG.
        """
        if not entity_names:
            return []
            
        query = """
        MATCH (e1:Entity)-[r]-(e2:Entity)
        WHERE e1.name IN $entity_names
        RETURN e1.name AS source, type(r) AS relation_type, r.description AS description, e2.name AS target
        LIMIT $limit
        """
        
        results = []
        try:
            with self.driver.session() as session:
                records = session.run(query, entity_names=entity_names, limit=limit)
                for record in records:
                    results.append({
                        "source": record["source"],
                        "relation": record["description"] or record["relation_type"],
                        "target": record["target"]
                    })
            return results
        except Exception as e:
            logger.error(f"Error querying Neo4j: {e}")
            return []
            
    def get_all_nodes_edges(self, limit: int = 150):
        """
        Retrieve cytoscape formatted graph data for the frontend UI.
        """
        query = """
        MATCH (n:Entity)-[r]->(m:Entity)
        RETURN n.name AS source_id, n.type AS source_type, 
               type(r) AS edge_label, r.description AS edge_desc, 
               m.name AS target_id, m.type AS target_type
        LIMIT $limit
        """
        
        elements = []
        try:
            with self.driver.session() as session:
                records = session.run(query, limit=limit)
                for record in records:
                    s_id = str(record["source_id"])
                    t_id = str(record["target_id"])
                    
                    elements.append({
                        "data": {"id": s_id, "label": s_id, "type": record["source_type"]}
                    })
                    elements.append({
                        "data": {"id": t_id, "label": t_id, "type": record["target_type"]}
                    })
                    elements.append({
                        "data": {
                            "source": s_id,
                            "target": t_id,
                            "label": str(record["edge_desc"] or record["edge_label"])
                        }
                    })
                    
            # Basic deduplication
            seen = set()
            unique_elements = []
            for el in elements:
                key = str(el)
                if key not in seen:
                    seen.add(key)
                    unique_elements.append(el)
                    
            return unique_elements
        except Exception as e:
            logger.error(f"Error getting graph for UI: {e}")
            return []
