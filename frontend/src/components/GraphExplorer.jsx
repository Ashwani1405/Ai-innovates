import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Crosshair, X, Network, GitBranch, Circle } from 'lucide-react';

const TYPE_COLORS = {
  'GPE': '#3b82f6',
  'PERSON': '#f59e0b',
  'ORG': '#10b981',
  'LOC': '#ef4444',
  'ENTITY': '#8b5cf6',
};

const LAYOUTS = [
  { id: 'cose', label: 'Force', icon: Network },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'breadthfirst', label: 'Tree', icon: GitBranch },
];

export default function GraphExplorer({ data }) {
  const containerRef = useRef(null);
  const fullContainerRef = useRef(null);
  const cyRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeLayout, setActiveLayout] = useState('cose');
  const [hoveredType, setHoveredType] = useState(null);

  const nodeCount = data?.elements?.filter(e => e.data && !e.data.source)?.length || 0;
  const edgeCount = data?.elements?.filter(e => e.data && e.data.source)?.length || 0;

  const initCytoscape = useCallback((container) => {
    if (!data || !data.elements || data.elements.length === 0) return;
    if (!container) return;

    import('cytoscape').then((cytoscapeModule) => {
      const cytoscape = cytoscapeModule.default;
      
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: container,
        elements: data.elements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': '#060b18',
              'color': '#94a3b8',
              'font-family': "'JetBrains Mono', monospace",
              'font-size': expanded ? '10px' : '8px',
              'font-weight': 500,
              'text-valign': 'bottom',
              'text-halign': 'center',
              'width': expanded ? 32 : 22,
              'height': expanded ? 32 : 22,
              'shape': 'roundrectangle',
              'border-width': 2,
              'border-color': (ele) => TYPE_COLORS[ele.data('type')] || '#6366f1',
              'border-opacity': 0.8,
              'text-margin-y': 6,
              'text-outline-width': 2,
              'text-outline-color': '#020617',
              'text-transform': 'uppercase',
              'overlay-opacity': 0,
              'transition-property': 'border-width, border-opacity, width, height',
              'transition-duration': '0.15s',
            }
          },
          {
            selector: 'node:active, node:selected',
            style: {
              'border-color': '#facc15',
              'border-width': 3,
              'border-opacity': 1,
              'color': '#f1f5f9',
              'font-weight': 700,
            }
          },
          {
            selector: 'node.hover',
            style: {
              'border-width': 3,
              'border-opacity': 1,
              'color': '#e2e8f0',
              'width': expanded ? 38 : 28,
              'height': expanded ? 38 : 28,
            }
          },
          {
            selector: 'node.dimmed',
            style: {
              'opacity': 0.15,
            }
          },
          {
            selector: 'edge',
            style: {
              'label': 'data(label)',
              'width': 1,
              'line-color': '#1e293b',
              'line-style': 'solid',
              'target-arrow-color': '#334155',
              'target-arrow-shape': 'triangle',
              'arrow-scale': 0.8,
              'curve-style': 'bezier',
              'color': '#475569',
              'font-family': "'JetBrains Mono', monospace",
              'font-size': expanded ? '8px' : '6px',
              'text-rotation': 'autorotate',
              'text-background-opacity': 1,
              'text-background-color': '#020617',
              'text-background-padding': '2px',
              'text-transform': 'uppercase',
              'transition-property': 'opacity, line-color',
              'transition-duration': '0.15s',
            }
          },
          {
            selector: 'edge.dimmed',
            style: {
              'opacity': 0.08,
            }
          },
          {
            selector: 'edge.highlighted',
            style: {
              'line-color': '#475569',
              'target-arrow-color': '#64748b',
              'width': 2,
            }
          },
        ],
        layout: {
          name: activeLayout,
          animate: true,
          animationDuration: 600,
          nodeRepulsion: expanded ? 12000 : 8000,
          idealEdgeLength: expanded ? 160 : 100,
          padding: expanded ? 40 : 20,
        },
        minZoom: 0.3,
        maxZoom: 4,
        wheelSensitivity: 0.3,
      });

      // Node interaction
      cyRef.current.on('tap', 'node', (e) => {
        const node = e.target;
        setSelectedNode({
          id: node.id(),
          label: node.data('label'),
          type: node.data('type'),
          connections: node.connectedEdges().length,
          neighbors: node.neighborhood('node').map(n => ({
            label: n.data('label'),
            type: n.data('type'),
          })),
        });
      });

      cyRef.current.on('tap', (e) => {
        if (e.target === cyRef.current) setSelectedNode(null);
      });

      // Hover highlighting
      cyRef.current.on('mouseover', 'node', (e) => {
        const node = e.target;
        node.addClass('hover');
        const connected = node.connectedEdges().connectedNodes();
        cyRef.current.elements().not(connected).not(node).addClass('dimmed');
        node.connectedEdges().addClass('highlighted');
      });

      cyRef.current.on('mouseout', 'node', (e) => {
        e.target.removeClass('hover');
        cyRef.current.elements().removeClass('dimmed highlighted');
      });
    });
  }, [data, expanded, activeLayout]);

  useEffect(() => {
    const container = expanded ? fullContainerRef.current : containerRef.current;
    initCytoscape(container);
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [data, expanded, activeLayout, initCytoscape]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: activeLayout,
        animate: true,
        animationDuration: 600,
        nodeRepulsion: expanded ? 12000 : 8000,
        idealEdgeLength: expanded ? 160 : 100,
      }).run();
    }
  };

  const handleFilterType = (type) => {
    if (!cyRef.current) return;
    if (hoveredType === type) {
      cyRef.current.elements().removeClass('dimmed');
      setHoveredType(null);
    } else {
      cyRef.current.elements().addClass('dimmed');
      cyRef.current.nodes(`[type = "${type}"]`).removeClass('dimmed');
      cyRef.current.nodes(`[type = "${type}"]`).connectedEdges().removeClass('dimmed');
      setHoveredType(type);
    }
  };

  // ── Control Bar Component ──
  const ControlBar = ({ position = 'bottom' }) => (
    <div className={`absolute ${position === 'bottom' ? 'bottom-3 left-1/2 -translate-x-1/2' : 'top-3 right-3'} z-20 flex items-center gap-1 bg-[#020617]/90 backdrop-blur border border-slate-800 p-1`}>
      {LAYOUTS.map(l => (
        <button key={l.id} onClick={() => setActiveLayout(l.id)}
          className={`flex items-center gap-1 px-2 py-1 text-[9px] tracking-[0.1em] uppercase transition-colors border ${
            activeLayout === l.id ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
          }`}>
          <l.icon className="w-3 h-3" /> {l.label}
        </button>
      ))}
      <div className="w-px h-5 bg-slate-800 mx-1" />
      <button onClick={handleZoomIn} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
      <button onClick={handleZoomOut} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
      <button onClick={handleFit} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors" title="Fit"><Crosshair className="w-3.5 h-3.5" /></button>
      <button onClick={handleReset} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>
    </div>
  );

  // ── Legend Component ──
  const Legend = () => (
    <div className="flex gap-2">
      {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'ENTITY').map(([k, v]) => (
        <button key={k} onClick={() => handleFilterType(k)}
          className={`text-[8px] flex items-center gap-1 tracking-[0.12em] uppercase cursor-pointer transition-all ${
            hoveredType && hoveredType !== k ? 'opacity-30' : 'opacity-100'
          }`}>
          <span className="w-2 h-2 border" style={{ borderColor: v, backgroundColor: hoveredType === k ? v + '30' : 'transparent' }} />
          <span className="text-slate-400">{k}</span>
        </button>
      ))}
    </div>
  );

  // ── Node Detail Panel ──
  const NodeDetail = () => {
    if (!selectedNode) return null;
    const color = TYPE_COLORS[selectedNode.type] || '#6366f1';
    return (
      <div className="absolute bottom-3 left-3 z-20 w-64 bg-[#020617]/95 backdrop-blur border border-slate-800 font-mono">
        <div className="flex items-center justify-between p-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 border-2" style={{ borderColor: color }} />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-[0.1em]">{selectedNode.label}</span>
          </div>
          <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-2 space-y-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-500 tracking-[0.15em]">TYPE</span>
            <span className="text-slate-300 uppercase" style={{ color }}>{selectedNode.type}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-500 tracking-[0.15em]">EDGES</span>
            <span className="text-slate-300">{selectedNode.connections}</span>
          </div>
          {selectedNode.neighbors.length > 0 && (
            <div>
              <div className="text-[8px] text-slate-500 tracking-[0.15em] mb-1.5 pt-1 border-t border-slate-800">CONNECTED ENTITIES</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedNode.neighbors.map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-1.5 h-1.5 border" style={{ borderColor: TYPE_COLORS[n.type] || '#6366f1' }} />
                    <span className="text-slate-400 uppercase tracking-wide">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Fullscreen Modal ──
  if (expanded) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#060b18]">
          <div className="flex items-center gap-3">
            <Network className="w-4 h-4 text-indigo-400" />
            <h2 className="text-[12px] font-bold text-slate-200 tracking-[0.15em] uppercase">Knowledge Graph Explorer</h2>
            <span className="text-[9px] text-slate-500 tracking-[0.12em] border border-slate-800 px-2 py-0.5">{nodeCount} NODES / {edgeCount} EDGES</span>
          </div>
          <div className="flex items-center gap-2">
            <Legend />
            <div className="w-px h-5 bg-slate-800 mx-2" />
            <button onClick={() => { setExpanded(false); setSelectedNode(null); }}
              className="flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-white px-2 py-1 border border-slate-700 hover:border-slate-600 transition-colors tracking-[0.1em]">
              <Minimize2 className="w-3.5 h-3.5" /> COLLAPSE
            </button>
          </div>
        </div>
        {/* Graph Canvas */}
        <div className="flex-1 relative">
          <div ref={fullContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} />
          <NodeDetail />
          <ControlBar position="bottom" />
        </div>
      </div>
    );
  }

  // ── Inline (Collapsed) View ──
  return (
    <div className="w-full h-[320px] border border-slate-800 bg-[#060b18] overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-2.5 left-2.5 z-10 bg-[#020617]/90 backdrop-blur p-2 border border-slate-800">
        <div className="flex items-center gap-2">
          <Network className="w-3 h-3 text-indigo-400" />
          <h3 className="font-semibold text-slate-200 text-[10px] uppercase tracking-[0.15em]">Knowledge Graph</h3>
        </div>
        <p className="text-[8px] text-slate-500 tracking-[0.12em] mt-0.5">{nodeCount} NODES / {edgeCount} EDGES</p>
      </div>

      {/* Legend + Expand */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
        <div className="bg-[#020617]/90 backdrop-blur border border-slate-800 px-2 py-1 flex items-center gap-2">
          <Legend />
        </div>
        <button onClick={() => setExpanded(true)}
          className="bg-[#020617]/90 backdrop-blur border border-slate-700 hover:border-indigo-500/50 p-1.5 transition-colors group" title="Expand Graph">
          <Maximize2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* Graph Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} />
      <NodeDetail />
    </div>
  );
}
