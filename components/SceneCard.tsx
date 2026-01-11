
import React, { useState } from 'react';
import { Scene } from '../types';
import { RefreshCw, Maximize2, CheckCircle2, AlertCircle, Loader2, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  onRegenerate: (id: string) => void;
  onZoom: (url: string) => void;
  isProcessing: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate, onZoom, isProcessing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
      {/* Visual Header */}
      <div 
        className={`relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden ${scene.imageUrl ? 'cursor-zoom-in' : ''}`}
        onClick={() => scene.imageUrl && onZoom(scene.imageUrl)}
      >
        {scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.filename} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : scene.status === 'generating' ? (
          <div className="flex flex-col items-center gap-2 text-blue-500">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Rendering</span>
          </div>
        ) : (
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pending</div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md">
            SCENE {scene.number}
          </div>
          {scene.status === 'completed' && (
            <div className="bg-emerald-500 text-white p-1 rounded-md">
              <CheckCircle2 size={12} />
            </div>
          )}
        </div>

        {scene.status === 'completed' && (
          <button 
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{scene.filename}</h4>
          <button 
            disabled={isProcessing || scene.status === 'generating'}
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate(scene.id);
            }}
            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg disabled:opacity-30 transition-colors"
            title="Regenerate this scene"
          >
            <RefreshCw size={16} className={scene.status === 'generating' ? 'animate-spin' : ''} />
          </button>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
          "{scene.description}"
        </p>

        {scene.prompt && (
          <div className="mt-auto pt-3 border-t border-slate-50">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors"
            >
              <Code size={12} />
              AI PROMPT DETAILS
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {isExpanded && (
              <div className="mt-2 p-2 bg-slate-50 rounded-lg text-[10px] text-slate-600 font-mono leading-normal border border-slate-100 whitespace-pre-wrap">
                {scene.prompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;
