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
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cable className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Infrastructure Cascade</h3>
        </div>
        <span className="text-[10px] text-slate-500">440</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {INFRA.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <item.icon className={`w-3 h-3 ${item.color}`} />
            <span className="text-[10px] text-slate-300 font-medium">{item.count}</span>
          </div>
        ))}
        <span className="text-[10px] text-slate-500">1453 links</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
        <div className="text-[10px] text-slate-500 mb-1.5">Active Threats in {activeTab}</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Mumbai-Chennai submarine link</span>
            <span className="text-amber-400 text-[10px]">MONITORING</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Andaman-Nicobar trunk</span>
            <span className="text-green-400 text-[10px]">SECURE</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Gujarat LNG pipeline</span>
            <span className="text-red-400 text-[10px]">ALERT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
