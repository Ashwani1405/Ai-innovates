import React, { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function GeoMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [hotspots, setHotspots] = useState([]);
  const flightsLayerRef = useRef(null);
  const [flightCount, setFlightCount] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8000/geo')
      .then(res => res.json())
      .then(data => setHotspots(data.hotspots || []))
      .catch(() => setHotspots([]));
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (typeof window === 'undefined') return;

    // Dynamically import leaflet
    import('leaflet').then((L) => {
      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { minZoom: 4 }).setView([22.5937, 78.9629], 5);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri...',
      }).addTo(map);

      // Add India borders GeoJSON
      fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
        .then(res => res.json())
        .then(data => {
          L.geoJSON(data, {
            style: {
              color: '#ffffff', // clear borders
              weight: 1.5,
              opacity: 0.7,
              fillColor: '#818cf8', // light indigo fill
              fillOpacity: 0.05
            }
          }).addTo(map);
        })
        .catch(err => console.error('Failed to load Indian borders:', err));

      const typeColors = { conflict: '#ef4444', tension: '#f59e0b', diplomacy: '#3b82f6' };

      hotspots.forEach(h => {
        const color = typeColors[h.type] || '#6366f1';
        const circleMarker = L.circleMarker([h.lat, h.lng], {
          radius: 8,
          fillColor: color,
          color: '#1e293b',
          weight: 2,
          fillOpacity: 0.85,
        }).addTo(map);
        circleMarker.bindPopup(`<b>${h.label}</b><br/>${h.desc}`);
      });

      flightsLayerRef.current = L.featureGroup().addTo(map);

      mapInstanceRef.current = map;

      // Fix gray tile issue by invalidating size after render
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotspots]);

  useEffect(() => {
    let intervalId;
    let L_local;

    const fetchFlights = async () => {
      if (!mapInstanceRef.current || !flightsLayerRef.current) return;
      try {
        if (!L_local) {
          L_local = await import('leaflet');
        }
        // OpenSky API over roughly Indian subcontinent
        const res = await fetch('https://opensky-network.org/api/states/all?lamin=5&lomin=65&lamax=38&lomax=100');
        if (!res.ok) return;
        const data = await res.json();
        const states = data.states || [];
        setFlightCount(states.length);

        flightsLayerRef.current.clearLayers();

        states.forEach(state => {
          const [icao24, callsign, origin, timePosition, lastContact, lng, lat, baroAlt, onGround, velocity, trueTrack] = state;
          if (lat === null || lng === null || onGround) return;
          
          // -45 deg to align the SVG path so it points correctly to the track
          const iconHtml = `
            <div style="transform: rotate(${trueTrack - 45}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #38bdf8; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.5-.5-2.5 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-4 4-2.8-.9c-.3-.1-.7 0-.9.3L1 16l4.5 1.5L7 22l.6-.3c.3-.2.4-.6.3-.9L7 18l4-4 4 6 1.2-1.2.6-1.1c.4-.2.7-.6.6-1.1l-.6-10.4z"/>
              </svg>
            </div>
          `;

          const divIcon = L_local.divIcon({
            html: iconHtml,
            className: 'bg-transparent border-0',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
          });

          const marker = L_local.marker([lat, lng], { icon: divIcon });
          marker.bindPopup(`
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #334155; line-height: 1.4;">
              <b style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 2px;">✈️ Flight ${callsign?.trim() || icao24}</b>
              <b>Origin:</b> ${origin}<br/>
              <b>Alt:</b> ${baroAlt ? Math.round(baroAlt) + 'm' : 'N/A'}<br/>
              <b>Spd:</b> ${velocity ? Math.round(velocity * 3.6) + ' km/h' : 'N/A'}<br/>
              <b>Hdg:</b> ${trueTrack ? Math.round(trueTrack) + '°' : 'N/A'}
            </div>
          `);
          flightsLayerRef.current.addLayer(marker);
        });
      } catch (err) {
        console.error("Flights fetch error:", err);
      }
    };

    // delay first fetch slightly to let map load properly
    const timeoutId = setTimeout(() => {
      fetchFlights();
      intervalId = setInterval(fetchFlights, 30000); // refresh every 30s
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden shadow-xl relative">
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/80 backdrop-blur p-2.5 rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <h3 className="font-bold text-white text-xs">Geopolitical Hotspots</h3>
        </div>
        <div className="flex gap-2 mt-1.5">
          {[['Conflict','#ef4444'],['Tension','#f59e0b'],['Diplomacy','#3b82f6']].map(([l,c])=>(
            <span key={l} className="text-[9px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:c}}></span>{l}
            </span>
          ))}
        </div>
        {flightCount > 0 && (
          <div className="text-[10px] text-sky-400 mt-2 flex items-center gap-1 font-semibold">
            ✈️ {flightCount} active flights tracked
          </div>
        )}
      </div>
      <div ref={mapRef} className="w-full h-[450px]" />
    </div>
  );
}
