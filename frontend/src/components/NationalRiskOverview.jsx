import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { API_BASE } from '../config';

const RISK_LEVELS = [
  { max: 30, label: 'LOW', color: '#22c55e' },
  { max: 50, label: 'GUARDED', color: '#3b82f6' },
  { max: 70, label: 'ELEVATED', color: '#f59e0b' },
  { max: 85, label: 'HIGH', color: '#f97316' },
  { max: 100, label: 'CRITICAL', color: '#ef4444' },
];

function getRiskMeta(score) {
  return RISK_LEVELS.find(r => score <= r.max) || RISK_LEVELS[4];
}

export default function NationalRiskOverview() {
  const [score, setScore] = useState(0);
  const [trend, setTrend] = useState('stable');
  const [displayScore, setDisplayScore] = useState(0);
  const [source, setSource] = useState('loading...');

  useEffect(() => {
    fetch(`${API_BASE}/risk-score`)
      .then(res => res.json())
      .then(data => {
        setScore(data.score || 45);
        setTrend(data.trend || 'stable');
        setSource(data.source || 'computed');
      })
      .catch(() => { setScore(45); setTrend('stable'); setSource('offline'); });
  }, []);

  useEffect(() => {
    if (displayScore < score) {
      const timer = setTimeout(() => setDisplayScore(prev => Math.min(prev + 1, score)), 20);
      return () => clearTimeout(timer);
    }
  }, [displayScore, score]);

  const meta = getRiskMeta(displayScore);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displayScore / 100) * circumference;

  const TrendIcon = trend === 'escalating' ? TrendingUp : trend === 'de-escalating' ? TrendingDown : Minus;
  const trendColor = trend === 'escalating' ? 'text-red-400' : trend === 'de-escalating' ? 'text-green-400' : 'text-slate-400';

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Strategic Risk Overview</h3>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">LIVE</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="130" height="130" className="transform -rotate-90">
            <circle cx="65" cy="65" r="54" stroke="#1e293b" strokeWidth="10" fill="none" />
            <circle cx="65" cy="65" r="54" stroke={meta.color} strokeWidth="10" fill="none"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 6px ${meta.color}40)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{displayScore}</span>
            <span className="text-[10px] font-bold tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Trend</div>
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold capitalize">{trend}</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-1">Source: {source}</div>
        </div>
      </div>
    </div>
  );
}
