import React, { useEffect, useState, useRef } from 'react';

export default function GraphExplorer({ data }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!data || !data.elements || data.elements.length === 0) return;
    if (!containerRef.current) return;

    // Dynamically import cytoscape (avoids SSR issues)
    import('cytoscape').then((cytoscapeModule) => {
      const cytoscape = cytoscapeModule.default;
      
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const typeColors = {
        'GPE': '#3b82f6',
        'PERSON': '#f59e0b',
        'ORG': '#10b981',
        'LOC': '#ef4444',
        'ENTITY': '#8b5cf6',
      };

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: data.elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': '#0f172a',
              'color': '#cbd5e1',
              'font-size': '8px',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'width': 24,
              'height': 24,
              'shape': 'square',
              'border-width': 1.5,
              'border-color': (ele) => typeColors[ele.data('type')] || '#6366f1',
              'border-style': 'solid',
              'text-margin-y': 4,
              'text-outline-width': 2,
              'text-outline-color': '#020617',
              'text-transform': 'uppercase',
            }
          },
          {
            selector: 'edge',
            style: {
              'label': 'data(label)',
              'width': 1,
              'line-color': '#334155',
              'target-arrow-color': '#475569',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'color': '#64748b',
              'font-size': '7px',
              'text-rotation': 'autorotate',
              'text-background-opacity': 1,
              'text-background-color': '#020617',
              'text-background-padding': '2px',
              'text-transform': 'uppercase',
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#facc15',
              'border-width': 4,
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          animationDuration: 800,
          nodeRepulsion: 8000,
          idealEdgeLength: 120,
        }
      });
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [data]);

  const nodeCount = data?.elements?.filter(e => e.data && !e.data.source)?.length || 0;
  const edgeCount = data?.elements?.filter(e => e.data && e.data.source)?.length || 0;

  return (
    <div className="w-full h-[500px] border border-slate-800 bg-[#060b18] overflow-hidden relative">
      <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur p-2 border border-slate-800">
        <h3 className="font-bold text-slate-300 text-[10px] uppercase tracking-widest">KNOWLEDGE GRAPH</h3>
        <p className="text-[9px] text-slate-500 tracking-widest mt-0.5">{nodeCount} NODES / {edgeCount} EDGES</p>
      </div>
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 border border-slate-800 bg-black/80 px-2 py-1">
        {Object.entries({GPE:'#3b82f6',PERSON:'#f59e0b',ORG:'#10b981',LOC:'#ef4444'}).map(([k,v])=>(
          <span key={k} className="text-[8px] text-slate-400 flex items-center gap-1 uppercase tracking-widest mr-1 last:mr-0">
            <span className="w-1.5 h-1.5 border" style={{borderColor:v}}></span>{k}
          </span>
        ))}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} />
    </div>
  );
}
