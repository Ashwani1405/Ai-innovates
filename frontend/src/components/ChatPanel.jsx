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
    <div className="flex flex-col h-[500px] border border-slate-700 bg-slate-800 rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center gap-2 shadow-sm">
        <Bot className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-200">GraphRAG Agent</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'system' && <Bot className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />}
             <div className={`p-3 rounded-lg max-w-[85%] text-sm shadow-md whitespace-pre-wrap ${
               msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200 border border-slate-600'
             }`}>
                {msg.text}
             </div>
             {msg.role === 'user' && <User className="w-6 h-6 text-indigo-300 mt-1 flex-shrink-0" />}
          </div>
        ))}
        {loading && (
           <div className="flex gap-3 justify-start">
             <Bot className="w-6 h-6 text-indigo-400 mt-1" />
             <div className="p-3 rounded-lg bg-slate-700/50 text-slate-400 text-sm flex items-center gap-2 border border-slate-600 border-dashed">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyst reasoning...
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Analyze India's border strategy..."
          className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-slate-700 placeholder:text-slate-500 text-sm"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 flex items-center justify-center rounded transition-colors disabled:opacity-50 w-10 h-10"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
