import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Plane, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function GeoMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [hotspots, setHotspots] = useState([]);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [flightImage, setFlightImage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/geo')
      .then(res => res.json())
      .then(data => setHotspots(data.hotspots || []))
      .catch(() => setHotspots([]));
  }, []);

  // Poll for flights
  useEffect(() => {
    // Poll OpenSky via backend proxy (authenticated — 4000 credits/day)
    const fetchFlights = async () => {
      try {
        const res = await fetch('http://localhost:8000/air-traffic', {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data && data.states) {
          const parsed = data.states.map(s => ({
            icao24: s[0],
            callsign: s[1] ? s[1].trim() : 'UNKNOWN',
            origin_country: s[2],
            lng: s[5],
            lat: s[6],
            altitude: s[7],
            velocity: s[9],
            true_track: s[10],
            vertical_rate: s[11],
          })).filter(f => f.lat && f.lng);
          setFlights(parsed);
        }
      } catch (err) {
        console.error('Failed to fetch flights:', err);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 30000); // 30s intervals (saves API credits)
    return () => clearInterval(interval);
  }, []);

  // Fetch flight image
  useEffect(() => {
    if (selectedFlight && selectedFlight.icao24) {
      setFlightImage(null);
      fetch(`https://api.planespotters.net/pub/photos/hex/${selectedFlight.icao24}`)
        .then(res => res.json())
        .then(data => {
          if (data.photos && data.photos.length > 0) {
            setFlightImage(data.photos[0].thumbnail_large.src);
          }
        })
        .catch(() => setFlightImage(null));
    }
  }, [selectedFlight]);

  // Leaflet map setup
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

  // Handle flight markers
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      // Yellow plane SVG mapped with actual orientation 
      const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" stroke="#000" stroke-width="0.5" class="w-6 h-6"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3.2 3.2-2.4-.8-1.1 1.2 3.2 1.6 1.6 3.2 1.2-1.1-.8-2.4L11 15l5 6h1.2c.4-.2.7-.6.6-1.1z"/></svg>`;

      const currentIds = new Set(flights.map(f => f.icao24));

      // Remove stale markers
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });

      // Add or update markers
      flights.forEach(f => {
        const rotation = f.true_track || 0;
        // Transform the rotation around center and adjust SVG anchor
        const html = `<div style="transform: rotate(${rotation}deg); width: 24px; height: 24px; margin-left: -12px; margin-top: -12px; filter: drop-shadow(0 0 2px #000);">${planeSvg}</div>`;

        if (markersRef.current[f.icao24]) {
          const marker = markersRef.current[f.icao24];
          marker.setLatLng([f.lat, f.lng]);
          marker.setIcon(L.divIcon({ html, className: 'plane-icon', iconSize: [0, 0] }));
        } else {
          const icon = L.divIcon({ html, className: 'plane-icon', iconSize: [0, 0] });
          const marker = L.marker([f.lat, f.lng], { icon }).addTo(map);
          marker.on('click', () => {
            // Zoom to flight optionally, but just setting it for now
            setSelectedFlight(f);
          });
          markersRef.current[f.icao24] = marker;
        }
      });
    });
  }, [flights]);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden shadow-xl relative w-full h-full lg:min-h-[600px]">
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/80 backdrop-blur p-2.5 rounded-lg border border-slate-700 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <h3 className="font-bold text-white text-xs">Geopolitical Hotspots & Traffic</h3>
        </div>
        <div className="flex gap-2 mt-1.5">
          {[['Conflict', '#ef4444'], ['Tension', '#f59e0b'], ['Diplomacy', '#3b82f6'], ['Air Traffic', '#f59e0b']].map(([l, c]) => (
            <span key={l} className="text-[9px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }}></span>{l}
            </span>
          ))}
        </div>
      </div>

      {/* Selected Flight Card Overlay */}
      {selectedFlight && (
        <div className="absolute top-3 right-3 z-[1000] w-72 bg-slate-950/95 backdrop-blur rounded-lg border border-emerald-900/50 shadow-2xl overflow-hidden font-mono text-xs flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-emerald-900/50 bg-slate-900/50">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Plane className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold tracking-widest text-[10px]">FLIGHT DATA</span>
            </div>
            <button onClick={() => setSelectedFlight(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badges / Title */}
          <div className="p-3 pb-2">
            <div className="flex gap-1.5 mb-2">
              <span className="px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 rounded text-[9px]">
                {selectedFlight.altitude ? `${Math.round(selectedFlight.altitude)}M` : 'UKN'}
              </span>
              <span className="px-1.5 py-0.5 bg-sky-900/30 text-sky-400 border border-sky-800/50 rounded text-[9px]">
                {selectedFlight.velocity ? `${Math.round(selectedFlight.velocity * 3.6)} KM/H` : 'UKN'}
              </span>
              {selectedFlight.vertical_rate > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 border border-amber-800/50 rounded text-[9px]">CLIMBING</span>
              )}
              {selectedFlight.vertical_rate < 0 && (
                <span className="px-1.5 py-0.5 bg-rose-900/30 text-rose-400 border border-rose-800/50 rounded text-[9px]">DESCENDING</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">{selectedFlight.callsign && selectedFlight.callsign !== 'UNKNOWN' ? selectedFlight.callsign : `FLIGHT ${selectedFlight.icao24?.toUpperCase()}`}</h2>
            <p className="text-slate-400 text-[10px] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{selectedFlight.origin_country}</p>
            <p className="text-slate-500 text-[9px] mt-1 space-x-2">
              <span>ICAO: {selectedFlight.icao24?.toUpperCase()}</span>
              <span>TRK: {Math.round(selectedFlight.true_track || 0)}°</span>
            </p>
          </div>

          {/* Image container */}
          <div className="w-full h-36 bg-slate-900 border-y border-emerald-900/30 relative flex items-center justify-center">
            {flightImage ? (
              <img src={flightImage} alt="aircraft" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-600 flex flex-col items-center gap-2">
                <Plane className="w-8 h-8 opacity-50" />
                <span className="text-[9px]">NO IMAGE AVAILABLE</span>
              </div>
            )}
          </div>

          {/* Detailed Data list */}
          <div className="p-3 space-y-2.5">
            <div className="text-[10px] tracking-widest text-slate-500 mb-1">AIRCRAFT</div>
            <div className="flex justify-between border-b mx-0.5 border-slate-800 pb-1">
              <span className="text-slate-400">OPERATOR</span>
              <span className="text-slate-200 font-semibold text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{selectedFlight.origin_country}</span>
            </div>
            <div className="flex justify-between border-b mx-0.5 border-slate-800 pb-1">
              <span className="text-slate-400">HEX CODE</span>
              <span className="text-slate-200 font-semibold text-right">{selectedFlight.icao24?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b mx-0.5 border-slate-800 pb-1">
              <span className="text-slate-400">ALTITUDE</span>
              <span className="text-slate-200 font-semibold text-right">{selectedFlight.altitude ? `${Math.round(selectedFlight.altitude)} M` : 'UNKNOWN'}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-400">HEADING</span>
              <span className="text-slate-200 font-semibold text-right">{Math.round(selectedFlight.true_track || 0)}°</span>
            </div>
          </div>
        </div>
      )}

      {/* The map div must have z-0 so it doesn't cover overlays */}
      <div ref={mapRef} className="w-full h-[450px] lg:h-full z-0" />
    </div>
  );
}

