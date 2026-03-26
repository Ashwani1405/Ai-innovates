import logging
import os
import json
from typing import List, Dict

logger = logging.getLogger(__name__)

class IntelligenceAnalyzer:
    """Uses Groq LLM to compute state volatility, border posture, and risk scores
    from real news data (GDELT + RSS articles)."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except Exception:
                pass

    def _ask_llm(self, prompt: str) -> str:
        """Send a prompt to Groq LLM and return raw text response."""
        if not self.client:
            return ""
        try:
            resp = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.1
            )
            raw = resp.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return raw.strip()
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            return ""

    def compute_state_volatility(self, articles: List[Dict]) -> List[Dict]:
        """Use LLM to analyze news headlines and score Indian state volatility."""
        if not articles:
            return self._fallback_state_volatility()

        headlines = "\n".join([a.get("title", "") for a in articles[:20] if a.get("title")])
        prompt = f"""Analyze these recent Indian news headlines and assess internal security volatility for Indian states.

Headlines:
{headlines}

Return ONLY a JSON array of objects, each with:
- "name": state name
- "score": volatility score 0-100
- "delta": change trend (-5 to +5)
- "u": unrest incidents count estimate
- "c": cyber threat count estimate  
- "s": separatism/extremism count estimate
- "i": infrastructure disruption count estimate

Include exactly these states: Jammu & Kashmir, Manipur, Punjab, West Bengal, Chhattisgarh, Assam, Maharashtra, Uttar Pradesh.
Base scores on actual news content. If no news about a state, give low scores.
Return ONLY the JSON array."""

        raw = self._ask_llm(prompt)
        if raw:
            try:
                states = json.loads(raw)
                if isinstance(states, list) and len(states) > 0:
                    states.sort(key=lambda s: s.get("score", 0), reverse=True)
                    return states
            except json.JSONDecodeError:
                logger.error("Failed to parse state volatility JSON from LLM")
        return self._fallback_state_volatility()

    def compute_border_posture(self, articles: List[Dict]) -> List[Dict]:
        """Use LLM to analyze news and assess border theater status."""
        if not articles:
            return self._fallback_border_posture()

        headlines = "\n".join([a.get("title", "") for a in articles[:20] if a.get("title")])
        prompt = f"""Analyze these news headlines and assess India's border security posture.

Headlines:
{headlines}

Return ONLY a JSON array with these 4 theaters:
1. LAC – Ladakh / Arunachal (India-China border)
2. LOC – Kashmir (India-Pakistan border)
3. Indo-Myanmar Border
4. Indian Ocean Region (IOR)

Each object must have:
- "name": theater name as listed above
- "severity": one of "CRIT", "HIGH", "MED", "LOW"
- "trend": one of "escalating", "stable", "de-escalating"
- "linked": linked country/region
- "army": estimated army deployment level 0-10
- "air": estimated air force deployment level 0-5
- "naval": estimated naval deployment level 0-5

Base severity on actual news content. Return ONLY the JSON array."""

        raw = self._ask_llm(prompt)
        if raw:
            try:
                theaters = json.loads(raw)
                if isinstance(theaters, list) and len(theaters) > 0:
                    return theaters
            except json.JSONDecodeError:
                logger.error("Failed to parse border posture JSON from LLM")
        return self._fallback_border_posture()

    def compute_risk_score(self, disasters: List, economic: List, states: List, borders: List) -> Dict:
        """Compute aggregate national risk score from all intelligence sources."""
        score = 30  # Base

        # Disaster contribution
        for d in disasters:
            if d.get("severity") == "CRIT": score += 8
            elif d.get("severity") == "HIGH": score += 4
            elif d.get("severity") == "MED": score += 2

        # Economic contribution
        for e in economic:
            score += min(e.get("severity", 0) / 5, 4)

        # State volatility contribution
        if states:
            avg_vol = sum(s.get("score", 0) for s in states) / len(states)
            score += avg_vol / 10

        # Border contribution
        for b in borders:
            sev = b.get("severity", "LOW")
            if sev == "CRIT": score += 6
            elif sev == "HIGH": score += 3
            elif sev == "MED": score += 1

        score = max(0, min(100, int(score)))

        # Compute trend based on deltas
        if states:
            avg_delta = sum(s.get("delta", 0) for s in states) / len(states)
            trend = "escalating" if avg_delta > 1 else "de-escalating" if avg_delta < -1 else "stable"
        else:
            trend = "stable"

        return {"score": score, "trend": trend, "source": "computed"}

    def _fallback_state_volatility(self) -> List[Dict]:
        """Fallback when LLM is unavailable — returns neutral scores backed by general knowledge."""
        return [
            {"name": "Jammu & Kashmir", "score": 65, "delta": 0, "u": 30, "c": 8, "s": 18, "i": 9},
            {"name": "Manipur", "score": 58, "delta": -1, "u": 25, "c": 3, "s": 20, "i": 10},
            {"name": "Punjab", "score": 35, "delta": 0, "u": 12, "c": 5, "s": 10, "i": 8},
            {"name": "West Bengal", "score": 30, "delta": 0, "u": 10, "c": 4, "s": 6, "i": 10},
            {"name": "Chhattisgarh", "score": 40, "delta": -1, "u": 20, "c": 2, "s": 12, "i": 6},
        ]

    def _fallback_border_posture(self) -> List[Dict]:
        """Fallback border posture when LLM is unavailable."""
        return [
            {"name": "LAC – Ladakh / Arunachal", "severity": "HIGH", "trend": "stable", "linked": "China", "army": 4, "air": 2, "naval": 0},
            {"name": "LOC – Kashmir", "severity": "HIGH", "trend": "stable", "linked": "Pakistan", "army": 5, "air": 2, "naval": 0},
            {"name": "Indo-Myanmar Border", "severity": "MED", "trend": "stable", "linked": "Myanmar", "army": 2, "air": 0, "naval": 0},
            {"name": "Indian Ocean Region", "severity": "MED", "trend": "stable", "linked": "IOR", "army": 0, "air": 1, "naval": 4},
        ]
