
import React, { useEffect, useState } from 'react';
import { X, Navigation, Info, Zap, Loader2 } from 'lucide-react';
import { MapNode } from '../types';

interface SpatialMapProps {
  onClose: () => void;
}

const SpatialMap: React.FC<SpatialMapProps> = ({ onClose }) => {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated discovery logic - in a real app, this would call a Places API
    const mockNodes: MapNode[] = [
      { id: '1', name: 'Grand Central', distance: '120m', bearing: 45, category: 'Transport' },
      { id: '2', name: 'Chrysler Building', distance: '340m', bearing: 120, category: 'Landmark' },
      { id: '3', name: 'Bryant Park', distance: '450m', bearing: 210, category: 'Park' },
      { id: '4', name: 'Public Library', distance: '520m', bearing: 280, category: 'Culture' },
    ];

    const timer = setTimeout(() => {
      setNodes(mockNodes);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Radar Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] border border-blue-500/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] border border-blue-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] border border-blue-500/10 rounded-full" />
      </div>

      <div className="relative w-full max-w-2xl h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
            <div>
                <h2 className="text-white font-black text-3xl tracking-tighter uppercase italic">Spatial Recon</h2>
                <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black tracking-widest uppercase">
                    <Navigation size={12} className="animate-pulse" />
                    Nearby Data Nodes Detected
                </div>
            </div>
            <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10">
                <X size={24} />
            </button>
        </div>

        {/* Map Grid */}
        <div className="flex-1 relative flex items-center justify-center">
            {/* Center User Marker */}
            <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.6)] animate-pulse">
                    <Zap size={24} className="text-white fill-white" />
                </div>
                <div className="absolute -inset-8 border border-blue-500/30 rounded-full animate-ping opacity-20" />
            </div>

            {/* Radar Nodes */}
            {!loading && nodes.map((node, i) => {
                const radius = 100 + (parseInt(node.distance) / 10); // scale distance for UI
                const x = Math.cos((node.bearing * Math.PI) / 180) * radius;
                const y = Math.sin((node.bearing * Math.PI) / 180) * radius;

                return (
                    <div 
                        key={node.id}
                        className="absolute group cursor-pointer transition-all hover:scale-110"
                        style={{ transform: `translate(${x}px, ${y}px)`, animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)] border-2 border-white/20 group-hover:bg-white" />
                            <div className="absolute top-6 whitespace-nowrap bg-black/80 border border-white/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 shadow-2xl">
                                <p className="text-white font-black text-[10px] uppercase tracking-tighter">{node.name}</p>
                                <p className="text-blue-400 text-[8px] font-bold">{node.distance} // {node.category}</p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {loading && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-blue-500 animate-spin" />
                    <span className="text-blue-500/60 font-black text-xs tracking-widest uppercase animate-pulse">Scanning Local Grid...</span>
                </div>
            )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {nodes.map(node => (
                <div key={node.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-blue-500/30 transition-colors">
                    <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">{node.category}</p>
                    <p className="text-white font-bold text-xs truncate">{node.name}</p>
                    <p className="text-blue-500 font-black text-[10px] mt-1">{node.distance}</p>
                </div>
            ))}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default SpatialMap;
