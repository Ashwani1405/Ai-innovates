import React, { useEffect, useState } from 'react';
import { Activity, Globe, ExternalLink } from 'lucide-react';

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback mock data
        setEvents([
          { title: 'India-China trade talks resume in Delhi', domain: 'reuters.com', pub_date: '2025', source: 'GDELT' },
          { title: 'NATO summit discusses Pacific strategy', domain: 'bbc.com', pub_date: '2025', source: 'GDELT' },
          { title: 'BRICS expansion talks accelerate', domain: 'aljazeera.com', pub_date: '2025', source: 'GDELT' },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="border border-slate-700 bg-slate-900 rounded-xl p-4 shadow-lg flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <h3 className="font-bold text-sm text-slate-200">Live Intel Feed</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">{events.length} events</span>
      </div>
      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {loading && <p className="text-slate-500 text-sm animate-pulse text-center py-4">Loading live data...</p>}
        {events.map((ev, idx) => (
          <div key={idx} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 border-l-2 border-l-emerald-500/70 transition-all cursor-default group">
            <h4 className="text-xs font-medium text-slate-200 leading-snug line-clamp-2">{ev.title}</h4>
            <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-500/80">
                <Globe className="w-2.5 h-2.5" /> {ev.domain || ev.source}
              </span>
              {ev.url && (
                <a href={ev.url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
