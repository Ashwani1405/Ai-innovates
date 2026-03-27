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
  CRIT: 'text-red-500 bg-red-950/30 border border-red-900/50',
  HIGH: 'text-orange-500 bg-orange-950/30 border border-orange-900/50',
  MED: 'text-yellow-500 bg-yellow-950/30 border border-yellow-900/50',
  LOW: 'text-emerald-500 bg-emerald-950/30 border border-emerald-900/50',
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
    <div className="bg-[#060b18] border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Disaster Cascade</h3>
        </div>
        <span className="text-[9px] text-slate-500 tracking-widest">{events.length} EVENTS</span>
      </div>
      {events.length === 0 && <div className="text-[10px] text-slate-500 animate-pulse tracking-widest">[ SCANNING USGS/WEATHER... ]</div>}
      <div className="space-y-1.5">
        {events.map((e, i) => {
          const Icon = iconMap[e.type] || AlertTriangle;
          const color = colorMap[e.type] || 'text-slate-400';
          return (
            <div key={i} className="flex items-start gap-2.5 bg-slate-950 px-2 py-1.5 border border-slate-800/50 hover:bg-slate-900 transition-colors">
              <div className="mt-0.5 flex-shrink-0">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">{e.label}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[8px] font-bold px-1 py-0.5 tracking-widest border uppercase ${severityBadge[e.severity] || severityBadge.MED}`}>
                    {e.severity}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest">T-{e.timeStatus || 'UNKNOWN'}</span>
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
