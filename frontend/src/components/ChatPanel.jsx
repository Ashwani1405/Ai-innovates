import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';

export default function ChatPanel() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', text: 'GraphRAG Intelligence ready. Ask a strategic geopolitical question.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'system', text: data.answer || 'No valid response generated.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', text: 'Error connecting to GraphRAG backend endpoints.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px] border border-slate-800 bg-[#060b18] overflow-hidden">
      <div className="p-3 bg-[#020617] border-b border-slate-800 flex items-center gap-2">
        <Bot className="w-4 h-4 text-emerald-500" />
        <h3 className="text-[11px] font-semibold text-slate-200 tracking-[0.15em] uppercase">GraphRAG Terminal</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'system' && <Bot className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />}
             <div className={`p-2.5 max-w-[85%] text-[10px] leading-relaxed whitespace-pre-wrap ${
               msg.role === 'user' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-transparent text-slate-300 border-l border-emerald-500/50'
             }`}>
                {msg.text}
             </div>
             {msg.role === 'user' && <User className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />}
          </div>
        ))}
        {loading && (
           <div className="flex gap-3 justify-start">
             <Bot className="w-4 h-4 text-emerald-500 mt-1 animate-pulse" />
             <div className="p-2.5 border-l border-emerald-500/50 text-slate-500 text-[10px] flex items-center gap-2 uppercase tracking-widest">
                <Loader2 className="w-3 h-3 animate-spin" /> [PROCESSING INTEL...]
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-2 bg-[#020617] border-t border-slate-800 flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="> Enter analysis query..."
          className="flex-1 bg-[#060b18] text-emerald-400 px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-800 transition-colors placeholder:text-slate-700 text-[10px] tracking-[0.1em]"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="bg-slate-800 hover:bg-slate-700 text-emerald-500 p-2 flex items-center justify-center transition-colors disabled:opacity-50 w-10 h-10 border border-slate-700 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
