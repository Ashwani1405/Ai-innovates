import requests
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GDELTFetcher:
    def __init__(self):
        self.base_url = "https://api.gdeltproject.org/api/v2/doc/doc"

    def fetch_recent_articles(self, keywords: List[str], max_records: int = 50) -> List[Dict]:
        """
        Fetch recent articles from GDELT matching given keywords.
        """
        if not keywords:
            return []
            
        # Group keywords with OR for broad matching
        query = " OR ".join(keywords)
        params = {
            "query": query,
            "mode": "artlist",
            "maxrecords": max_records,
            "format": "json"
        }
        try:
            logger.info(f"Fetching GDELT articles for query: {query}")
            response = requests.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            articles = data.get("articles", [])
            return [
                {
                    "title": art.get("title"),
                    "url": art.get("url"),
                    "domain": art.get("domain"),
                    "pub_date": art.get("seendate"),
                    "source": "GDELT"
                }
                for art in articles
            ]
        except Exception as e:
            logger.error(f"Error fetching from GDELT: {e}")
            return []

if __name__ == "__main__":
    fetcher = GDELTFetcher()
    results = fetcher.fetch_recent_articles(["India", "China", "Border"])
    print(f"Fetched {len(results)} articles.")
    if results:
        print("Sample:", results[0])
