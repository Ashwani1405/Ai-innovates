import React, { useState } from 'react';
import { Tv, X, Radio } from 'lucide-react';

const CHANNELS = [
  { id: 'aljazeera', name: 'AL JAZEERA', url: 'https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1&mute=1' },
  { id: 'aajtak', name: 'AAJ TAK', url: 'https://www.youtube.com/embed/iKhJhD6J9hQ?autoplay=1&mute=1' },
  { id: 'france24', name: 'FRANCE 24', url: 'https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg&autoplay=1&mute=1' },
  { id: 'dwnews', name: 'DW NEWS', url: 'https://www.youtube.com/embed/LuKwFajn37U?autoplay=1&mute=1' },
  { id: 'news18', name: 'CNN-NEWS18', url: 'https://www.youtube.com/embed/hdFeBWmyyIs?autoplay=1&mute=1' }
];

export default function TvPanel({ isOpen, onClose }) {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-bold tracking-widest text-sm">GLOBAL INTEL FEED</span>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/30 ml-2 animate-pulse">LIVE INCIDENT RESPONSE</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="w-full bg-black aspect-video relative">
          <iframe 
            src={activeChannel.url}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Channel Selector */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold tracking-wider rounded-lg border transition-all ${
                activeChannel.id === channel.id 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeChannel.id === channel.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>}
                {channel.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
