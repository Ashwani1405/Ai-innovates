import { useState, useEffect } from 'react'
import { BrainCircuit, Activity, Database, Zap } from 'lucide-react'
import GraphExplorer from './components/GraphExplorer'
import ChatPanel from './components/ChatPanel'
import EventFeed from './components/EventFeed'
import GeoMap from './components/GeoMap'

function App() {
  const [graphData, setGraphData] = useState({ elements: [] });
  const [graphLoading, setGraphLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/graph')
      .then(res => res.json())
      .then(data => { setGraphData(data); setGraphLoading(false); })
      .catch(err => { console.error("Graph fetch error:", err); setGraphLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 flex justify-between items-center shadow-lg backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight leading-none">
              Global Ontology Engine
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wider uppercase">Strategic Intelligence Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full text-slate-400 border border-slate-700">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Neo4j</span>
            <span className="text-slate-600">|</span>
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-medium">Groq LLaMA</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full text-emerald-400 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Geopolitics Core
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1700px] mx-auto w-full">
        {/* Left: Chat + Events */}
        <div className="lg:col-span-3 flex flex-col gap-4 max-h-[calc(100vh-4.5rem)] overflow-hidden">
          <ChatPanel />
          <EventFeed />
        </div>

        {/* Center: Graph + Map */}
        <div className="lg:col-span-9 flex flex-col gap-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto pr-1">
          {graphLoading ? (
            <div className="h-[500px] flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700">
              <div className="text-center">
                <Activity className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading Knowledge Graph...</p>
              </div>
            </div>
          ) : (
            <GraphExplorer data={graphData} />
          )}

          <GeoMap />

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 flex items-center gap-3">
            <Activity className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              GOE ingests real-time global events via GDELT, extracts entities (LLM-NER), maps relations to the Neo4j Knowledge Graph, 
              and uses GraphRAG with Groq LLaMA for strategic intelligence synthesis.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
