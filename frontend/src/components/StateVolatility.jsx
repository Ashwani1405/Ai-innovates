import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { API_BASE } from '../config';

function getBarColor(score) {
  if (score >= 70) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-500';
  if (score >= 30) return 'bg-amber-500';
  return 'bg-green-500';
}

function getDotColor(score) {
  if (score >= 70) return 'bg-red-400';
  if (score >= 50) return 'bg-orange-400';
  if (score >= 30) return 'bg-amber-400';
  return 'bg-green-400';
}

export default function StateVolatility() {
  const [states, setStates] = useState([]);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch(`${API_BASE}/state-volatility`)
      .then(res => res.json())
      .then(data => {
        setStates(data.states || []);
        setSource(data.source || '');
      })
      .catch(() => setStates([]));
  }, []);

  return (
    <div className="bg-[#060b18] border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">State Volatility</h3>
        </div>
      </div>
      {states.length === 0 && <div className="text-[10px] text-slate-500 animate-pulse tracking-widest">[ ANALYZING NEWS HEADLINES... ]</div>}
      <div className="space-y-0.5">
        {states.map((s) => {
          const delta = s.delta || 0;
          const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
          const deltaColor = delta > 0 ? 'text-red-400' : delta < 0 ? 'text-green-400' : 'text-slate-500';
          return (
            <div key={s.name} className="py-1.5 border-b border-slate-800/50">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 ${getDotColor(s.score)}`} />
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wide flex-1">{s.name}</span>
                <span className="text-[10px] font-bold text-slate-100">{s.score}</span>
                <DeltaIcon className={`w-3 h-3 ${deltaColor}`} />
                <span className={`text-[9px] ${deltaColor}`}>{delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : '--'}</span>
              </div>
              <div className="w-full h-1 bg-slate-900 border border-slate-800 flex items-center">
                <div className={`h-full ${getBarColor(s.score)} transition-all duration-700`} style={{ width: `${s.score}%` }} />
              </div>
              <div className="flex gap-3 mt-1 text-[8px] text-slate-500 uppercase tracking-widest">
                <span>U:{s.u || 0}</span>
                <span>C:{s.c || 0}</span>
                <span>S:{s.s || 0}</span>
                <span>I:{s.i || 0}</span>
              </div>
            </div>
          );
        })}
      </div>
      {source && <div className="text-[9px] text-slate-600 mt-2">Source: {source}</div>}
    </div>
  );
}
