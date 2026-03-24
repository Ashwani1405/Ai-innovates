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
              'background-color': (ele) => typeColors[ele.data('type')] || '#6366f1',
              'color': '#f1f5f9',
              'font-size': '11px',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'width': 50,
              'height': 50,
              'border-width': 2,
              'border-color': '#334155',
              'text-margin-y': 8,
              'text-outline-width': 2,
              'text-outline-color': '#0f172a',
            }
          },
          {
            selector: 'edge',
            style: {
              'label': 'data(label)',
              'width': 1.5,
              'line-color': '#475569',
              'target-arrow-color': '#64748b',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'color': '#94a3b8',
              'font-size': '9px',
              'text-rotation': 'autorotate',
              'text-background-opacity': 1,
              'text-background-color': '#0f172a',
              'text-background-padding': '3px',
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
    <div className="w-full h-[500px] border border-slate-700 rounded-xl overflow-hidden relative shadow-xl bg-slate-900">
      <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur p-3 rounded-lg border border-slate-700 shadow-lg">
        <h3 className="font-bold text-white text-sm">Knowledge Graph</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">{nodeCount} entities · {edgeCount} relations</p>
      </div>
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {Object.entries({GPE:'#3b82f6',PERSON:'#f59e0b',ORG:'#10b981',LOC:'#ef4444'}).map(([k,v])=>(
          <span key={k} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950/70 text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor:v}}></span>{k}
          </span>
        ))}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }} />
    </div>
  );
}
