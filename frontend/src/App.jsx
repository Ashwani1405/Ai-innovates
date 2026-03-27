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
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-mono selection:bg-indigo-500/30">
      {/* Header */}
      <header className="px-4 py-2 bg-[#020617] border-b border-slate-800/80 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-indigo-500/60 bg-indigo-500/5 flex items-center justify-center">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-slate-100 tracking-[0.12em] uppercase leading-none">
              Bharat Intelligence Engine
            </h1>
            <p className="text-[9px] text-slate-500 tracking-[0.2em] mt-0.5">STRATEGIC INTELLIGENCE PLATFORM // INDIA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[9px] bg-[#060b18] px-3 py-1.5 text-slate-400 border border-slate-800 hidden md:flex tracking-[0.15em]">
            <Database className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">NEO4J</span>
            <span className="text-slate-700">/</span>
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-amber-500 font-semibold">LLAMA</span>
          </div>
          <button 
            onClick={() => setIsTvOpen(true)}
            className="flex items-center gap-1.5 text-[9px] tracking-[0.15em] font-semibold bg-[#060b18] hover:bg-slate-900 text-slate-200 px-3 py-1.5 border border-slate-700 transition-colors"
          >
            <Tv className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">LIVE INTEL</span>
          </button>
          <div className="flex items-center gap-1.5 text-[9px] tracking-[0.15em] bg-emerald-950/50 px-3 py-1.5 text-emerald-400 border border-emerald-900/60">
            <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
            ONLINE
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 max-w-[1920px] mx-auto w-full" style={{ height: 'calc(100vh - 44px)' }}>

        {/* ─── Left Column: Chat + Events + Risk ─── */}
        <div className="lg:col-span-3 md:col-span-1 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <NationalRiskOverview />
          <ChatPanel />
          <EventFeed />
        </div>

        {/* ─── Center Column: Map + Knowledge Graph ─── */}
        <div className="lg:col-span-5 md:col-span-1 flex flex-col gap-2 overflow-hidden" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <GeoMap />
          {graphLoading ? (
            <div className="h-[280px] flex items-center justify-center bg-[#060b18] border border-slate-800">
              <div className="text-center">
                <Activity className="w-5 h-5 text-slate-600 animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-slate-500 tracking-[0.15em] uppercase">Fetching Graph...</p>
              </div>
            </div>
          ) : (
            <GraphExplorer data={graphData} />
          )}
        </div>

        {/* ─── Right Column: Intelligence Panels (Scrollable) ─── */}
        <div className="lg:col-span-4 md:col-span-2 lg:col-start-9 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <BorderPosture />
          <StateVolatility />
          <EconomicWarfare />
          <DisasterMonitor />
          <InfrastructureCascade />

          <div className="bg-[#060b18] p-3 border border-slate-800 text-[9px] text-slate-500 flex items-start gap-2 tracking-[0.1em] leading-relaxed uppercase">
            <Activity className="w-3.5 h-3.5 text-slate-700 flex-shrink-0 mt-0.5" />
            <span>
              [SYS] Real-time GDELT + RSS ingestion active. Entity extraction running. Graph relations mapped. LLM synthesis standing by.
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
