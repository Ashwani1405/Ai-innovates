import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Plane, X } from 'lucide-react';
import { API_BASE } from '../config';
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
    fetch(`${API_BASE}/geo`)
      .then(res => res.json())
      .then(data => setHotspots(data.hotspots || []))
      .catch(() => setHotspots([]));
  }, []);

  // Poll for flights
  useEffect(() => {
    // Poll OpenSky directly from the browser (bypasses cloud IP bans)
    const fetchFlights = async () => {
      try {
        const res = await fetch('https://opensky-network.org/api/states/all?lamin=6.7&lomin=68.1&lamax=35.5&lomax=97.4', {
          cache: 'no-store'
        });
        const data = await res.json();
        if (data && data.states && data.states.length > 0) {
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
    const interval = setInterval(fetchFlights, 30000); // 30s intervals
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

      // India state detail data for hover cards
      const stateData = {
        'Andhra Pradesh': { capital: 'Amaravati', pop: '52.2M', density: '308/km²', area: '162,975 km²' },
        'Arunachal Pradesh': { capital: 'Itanagar', pop: '1.6M', density: '17/km²', area: '83,743 km²' },
        'Assam': { capital: 'Dispur', pop: '35.6M', density: '397/km²', area: '78,438 km²' },
        'Bihar': { capital: 'Patna', pop: '124.8M', density: '1,106/km²', area: '94,163 km²' },
        'Chhattisgarh': { capital: 'Raipur', pop: '29.4M', density: '189/km²', area: '135,194 km²' },
        'Goa': { capital: 'Panaji', pop: '1.5M', density: '394/km²', area: '3,702 km²' },
        'Gujarat': { capital: 'Gandhinagar', pop: '63.9M', density: '308/km²', area: '196,024 km²' },
        'Haryana': { capital: 'Chandigarh', pop: '28.9M', density: '573/km²', area: '44,212 km²' },
        'Himachal Pradesh': { capital: 'Shimla', pop: '7.3M', density: '123/km²', area: '55,673 km²' },
        'Jharkhand': { capital: 'Ranchi', pop: '38.6M', density: '414/km²', area: '79,710 km²' },
        'Karnataka': { capital: 'Bengaluru', pop: '67.0M', density: '319/km²', area: '191,791 km²' },
        'Kerala': { capital: 'Thiruvananthapuram', pop: '35.6M', density: '860/km²', area: '38,863 km²' },
        'Madhya Pradesh': { capital: 'Bhopal', pop: '85.4M', density: '236/km²', area: '308,245 km²' },
        'Maharashtra': { capital: 'Mumbai', pop: '123.2M', density: '365/km²', area: '307,713 km²' },
        'Manipur': { capital: 'Imphal', pop: '3.1M', density: '128/km²', area: '22,327 km²' },
        'Meghalaya': { capital: 'Shillong', pop: '3.3M', density: '132/km²', area: '22,429 km²' },
        'Mizoram': { capital: 'Aizawl', pop: '1.2M', density: '52/km²', area: '21,081 km²' },
        'Nagaland': { capital: 'Kohima', pop: '2.2M', density: '119/km²', area: '16,579 km²' },
        'Odisha': { capital: 'Bhubaneswar', pop: '46.4M', density: '270/km²', area: '155,707 km²' },
        'Punjab': { capital: 'Chandigarh', pop: '30.1M', density: '551/km²', area: '50,362 km²' },
        'Rajasthan': { capital: 'Jaipur', pop: '79.5M', density: '200/km²', area: '342,239 km²' },
        'Sikkim': { capital: 'Gangtok', pop: '0.7M', density: '86/km²', area: '7,096 km²' },
        'Tamil Nadu': { capital: 'Chennai', pop: '77.8M', density: '555/km²', area: '130,058 km²' },
        'Telangana': { capital: 'Hyderabad', pop: '39.0M', density: '312/km²', area: '112,077 km²' },
        'Tripura': { capital: 'Agartala', pop: '4.2M', density: '350/km²', area: '10,486 km²' },
        'Uttar Pradesh': { capital: 'Lucknow', pop: '231.5M', density: '829/km²', area: '240,928 km²' },
        'Uttarakhand': { capital: 'Dehradun', pop: '11.3M', density: '189/km²', area: '53,483 km²' },
        'West Bengal': { capital: 'Kolkata', pop: '99.6M', density: '1,029/km²', area: '88,752 km²' },
        'Jammu and Kashmir': { capital: 'Srinagar', pop: '14.9M', density: '56/km²', area: '222,236 km²' },
        'Ladakh': { capital: 'Leh', pop: '0.3M', density: '3/km²', area: '59,146 km²' },
        'Delhi': { capital: 'New Delhi', pop: '20.0M', density: '11,320/km²', area: '1,484 km²' },
        'Chandigarh': { capital: 'Chandigarh', pop: '1.2M', density: '9,252/km²', area: '114 km²' },
      };

      // Add India state borders with hover interaction
      fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
        .then(res => res.json())
        .then(geoData => {
          L.geoJSON(geoData, {
            style: {
              color: '#38bdf8',
              weight: 1,
              opacity: 0.35,
              fillColor: '#0ea5e9',
              fillOpacity: 0.03,
              dashArray: '',
            },
            onEachFeature: (feature, layer) => {
              const name = feature.properties.NAME_1 || feature.properties.name || 'Unknown';
              const info = stateData[name] || { capital: '--', pop: '--', density: '--', area: '--' };
              
              layer.on({
                mouseover: (e) => {
                  const lyr = e.target;
                  lyr.setStyle({
                    weight: 2.5,
                    color: '#38bdf8',
                    opacity: 0.9,
                    fillOpacity: 0.12,
                  });
                  lyr.bringToFront();
                  // Don't bring hotspot markers to back
                },
                mouseout: (e) => {
                  const lyr = e.target;
                  lyr.setStyle({
                    weight: 1,
                    color: '#38bdf8',
                    opacity: 0.35,
                    fillOpacity: 0.03,
                  });
                },
              });

              const popupContent = `
                <div style="font-family: 'JetBrains Mono', monospace; min-width: 180px;">
                  <div style="font-size: 12px; font-weight: 700; color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px;">${name}</div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 10px;">
                    <div style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Capital</div>
                    <div style="color: #e2e8f0; text-align: right; font-weight: 600;">${info.capital}</div>
                    <div style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Population</div>
                    <div style="color: #e2e8f0; text-align: right; font-weight: 600;">${info.pop}</div>
                    <div style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Density</div>
                    <div style="color: #e2e8f0; text-align: right; font-weight: 600;">${info.density}</div>
                    <div style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Area</div>
                    <div style="color: #e2e8f0; text-align: right; font-weight: 600;">${info.area}</div>
                  </div>
                </div>
              `;
              layer.bindPopup(popupContent, {
                className: 'state-popup',
                closeButton: false,
                offset: [0, -5],
              });
              layer.on('mouseover', (e) => {
                layer.openPopup(e.latlng);
              });
              layer.on('mouseout', () => {
                layer.closePopup();
              });
            }
          }).addTo(map);
        })
        .catch(err => console.error('Failed to load Indian borders:', err));

      const typeColors = { conflict: '#ef4444', tension: '#f59e0b', diplomacy: '#3b82f6' };

      // Create a custom pane so hotspots render ABOVE the GeoJSON polygons
      map.createPane('hotspots');
      map.getPane('hotspots').style.zIndex = 650;

      hotspots.forEach(h => {
        const color = typeColors[h.type] || '#6366f1';
        const circleMarker = L.circleMarker([h.lat, h.lng], {
          radius: 8,
          fillColor: color,
          color: '#0f172a',
          weight: 2,
          fillOpacity: 0.9,
          pane: 'hotspots',
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
    <div className="border border-slate-800 bg-[#060b18] overflow-hidden relative w-full h-full lg:min-h-[600px] z-0">
      <div className="absolute bottom-3 left-3 z-[1000] bg-black/80 backdrop-blur p-2 border border-slate-800 pointer-events-auto">
        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <h3 className="font-bold text-slate-300 text-[9px] tracking-widest uppercase">GEO-HOTSPOTS & TRAFFIC</h3>
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
        <div className="absolute top-3 right-3 z-[1000] w-72 bg-[#060b18]/95 backdrop-blur border border-emerald-900 overflow-hidden font-mono text-xs flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-emerald-900/50 bg-black/50">
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
              <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-500 border border-emerald-900/50 text-[9px] tracking-widest">
                {selectedFlight.altitude ? `${Math.round(selectedFlight.altitude)}M` : 'UKN'}
              </span>
              <span className="px-1.5 py-0.5 bg-sky-950/50 text-sky-500 border border-sky-900/50 text-[9px] tracking-widest">
                {selectedFlight.velocity ? `${Math.round(selectedFlight.velocity * 3.6)} KM/H` : 'UKN'}
              </span>
              {selectedFlight.vertical_rate > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-950/50 text-amber-500 border border-amber-900/50 text-[9px] tracking-widest">CLIMBING</span>
              )}
              {selectedFlight.vertical_rate < 0 && (
                <span className="px-1.5 py-0.5 bg-rose-950/50 text-rose-500 border border-rose-900/50 text-[9px] tracking-widest">DESCENDING</span>
              )}
            </div>
            <h2 className="text-[14px] font-bold text-slate-100 uppercase tracking-[0.15em]">{selectedFlight.callsign && selectedFlight.callsign !== 'UNKNOWN' ? selectedFlight.callsign : `FLIGHT ${selectedFlight.icao24?.toUpperCase()}`}</h2>
            <p className="text-slate-400 text-[9px] tracking-widest uppercase mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{selectedFlight.origin_country}</p>
            <p className="text-slate-500 text-[9px] mt-1 space-x-2">
              <span>ICAO: {selectedFlight.icao24?.toUpperCase()}</span>
              <span>TRK: {Math.round(selectedFlight.true_track || 0)}°</span>
            </p>
          </div>

          {/* Image container */}
          <div className="w-full h-36 bg-black border-y border-emerald-900/50 relative flex items-center justify-center">
            {flightImage ? (
              <img src={flightImage} alt="aircraft" className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all" />
            ) : (
              <div className="text-slate-700 flex flex-col items-center gap-2">
                <Plane className="w-8 h-8 opacity-50" />
                <span className="text-[9px] tracking-widest">[ NO ASSET ACQUIRED ]</span>
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

