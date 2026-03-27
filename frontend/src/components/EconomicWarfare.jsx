import React, { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';
import { API_BASE } from '../config';

const typeColors = {
  commodity: 'bg-amber-950/30 text-amber-500 border-amber-900/50',
  currency: 'bg-red-950/30 text-red-500 border-red-900/50',
  investment: 'bg-purple-950/30 text-purple-500 border-purple-900/50',
  trade: 'bg-blue-950/30 text-blue-500 border-blue-900/50',
};

export default function EconomicWarfare() {
  const [signals, setSignals] = useState([]);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch(`${API_BASE}/economic`)
      .then(res => res.json())
      .then(data => {
        setSignals(data.signals || []);
        setSource(data.source || '');
      })
      .catch(() => setSignals([]));
  }, []);

  return (
    <div className="bg-[#060b18] border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Economic Warfare</h3>
        </div>
        <span className="text-[9px] text-slate-500 tracking-widest">{signals.length} VECTORS</span>
      </div>
      {signals.length === 0 && <div className="text-[10px] text-slate-500 animate-pulse tracking-widest">[ FETCHING ECON DATA... ]</div>}
      <div className="space-y-1.5">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 bg-slate-950 px-2 py-1.5 border border-slate-800/50 hover:bg-slate-900 transition-colors cursor-default">
            <div className="w-6 h-6 border border-slate-800 bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-amber-500">{s.severity}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-300 font-medium truncate uppercase tracking-wide">{s.label}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[8px] tracking-widest px-1 py-0.5 border uppercase ${typeColors[s.type] || typeColors.trade}`}>{s.type}</span>
                <span className="text-[9px] text-slate-500">[{s.signals} SIGNALS]</span>
                {s.source && <span className="text-[8px] text-slate-600 uppercase tracking-wider">-- {s.source}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
