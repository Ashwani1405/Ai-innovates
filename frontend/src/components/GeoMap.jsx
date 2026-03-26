import React, { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function GeoMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [hotspots, setHotspots] = useState([]);

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

      const map = L.map(mapRef.current).setView([25, 60], 3);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }).addTo(map);

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
      </div>
      <div ref={mapRef} className="w-full h-[450px]" />
    </div>
  );
}
