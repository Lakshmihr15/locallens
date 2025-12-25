
import React, { useState, useRef } from 'react';
import { PlaceInfo, Story } from '../types';
import { X, Star, MapPin, History, Volume2, MessageSquare, Send, Loader2, PlayCircle } from 'lucide-react';
import { getAudioGuide, decodeAudioData, askLandmarkExpert } from '../services/geminiService';

interface PlaceDetailOverlayProps {
  place: PlaceInfo;
  stories: Story[];
  onClose: () => void;
}

const PlaceDetailOverlay: React.FC<PlaceDetailOverlayProps> = ({ place, stories, onClose }) => {
  const [isNarrating, setIsNarrating] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startNarration = async () => {
    if (isNarrating) return;
    setIsNarrating(true);

    try {
      const audioData = await getAudioGuide(place.description);
      if (audioData) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioCtxRef.current;
        const buffer = await decodeAudioData(audioData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsNarrating(false);
        source.start();
      } else {
        setIsNarrating(false);
      }
    } catch (e) {
      setIsNarrating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isTyping) return;

    const userMsg = chatMessage;
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsTyping(true);

    const response = await askLandmarkExpert(userMsg, place.name);
    setChatLog(prev => [...prev, { role: 'ai', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-950 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[90vh] border border-white/10">
        {/* Animated HUD Header */}
        <div className="h-56 bg-gradient-to-br from-blue-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/10">
            <X size={24} />
          </button>
          
          <div className="absolute bottom-6 left-8 right-8">
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              {place.category}
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-2 tracking-tighter">
              {place.name}
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={startNarration}
                disabled={isNarrating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isNarrating ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/10 text-blue-400 border border-blue-400/30 hover:bg-blue-400/20'
                }`}
              >
                {isNarrating ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                {isNarrating ? 'NARRATING...' : 'START AUDIO TOUR'}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950">
          <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-black">{place.rating}</span>
            </div>
            <div className="text-zinc-500 text-xs">
              ACTIVE SENSOR LOCK: <span className="text-blue-400">40.7128° N</span>
            </div>
          </div>

          <p className="text-zinc-300 leading-relaxed mb-10 text-lg font-medium opacity-90">
            {place.description}
          </p>

          <div className="space-y-10">
            {/* Story Grid Section */}
            <section>
              <h2 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <History size={14} />
                Historical Data Nodes
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {stories.map(story => (
                  <div key={story.id} className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
                    <h3 className="text-blue-300 font-bold text-sm mb-2 group-hover:text-blue-200">{story.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{story.content}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Conversation Interface */}
            <section className="bg-blue-600/5 rounded-[2rem] border border-blue-600/20 p-6">
              <h2 className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <MessageSquare size={14} />
                Direct Inquiry
              </h2>
              
              <div className="space-y-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
                {chatLog.length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-4">Ask about hidden facts or specific details.</p>
                )}
                {chatLog.map((log, i) => (
                  <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      log.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-300 border border-white/10'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-blue-400 text-[10px] animate-pulse">Analysing database...</div>}
              </div>

              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
                <button type="submit" className="absolute right-2 top-1.5 p-1.5 text-blue-500 hover:text-blue-400 transition-colors">
                  <Send size={18} />
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default PlaceDetailOverlay;
