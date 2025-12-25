
import React, { useState, useEffect, useRef } from 'react';
import CameraView, { CameraViewHandle } from './components/CameraView';
import StoryCard from './components/StoryCard';
import PlaceDetailOverlay from './components/PlaceDetailOverlay';
import SpatialMap from './components/SpatialMap';
import { AppState, PlaceInfo, Story } from './types';
import { recognizePlace } from './services/geminiService';
import { Target, Home, Zap, Map as MapIcon, Camera as CameraIcon, Search, Loader2, ShieldCheck, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INITIALIZING);
  const [isBooting, setIsBooting] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [detectedPlace, setDetectedPlace] = useState<PlaceInfo | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [noMatchReason, setNoMatchReason] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraViewHandle>(null);
  const lastCaptureTime = useRef<number>(0);

  // Core recognition loop
  useEffect(() => {
    if (appState !== AppState.SCANNING) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - lastCaptureTime.current < 6000 || isAiProcessing) return;

      const frame = cameraRef.current?.captureFrame();
      if (!frame) return;

      setIsAiProcessing(true);
      setNoMatchReason(null);
      try {
        const result = await recognizePlace(frame);
        if (result.place) {
          setDetectedPlace(result.place);
          setStories(result.stories);
        } else {
          // If a place was previously found but current scan fails/low confidence, 
          // we keep the old one for 10 seconds before clearing
          if (result.reasoning) setNoMatchReason(result.reasoning);
        }
      } catch (err) {
        console.error("Recognition cycle failed", err);
      } finally {
        setIsAiProcessing(false);
        lastCaptureTime.current = Date.now();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [appState, isAiProcessing]);

  const startLens = () => {
    setIsBooting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setBootProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setAppState(AppState.SCANNING);
        setIsBooting(false);
      }
    }, 40);
  };

  const toggleMap = () => {
    setAppState(prev => prev === AppState.MAP_VIEW ? AppState.SCANNING : AppState.MAP_VIEW);
  };

  const handleStorySelect = (story: Story) => {
    setShowDetail(true);
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none font-sans">
      <CameraView 
        ref={cameraRef} 
        isActive={appState === AppState.SCANNING || appState === AppState.MAP_VIEW} 
      />

      {/* 2. System Boot Screen */}
      {appState === AppState.INITIALIZING && (
        <div className="absolute inset-0 z-[60] bg-zinc-950 flex flex-col items-center justify-center p-10">
          <div className="relative mb-12">
            <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.1)]">
              <Target size={48} className={`text-blue-500 ${isBooting ? 'animate-spin' : 'animate-pulse'}`} strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">LocalLens</h1>
            <div className="flex items-center justify-center gap-2 text-blue-500/60 text-[10px] font-black tracking-[0.3em] uppercase">
                <Activity size={12} />
                Neural Grid Interface
            </div>
          </div>

          <div className="w-full max-w-sm">
            {!isBooting ? (
              <button 
                onClick={startLens}
                className="w-full group relative overflow-hidden bg-white text-black font-black py-5 rounded-3xl active:scale-95 transition-all text-lg uppercase tracking-widest"
              >
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors">Initialize Feed</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    <span>Calibrating Sensors</span>
                    <span>{bootProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-500 transition-all duration-100 ease-linear" style={{ width: `${bootProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Spatial Map View */}
      {appState === AppState.MAP_VIEW && (
        <SpatialMap onClose={toggleMap} />
      )}

      {/* 4. Scanning HUD Overlay */}
      {(appState === AppState.SCANNING || appState === AppState.MAP_VIEW) && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Status */}
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start pt-14">
            <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/10 shadow-lg pointer-events-auto">
              <div className={`w-2 h-2 rounded-full ${isAiProcessing ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {appState === AppState.MAP_VIEW ? 'SPATIAL GRID ACTIVE' : (isAiProcessing ? 'AI SCANNING...' : 'HUD ACTIVE')}
              </span>
            </div>
            
            <button 
              className="glass-card w-14 h-14 rounded-2xl flex items-center justify-center text-white pointer-events-auto border border-white/10 hover:bg-white/10 active:scale-90 transition-all"
              onClick={() => {
                  setAppState(AppState.INITIALIZING);
                  setDetectedPlace(null);
                  setStories([]);
              }}
            >
              <Home size={22} />
            </button>
          </div>

          {/* Place Tag with Confidence lock */}
          {detectedPlace && appState !== AppState.MAP_VIEW && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div 
                className="bg-blue-600 px-8 py-4 rounded-[2rem] shadow-2xl shadow-blue-900/50 flex flex-col items-center animate-[bounceIn_0.5s_ease-out] cursor-pointer"
                onClick={() => setShowDetail(true)}
              >
                <div className="flex items-center gap-2 mb-1">
                   <CheckCircle2 size={10} className="text-blue-200" />
                   <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">
                     LOCK ESTABLISHED ({(detectedPlace.confidence! * 100).toFixed(0)}%)
                   </span>
                </div>
                <h2 className="text-white font-black text-xl whitespace-nowrap">{detectedPlace.name}</h2>
              </div>
            </div>
          )}

          {/* Uncertain Feedback */}
          {!detectedPlace && isAiProcessing && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 text-blue-500/50 text-[10px] font-black uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-blue-500/20 backdrop-blur-sm animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    Scanning Architecture...
                </div>
            </div>
          )}

          {noMatchReason && !detectedPlace && !isAiProcessing && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                    <AlertCircle size={10} />
                    {noMatchReason}
                </div>
            </div>
          )}

          {/* AR Stories */}
          {appState === AppState.SCANNING && (
            <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-center pr-8 gap-4 overflow-hidden pointer-events-none sm:pr-12">
              {stories.slice(0, 4).map((story, i) => (
                <div key={story.id} className="pointer-events-auto animate-[fadeInRight_0.5s_ease-out]">
                  <StoryCard story={story} index={i} onSelect={handleStorySelect} />
                </div>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-12 left-0 right-0 px-10 flex justify-between items-end pointer-events-auto">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-white font-black text-xs tracking-tighter uppercase">Urban Grid v4.2</span>
                </div>
                <span className="text-white/30 text-[9px] font-bold tracking-[0.2em] uppercase">
                    Status: {isAiProcessing ? 'Validating Visuals' : (appState === AppState.MAP_VIEW ? 'Triangulating' : 'Optical Lock')}
                </span>
             </div>

             <div className="flex gap-4">
               <button 
                onClick={toggleMap}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all border ${
                  appState === AppState.MAP_VIEW 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)]' 
                  : 'bg-white/5 text-white/60 backdrop-blur-xl border-white/10 hover:bg-white/10'
                }`}
               >
                  <MapIcon size={24} />
               </button>
               <button 
                disabled={appState === AppState.MAP_VIEW}
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl transition-all ${
                  appState === AppState.MAP_VIEW ? 'bg-zinc-800 opacity-50' : 'bg-blue-600 active:scale-90 shadow-blue-900/40'
                }`}
               >
                  <CameraIcon size={32} />
               </button>
             </div>
          </div>
        </div>
      )}

      {showDetail && detectedPlace && (
        <PlaceDetailOverlay place={detectedPlace} stories={stories} onClose={() => setShowDetail(false)} />
      )}

      <style>{`
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.3) translateX(-50%); opacity: 0; } 100% { transform: scale(1) translateX(-50%); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default App;
