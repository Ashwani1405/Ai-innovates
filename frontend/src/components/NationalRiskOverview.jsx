import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { API_BASE } from '../config';

const RISK_LEVELS = [
  { max: 30, label: 'LOW', color: '#10b981' },
  { max: 50, label: 'GUARDED', color: '#3b82f6' },
  { max: 70, label: 'ELEVATED', color: '#eab308' },
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
    <div className="bg-[#060b18] border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.15em]">Threat Assessment</h3>
        </div>
        <span className="text-[9px] bg-red-950/40 text-red-400 px-2 py-0.5 border border-red-900/40 animate-pulse tracking-[0.15em]">LIVE</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="90" height="90" className="transform -rotate-90">
            <circle cx="45" cy="45" r="38" stroke="#0f172a" strokeWidth="5" fill="none" />
            <circle cx="45" cy="45" r="38" stroke={meta.color} strokeWidth="5" fill="none"
              strokeDasharray={239} strokeDashoffset={239 - (displayScore / 100) * 239} strokeLinecap="square"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-slate-100">{displayScore}</span>
            <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: meta.color }}>{meta.label}</span>
          </div>
        </div>
          <div className="flex flex-col gap-3">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] mb-1">Vector Trend</div>
            <div className={`flex items-center gap-1.5 ${trendColor} border border-slate-800 bg-[#020617] px-2 py-1`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{trend}</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-600 uppercase tracking-wider">SRC // {source}</div>
        </div>
      </div>
    </div>
  );
}
