import os
import json
import logging
from groq import Groq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RelationExtractor:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        
    def extract_relations(self, text: str):
        """
        Extract relationship triples (subject, relation, object) from text using Groq LLM.
        """
        if not self.client:
            logger.warning("GROQ_API_KEY not set. Mocking relation extraction.")
            return []
            
        prompt = f"""
Given the following text, extract geopolitical or economic relationships as a JSON list of objects.
Each object should have: "subject" (Entity 1), "relation" (verb phrase describing connection), "object" (Entity 2).
Example: [{{"subject": "India", "relation": "clashed at", "object": "LAC border"}}]

Text: "{text}"
Respond ONLY with valid JSON. Do not include markdown formatting or explanations.
"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.0
            )
            response_text = chat_completion.choices[0].message.content.strip()
            
            # Cleanup JSON blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]
                
            return json.loads(response_text)
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return []

if __name__ == "__main__":
    os.environ["GROQ_API_KEY"] = "sample_key_for_testing_only"
    extractor = RelationExtractor()
    # It will fail auth since it's a sample key, but tests the method skeleton.
