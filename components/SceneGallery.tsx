
import React from 'react';
import { Scene } from '../types';
import SceneCard from './SceneCard';

interface SceneGalleryProps {
  scenes: Scene[];
  onRegenerate: (id: string) => void;
  onZoom: (url: string) => void;
  isProcessing: boolean;
}

const SceneGallery: React.FC<SceneGalleryProps> = ({ scenes, onRegenerate, onZoom, isProcessing }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {scenes.map((scene) => (
        <SceneCard 
          key={scene.id} 
          scene={scene} 
          onRegenerate={onRegenerate} 
          onZoom={onZoom}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};

export default SceneGallery;
