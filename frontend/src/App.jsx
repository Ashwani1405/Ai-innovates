import { useState, useEffect } from 'react'
import { BrainCircuit, Activity, Database, Zap, Tv } from 'lucide-react'
import { API_BASE } from './config'
import GraphExplorer from './components/GraphExplorer'
import ChatPanel from './components/ChatPanel'
import TvPanel from './components/TvPanel'
import EventFeed from './components/EventFeed'
import GeoMap from './components/GeoMap'
import NationalRiskOverview from './components/NationalRiskOverview'
import BorderPosture from './components/BorderPosture'
import StateVolatility from './components/StateVolatility'
import InfrastructureCascade from './components/InfrastructureCascade'
import EconomicWarfare from './components/EconomicWarfare'
import DisasterMonitor from './components/DisasterMonitor'

function App() {
  const [graphData, setGraphData] = useState({ elements: [] });
  const [graphLoading, setGraphLoading] = useState(true);
  const [isTvOpen, setIsTvOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/graph`)
      .then(res => res.json())
      .then(data => { setGraphData(data); setGraphLoading(false); })
      .catch(err => { console.error("Graph fetch error:", err); setGraphLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="px-6 py-2.5 bg-slate-900/95 border-b border-slate-800 flex justify-between items-center shadow-lg backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight leading-none">
              Bharat Intelligence Engine
            </h1>
            <p className="text-[9px] text-slate-500 tracking-wider uppercase">Strategic Intelligence Platform — India</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] bg-slate-800/80 px-3 py-1.5 rounded-full text-slate-400 border border-slate-700 hidden sm:flex">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Neo4j</span>
            <span className="text-slate-600">|</span>
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-medium">Groq LLaMA</span>
          </div>
          <button 
            onClick={() => setIsTvOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors shadow-lg"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">LIVE TV</span>
          </button>
          <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 px-3 py-1.5 rounded-full text-emerald-400 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            India Monitor
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1920px] mx-auto w-full" style={{ height: 'calc(100vh - 48px)' }}>

        {/* ─── Left Column: Chat + Events + Risk ─── */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 72px)' }}>
          <NationalRiskOverview />
          <ChatPanel />
          <EventFeed />
        </div>

        {/* ─── Center Column: Map + Knowledge Graph ─── */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-hidden" style={{ maxHeight: 'calc(100vh - 72px)' }}>
          <GeoMap />
          {graphLoading ? (
            <div className="h-[280px] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700">
              <div className="text-center">
                <Activity className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading Knowledge Graph...</p>
              </div>
            </div>
          ) : (
            <GraphExplorer data={graphData} />
          )}
        </div>

        {/* ─── Right Column: Intelligence Panels (Scrollable) ─── */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 72px)' }}>
          <BorderPosture />
          <StateVolatility />
          <EconomicWarfare />
          <DisasterMonitor />
          <InfrastructureCascade />

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span>
              BIE ingests real-time events via GDELT + Indian RSS, extracts entities (LLM-NER), maps relations to Neo4j,
              and uses GraphRAG with Groq LLaMA for strategic intelligence synthesis.
            </span>
          </div>
        </div>
      </main>

      {/* Global TV Overlay */}
      <TvPanel isOpen={isTvOpen} onClose={() => setIsTvOpen(false)} />
    </div>
  )
}

export default App
