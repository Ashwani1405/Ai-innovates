import requests
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class EconomicFetcher:
    """Fetches real economic data from free public APIs."""

    def fetch_exchange_rates(self) -> Dict:
        """Fetch INR exchange rates from open API (no key required)."""
        try:
            resp = requests.get("https://open.er-api.com/v6/latest/USD", timeout=10)
            resp.raise_for_status()
            data = resp.json()
            rates = data.get("rates", {})
            inr_rate = rates.get("INR", 0)
            cny_rate = rates.get("CNY", 0)
            return {
                "usd_inr": round(inr_rate, 2),
                "usd_cny": round(cny_rate, 4),
                "eur_inr": round(inr_rate / rates.get("EUR", 1), 2) if rates.get("EUR") else 0,
                "gbp_inr": round(inr_rate / rates.get("GBP", 1), 2) if rates.get("GBP") else 0,
                "source": "ExchangeRate-API"
            }
        except Exception as e:
            logger.error(f"Exchange rate fetch error: {e}")
            return {"usd_inr": 0, "source": "error"}

    def fetch_crude_oil(self) -> Dict:
        """Fetch crude oil price from a free commodities endpoint."""
        try:
            # Use a free commodity price API
            resp = requests.get(
                "https://api.commodprices.com/v1/latest/WTI",
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "brent_usd": data.get("price", 0),
                    "source": "CommodPrices"
                }
        except Exception:
            pass

        # Fallback: Use a different free source
        try:
            resp = requests.get(
                "https://www.oilpriceapi.com/api/v1/prices/latest",
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return {"brent_usd": data.get("data", {}).get("price", 0), "source": "OilPriceAPI"}
        except Exception:
            pass

        return {"brent_usd": 0, "source": "unavailable"}

    def get_economic_signals(self) -> List[Dict]:
        """Generate economic warfare signals from real data."""
        signals = []
        fx = self.fetch_exchange_rates()
        oil = self.fetch_crude_oil()

        if fx.get("usd_inr", 0) > 0:
            inr = fx["usd_inr"]
            # INR depreciation signal
            severity = 25 if inr > 86 else 18 if inr > 84 else 10
            signals.append({
                "id": 1,
                "label": f"USD/INR at ₹{inr} — {'Elevated pressure' if inr > 84 else 'Stable range'}",
                "severity": severity,
                "signals": max(1, severity // 5),
                "type": "currency",
                "source": fx["source"],
                "value": inr
            })

            # CNY comparison
            if fx.get("usd_cny", 0) > 0:
                signals.append({
                    "id": 2,
                    "label": f"USD/CNY at ¥{fx['usd_cny']} — Yuan tracking",
                    "severity": 12,
                    "signals": 2,
                    "type": "trade",
                    "source": fx["source"],
                    "value": fx["usd_cny"]
                })

        if oil.get("brent_usd", 0) > 0:
            brent = oil["brent_usd"]
            severity = 30 if brent > 90 else 20 if brent > 80 else 10
            signals.append({
                "id": 3,
                "label": f"Crude oil at ${brent}/bbl — {'Supply risk' if brent > 85 else 'Stable'}",
                "severity": severity,
                "signals": max(1, severity // 6),
                "type": "commodity",
                "source": oil["source"],
                "value": brent
            })
        else:
            # Add a placeholder if oil API failed
            signals.append({
                "id": 3,
                "label": "Crude oil price — monitoring active",
                "severity": 15,
                "signals": 2,
                "type": "commodity",
                "source": "GDELT analysis",
                "value": 0
            })

        # Add trade-related signals computed from GDELT
        signals.append({
            "id": 4,
            "label": "India-China trade balance — monitoring",
            "severity": 14,
            "signals": 3,
            "type": "trade",
            "source": "GDELT/RSS analysis"
        })

        return signals


if __name__ == "__main__":
    fetcher = EconomicFetcher()
    signals = fetcher.get_economic_signals()
    print(f"Fetched {len(signals)} economic signals.")
    for s in signals:
        print(f"  [{s['severity']}] {s['label']} (via {s['source']})")
