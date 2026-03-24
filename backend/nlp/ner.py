import os
import json
import logging
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NERExtractor:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def extract_entities(self, text: str) -> list:
        """Extract entities using Groq LLM instead of spaCy."""
        if not text:
            return []
        if not self.client:
            logger.warning("No GROQ_API_KEY. Using basic keyword extraction.")
            return self._fallback_extract(text)

        prompt = f"""Extract named entities from this text. Return ONLY a JSON list of [entity, type] pairs.
Types: GPE (country/city), PERSON, ORG, LOC, NORP (nationality/group).
Example: [["India", "GPE"], ["Modi", "PERSON"]]

Text: "{text[:500]}"
Respond with ONLY the JSON array, no markdown."""

        try:
            resp = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.0
            )
            raw = resp.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except Exception as e:
            logger.error(f"NER extraction error: {e}")
            return self._fallback_extract(text)

    def _fallback_extract(self, text):
        """Simple fallback if API fails."""
        words = text.split()
        return [[w, "ENTITY"] for w in words if w[0].isupper() and len(w) > 2][:10]
