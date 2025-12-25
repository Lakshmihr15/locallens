
import React, { useState } from 'react';
import { PlaceDetails, AppTab } from '../types';
import { MapPin, History, Star, Users, X, ExternalLink, ThumbsUp, ChevronRight } from 'lucide-react';

interface PlaceOverlayProps {
  place: PlaceDetails;
  onClose: () => void;
}

const PlaceOverlay: React.FC<PlaceOverlayProps> = ({ place, onClose }) => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.STORIES);
  const [upvotes, setUpvotes] = useState(Math.floor(Math.random() * 500) + 100);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotes(v => v + 1);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-50 animate-[slide-up_0.5s_ease-out]">
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 pb-2 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <X size={20} className="text-white" />
          </button>

          <div className="flex items-center gap-2 mb-1 text-blue-400 text-xs font-bold tracking-widest uppercase">
            <MapPin size={12} />
            {place.category}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{place.name}</h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">
            {place.description}
          </p>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1 text-yellow-400">
              <Star size={14} fill="currentColor" />
              <span>{place.rating}</span>
            </div>
            {place.yearBuilt && (
              <div className="text-slate-400">
                Built in <span className="text-white">{place.yearBuilt}</span>
              </div>
            )}
            <button 
              onClick={handleUpvote}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30"
            >
              <ThumbsUp size={14} />
              <span>{upvotes}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-4 mt-2">
          {[
            { id: AppTab.STORIES, label: 'Stories', icon: History },
            { id: AppTab.REVIEWS, label: 'Reviews', icon: Star },
            { id: AppTab.COMMUNITY, label: 'Community', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {activeTab === AppTab.STORIES && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded" />
                  Historical Secrets
                </h3>
                {place.historicalStories.map((story, i) => (
                  <div key={i} className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-slate-300 text-sm leading-relaxed italic">"{story}"</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded" />
                  Fun Facts
                </h3>
                <ul className="space-y-2">
                  {place.funFacts.map((fact, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <ChevronRight size={16} className="text-blue-500 shrink-0" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              {place.groundingUrls && place.groundingUrls.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Verified Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {place.groundingUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-white/5 hover:bg-white/10 text-blue-400 p-2 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        Source {i + 1} <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.REVIEWS && (
            <div className="space-y-4">
              {place.reviews.map((review, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1 text-yellow-500 mb-2">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">"{review}"</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === AppTab.COMMUNITY && (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm mb-4">Be the first to add a story from your experience!</p>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-900/40 transition-all">
                Add My Story
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PlaceOverlay;
