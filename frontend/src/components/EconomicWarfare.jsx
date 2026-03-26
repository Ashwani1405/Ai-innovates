import React, { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';

const typeColors = {
  commodity: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  currency: 'bg-red-500/20 text-red-400 border-red-500/30',
  investment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  trade: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function EconomicWarfare() {
  const [signals, setSignals] = useState([]);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch('http://localhost:8000/economic')
      .then(res => res.json())
      .then(data => {
        setSignals(data.signals || []);
        setSource(data.source || '');
      })
      .catch(() => setSignals([]));
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Economic Warfare</h3>
        </div>
        <span className="text-[10px] text-slate-500">{signals.length}</span>
      </div>
      {signals.length === 0 && <div className="text-xs text-slate-500 animate-pulse">Fetching economic data...</div>}
      <div className="space-y-2">
        {signals.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-300">{s.severity}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate">{s.label}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${typeColors[s.type] || typeColors.trade}`}>{s.type}</span>
                <span className="text-[10px] text-slate-500">{s.signals} signals →</span>
                {s.source && <span className="text-[9px] text-slate-600">{s.source}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
