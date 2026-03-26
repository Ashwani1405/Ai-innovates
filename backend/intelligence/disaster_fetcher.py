import requests
import logging
from typing import List, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DisasterFetcher:
    """Fetches real disaster data from USGS Earthquake API and other public sources."""

    USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    # India bounding box: lat 6-37, lng 68-98
    INDIA_BOUNDS = {"minlatitude": 6, "maxlatitude": 37, "minlongitude": 68, "maxlongitude": 98}

    def fetch_earthquakes(self, min_magnitude: float = 2.5, limit: int = 10) -> List[Dict]:
        """Fetch recent earthquakes in the Indian subcontinent from USGS."""
        try:
            params = {
                "format": "geojson",
                "minmagnitude": min_magnitude,
                "limit": limit,
                "orderby": "time",
                **self.INDIA_BOUNDS
            }
            resp = requests.get(self.USGS_URL, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            events = []
            for feature in data.get("features", []):
                props = feature["properties"]
                coords = feature["geometry"]["coordinates"]
                mag = props.get("mag", 0)
                severity = "CRIT" if mag >= 6 else "HIGH" if mag >= 4.5 else "MED"
                
                # Calculate time ago
                epoch_ms = props.get("time", 0)
                event_time = datetime.fromtimestamp(epoch_ms / 1000)
                delta = datetime.now() - event_time
                if delta.days > 0:
                    time_ago = f"{delta.days}d ago"
                elif delta.seconds > 3600:
                    time_ago = f"{delta.seconds // 3600}h ago"
                else:
                    time_ago = f"{delta.seconds // 60}m ago"

                events.append({
                    "type": "earthquake",
                    "label": f"Seismic activity — M{mag}, {props.get('place', 'India region')}",
                    "severity": severity,
                    "signals": max(1, int(mag * 2)),
                    "time": time_ago,
                    "lat": coords[1],
                    "lng": coords[0],
                    "magnitude": mag,
                    "source": "USGS"
                })
            return events
        except Exception as e:
            logger.error(f"USGS earthquake fetch error: {e}")
            return []

    def fetch_weather_alerts(self) -> List[Dict]:
        """Fetch weather/cyclone alerts from OpenMeteo (free, no API key)."""
        alerts = []
        # Check major cyclone-prone cities for extreme weather
        cities = [
            {"name": "Chennai", "lat": 13.08, "lng": 80.27, "region": "Tamil Nadu"},
            {"name": "Kolkata", "lat": 22.57, "lng": 88.36, "region": "West Bengal"},
            {"name": "Mumbai", "lat": 19.08, "lng": 72.88, "region": "Maharashtra"},
            {"name": "Guwahati", "lat": 26.14, "lng": 91.74, "region": "Assam"},
            {"name": "Bhubaneswar", "lat": 20.30, "lng": 85.82, "region": "Odisha"},
        ]
        try:
            for city in cities:
                resp = requests.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": city["lat"],
                        "longitude": city["lng"],
                        "current": "temperature_2m,wind_speed_10m,precipitation",
                        "timezone": "Asia/Kolkata"
                    },
                    timeout=5
                )
                if resp.status_code == 200:
                    current = resp.json().get("current", {})
                    wind = current.get("wind_speed_10m", 0)
                    precip = current.get("precipitation", 0)

                    if wind > 60:
                        alerts.append({
                            "type": "cyclone",
                            "label": f"High wind alert — {city['name']}, {city['region']} ({wind} km/h)",
                            "severity": "CRIT" if wind > 100 else "HIGH",
                            "signals": int(wind / 10),
                            "time": "Now",
                            "source": "OpenMeteo"
                        })
                    if precip > 20:
                        alerts.append({
                            "type": "flood",
                            "label": f"Heavy rainfall — {city['name']}, {city['region']} ({precip}mm)",
                            "severity": "HIGH" if precip > 50 else "MED",
                            "signals": int(precip / 5),
                            "time": "Now",
                            "source": "OpenMeteo"
                        })
        except Exception as e:
            logger.error(f"Weather alert fetch error: {e}")
        return alerts

    def get_all_disasters(self) -> List[Dict]:
        """Combine all disaster sources."""
        disasters = self.fetch_earthquakes(min_magnitude=2.5, limit=5)
        disasters.extend(self.fetch_weather_alerts())
        # Sort by severity
        severity_order = {"CRIT": 0, "HIGH": 1, "MED": 2, "LOW": 3}
        disasters.sort(key=lambda d: severity_order.get(d.get("severity", "LOW"), 3))
        return disasters


if __name__ == "__main__":
    fetcher = DisasterFetcher()
    results = fetcher.get_all_disasters()
    print(f"Fetched {len(results)} disaster events.")
    for r in results:
        print(f"  [{r['severity']}] {r['label']} ({r['source']})")
