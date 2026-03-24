import os
import logging
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Neo4jWriter:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        
    def close(self):
        self.driver.close()
        
    def write_article_and_entities(self, article: dict, entities: list, relations: list):
        """
        Write parsed data into the Neo4j Graph.
        """
        query = """
        // 1. Create Article Node
        MERGE (a:Article {url: $url})
        SET a.title = $title, 
            a.domain = $domain, 
            a.pub_date = $pub_date, 
            a.source = $source
        
        // 2. Create Entity Nodes and Link to Article
        WITH a
        UNWIND $entities AS ent
        MERGE (e:Entity {name: ent[0]})
        SET e.type = ent[1]
        MERGE (a)-[:MENTIONS]->(e)
        
        // 3. Create Relations between Entities
        WITH a
        UNWIND $relations AS rel
        MERGE (subj:Entity {name: rel.subject})
        MERGE (obj:Entity {name: rel.object})
        MERGE (subj)-[r:RELATED_TO]->(obj)
        SET r.description = rel.relation
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, 
                            url=article.get("url"),
                            title=article.get("title"),
                            domain=article.get("domain"),
                            pub_date=article.get("pub_date"),
                            source=article.get("source"),
                            entities=entities,
                            relations=relations)
            logger.info(f"Successfully wrote graph data for {article.get('url')}")
        except Exception as e:
            logger.error(f"Error writing to Neo4j: {e}")

if __name__ == "__main__":
    writer = Neo4jWriter()
    writer.close()
