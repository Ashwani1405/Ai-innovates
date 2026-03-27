import React, { useEffect, useState } from 'react';
import { Activity, Globe, ExternalLink } from 'lucide-react';
import { API_BASE } from '../config';

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/events`)
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
    <div className="border border-slate-800 bg-[#060b18] p-3 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <h3 className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.15em]">Intel Feed</h3>
        </div>
        <span className="text-[9px] text-slate-500 tracking-widest">{events.length} EVENTS</span>
      </div>
      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
        {loading && <p className="text-slate-500 text-[10px] uppercase tracking-widest animate-pulse text-center py-4">[ FETCHING LIVE STREAMS... ]</p>}
        {events.map((ev, idx) => (
          <div key={idx} className="p-2 border border-slate-800/50 bg-black/40 border-l-2 border-l-emerald-500 hover:bg-slate-900 transition-colors cursor-default group">
            <h4 className="text-[10px] text-slate-300 leading-snug line-clamp-2 uppercase tracking-wide">{ev.title}</h4>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-500 uppercase">
              <span className="flex items-center gap-1.5 text-emerald-500/80">
                <Globe className="w-3 h-3" /> {ev.domain || ev.source}
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
