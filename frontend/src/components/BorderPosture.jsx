import React, { useState, useEffect } from 'react';
import { Crosshair, Plane, Ship, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../config';

const iconMap = { army: ShieldAlert, air: Plane, naval: Ship };

const severityColor = {
  CRIT: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LOW: 'text-green-400 bg-green-500/10 border-green-500/30',
};

export default function BorderPosture() {
  const [theaters, setTheaters] = useState([]);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch(`${API_BASE}/border-posture`)
      .then(res => res.json())
      .then(data => {
        setTheaters(data.theaters || []);
        setSource(data.source || '');
      })
      .catch(() => setTheaters([]));
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-red-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Border Posture</h3>
        </div>
        <span className="text-[10px] text-slate-500">{theaters.length} theaters</span>
      </div>
      {theaters.length === 0 && <div className="text-xs text-slate-500 animate-pulse">Loading intelligence...</div>}
      <div className="space-y-2.5">
        {theaters.map((t, i) => (
          <div key={i} className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/50 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white">{t.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${severityColor[t.severity] || severityColor.MED}`}>
                {t.severity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {t.army > 0 && <div className="flex items-center gap-0.5 text-slate-400"><ShieldAlert className="w-3 h-3" /><span className="text-[10px]">{t.army}</span></div>}
                {t.air > 0 && <div className="flex items-center gap-0.5 text-slate-400"><Plane className="w-3 h-3" /><span className="text-[10px]">{t.air}</span></div>}
                {t.naval > 0 && <div className="flex items-center gap-0.5 text-slate-400"><Ship className="w-3 h-3" /><span className="text-[10px]">{t.naval}</span></div>}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>→ {t.trend}</span>
                <span className="text-slate-600">→ {t.linked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
