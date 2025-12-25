
import React from 'react';
import { Story } from '../types';
import * as LucideIcons from 'lucide-react';

interface StoryCardProps {
  story: Story;
  index: number;
  onSelect: (story: Story) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, index, onSelect }) => {
  const IconComponent = (LucideIcons as any)[story.icon] || LucideIcons.Info;

  return (
    <div 
      className="glass-card w-64 p-4 rounded-2xl border-l-4 border-l-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)] cursor-pointer hover:bg-blue-600/10 transition-all group relative overflow-hidden"
      onClick={() => onSelect(story)}
      style={{
        animationDelay: `${index * 150}ms`
      }}
    >
      {/* Hologram Scanline Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-1 w-full animate-[scan_3s_linear_infinite] pointer-events-none" />
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform border border-blue-500/20">
          <IconComponent size={20} />
        </div>
        <div className="flex-1">
          <div className="text-[9px] font-black text-blue-500/70 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            {story.type}
          </div>
          <h3 className="text-white font-bold text-sm mb-1 leading-tight group-hover:text-blue-200">{story.title}</h3>
          <p className="text-zinc-500 text-[11px] line-clamp-2 leading-tight">
            {story.content}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
      `}</style>
    </div>
  );
};

export default StoryCard;
