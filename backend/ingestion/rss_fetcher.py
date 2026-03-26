import requests
import xml.etree.ElementTree as ET
import logging
from typing import List, Dict
import urllib.parse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RSSFetcher:
    def __init__(self):
        # High-signal Indian news RSS feeds
        self.rss_urls = [
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
            "https://feeds.feedburner.com/ndtvnews-india-news"
        ]

    def fetch_rss_articles(self, max_records: int = 15) -> List[Dict]:
        """Fetch and parse recent articles from Indian RSS feeds."""
        articles = []
        for url in self.rss_urls:
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                
                # Parse XML
                root = ET.fromstring(response.content)
                domain = urllib.parse.urlparse(url).netloc
                
                # RSS structure usually has channel -> item
                items = root.findall('.//item')
                for item in items[:max_records]:
                    title = item.find('title')
                    link = item.find('link')
                    pub_date = item.find('pubDate')
                    
                    if title is not None and link is not None:
                        articles.append({
                            "title": title.text,
                            "url": link.text,
                            "domain": domain.replace("feeds.feedburner.com", "ndtv.com"),
                            "pub_date": pub_date.text if pub_date is not None else "",
                            "source": "RSS (India)"
                        })
            except Exception as e:
                logger.error(f"Error fetching RSS from {url}: {e}")
                
        # Sort or just return the list limited to max_records total if needed
        # We'll just return all fetched and let the caller slice
        return articles[:max_records*len(self.rss_urls)]

if __name__ == "__main__":
    fetcher = RSSFetcher()
    results = fetcher.fetch_rss_articles(3)
    print(f"Fetched {len(results)} RSS articles.")
    if results:
        print("Sample:", results[0])
