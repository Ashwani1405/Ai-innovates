import React, { useState, useEffect } from 'react';
import { CloudLightning, Flame, Waves, Mountain, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

const iconMap = {
  earthquake: Mountain,
  cyclone: CloudLightning,
  flood: Waves,
  fire: Flame,
};
const colorMap = {
  earthquake: 'text-amber-400',
  cyclone: 'text-red-400',
  flood: 'text-blue-400',
  fire: 'text-orange-400',
};
const severityBadge = {
  CRIT: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LOW: 'text-green-400 bg-green-500/10 border-green-500/30',
};

export default function DisasterMonitor() {
  const [events, setEvents] = useState([]);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch(`${API_BASE}/disasters`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setSource(data.source || '');
      })
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Disaster Cascade</h3>
        </div>
        <span className="text-[10px] text-slate-500">{events.length}</span>
      </div>
      {events.length === 0 && <div className="text-xs text-slate-500 animate-pulse">Scanning USGS + weather APIs...</div>}
      <div className="space-y-2">
        {events.map((e, i) => {
          const Icon = iconMap[e.type] || AlertTriangle;
          const color = colorMap[e.type] || 'text-slate-400';
          return (
            <div key={i} className="flex items-start gap-2.5 bg-slate-800/50 rounded-lg px-3 py-2.5 border border-slate-700/50 hover:border-slate-600 transition-colors">
              <div className="mt-0.5 flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-medium">{e.label}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityBadge[e.severity] || severityBadge.MED}`}>
                    {e.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">{e.signals} signals</span>
                  <span className="text-[10px] text-slate-600">{e.time}</span>
                  {e.source && <span className="text-[9px] text-slate-600">({e.source})</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
