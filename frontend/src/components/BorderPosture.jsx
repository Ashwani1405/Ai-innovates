import React, { useState, useEffect } from 'react';
import { Crosshair, Plane, Ship, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../config';

const iconMap = { army: ShieldAlert, air: Plane, naval: Ship };

const severityColor = {
  CRIT: 'text-red-500 bg-red-950/30 border border-red-900/50',
  HIGH: 'text-orange-500 bg-orange-950/30 border border-orange-900/50',
  MED: 'text-yellow-500 bg-yellow-950/30 border border-yellow-900/50',
  LOW: 'text-emerald-500 bg-emerald-950/30 border border-emerald-900/50',
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
    <div className="bg-[#060b18] border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-red-500" />
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Border Posture</h3>
        </div>
        <span className="text-[9px] text-slate-500 tracking-widest">{theaters.length} THEATERS</span>
      </div>
      {theaters.length === 0 && <div className="text-[10px] text-slate-500 animate-pulse tracking-widest">[ LOADING INTEL... ]</div>}
      <div className="space-y-2">
        {theaters.map((t, i) => (
          <div key={i} className="bg-slate-950 p-2 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/50 pb-1.5">
              <span className="text-[10px] text-slate-300 uppercase tracking-wide">{t.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${severityColor[t.severity] || severityColor.MED}`}>
                {t.severity}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                {t.army > 0 && <div className="flex items-center gap-0.5 text-slate-400"><ShieldAlert className="w-3 h-3" /><span className="text-[10px]">{t.army}</span></div>}
                {t.air > 0 && <div className="flex items-center gap-0.5 text-slate-400"><Plane className="w-3 h-3" /><span className="text-[10px]">{t.air}</span></div>}
                {t.naval > 0 && <div className="flex items-center gap-0.5 text-slate-400"><Ship className="w-3 h-3" /><span className="text-[10px]">{t.naval}</span></div>}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 uppercase tracking-wider">
                <span>-- {t.trend}</span>
                <span className="text-slate-600">-- {t.linked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
