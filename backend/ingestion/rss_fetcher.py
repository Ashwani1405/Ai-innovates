import feedparser
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RSSFetcher:
    def __init__(self):
        self.feeds = [
            "https://pib.gov.in/rss/Mainstream.xml",
            "http://feeds.reuters.com/reuters/worldNews"
        ]

    def fetch_all(self) -> List[Dict]:
        all_articles = []
        for feed_url in self.feeds:
            try:
                logger.info(f"Fetching RSS feed: {feed_url}")
                feed = feedparser.parse(feed_url)
                for entry in feed.entries:
                    all_articles.append({
                        "title": entry.title,
                        "url": entry.link,
                        "domain": feed_url.split('/')[2] if '/' in feed_url else feed_url,
                        "pub_date": entry.get("published", "") or entry.get("updated", ""),
                        "source": "RSS"
                    })
            except Exception as e:
                logger.error(f"Error fetching RSS {feed_url}: {e}")
        return all_articles

if __name__ == "__main__":
    fetcher = RSSFetcher()
    results = fetcher.fetch_all()
    print(f"Fetched {len(results)} RSS articles.")
    if results:
        print("Sample:", results[0])
