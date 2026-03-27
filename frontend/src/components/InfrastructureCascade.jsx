import React from 'react';
import { Cable, TrainFront, Anchor, Wifi, Zap } from 'lucide-react';

const INFRA = [
  { icon: Zap, label: 'Power Grid', count: 86, color: 'text-yellow-400' },
  { icon: TrainFront, label: 'Railways', count: 88, color: 'text-blue-400' },
  { icon: Anchor, label: 'Ports', count: 62, color: 'text-cyan-400' },
  { icon: Wifi, label: 'Telecom', count: 13, color: 'text-purple-400' },
  { icon: Cable, label: 'Cables', count: 191, color: 'text-emerald-400' },
];

const TABS = ['Cables', 'Pipelines', 'Ports', 'Chokepoint'];

export default function InfrastructureCascade() {
  const [activeTab, setActiveTab] = React.useState('Cables');

  return (
    <div className="bg-[#060b18] border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Cable className="w-3.5 h-3.5 text-emerald-500" />
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Infrastructure Cascade</h3>
        </div>
        <span className="text-[9px] text-slate-500 tracking-widest">440 TARGETS</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap border-b border-slate-800/50 pb-2">
        {INFRA.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <item.icon className={`w-3 h-3 ${item.color}`} />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.count}</span>
          </div>
        ))}
        <span className="text-[9px] text-slate-500 tracking-widest">[ 1453 LINKS ]</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[9px] px-2.5 py-1 uppercase tracking-widest font-bold transition-colors border ${
              activeTab === tab
                ? 'bg-indigo-950/50 text-indigo-400 border-indigo-900/50'
                : 'bg-black text-slate-500 hover:text-slate-300 border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-950 p-2.5 border border-slate-800">
        <div className="text-[9px] text-slate-500 mb-2 uppercase tracking-widest border-b border-slate-800/50 pb-1">ACTIVE {activeTab} THREATS</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide">
            <span className="text-slate-300">MUMBAI-CHENNAI SUBMARINE LINK</span>
            <span className="text-amber-500 text-[9px] tracking-widest">[ MONITORING ]</span>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide">
            <span className="text-slate-300">ANDAMAN-NICOBAR TRUNK</span>
            <span className="text-emerald-500 text-[9px] tracking-widest">[ SECURE ]</span>
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide">
            <span className="text-slate-300">GUJARAT LNG PIPELINE</span>
            <span className="text-rose-500 text-[9px] tracking-widest animate-pulse">[ ALERT ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
