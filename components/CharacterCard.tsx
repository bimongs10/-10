
import React from 'react';
import { Character } from '../types';
import { User, Upload, X } from 'lucide-react';
import { fileToBase64 } from '../utils/fileUtils';

interface CharacterCardProps {
  character: Character;
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onRemove: (id: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onUpdate, onRemove }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { data, mimeType } = await fileToBase64(file);
      
      // Extract filename without extension
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      onUpdate(character.id, { 
        image: data, 
        mimeType,
        // Default name to filename if current name is empty
        name: character.name.trim() === '' ? fileName : character.name
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group relative">
      <button 
        onClick={() => onRemove(character.id)}
        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={14} />
      </button>
      
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square w-full bg-slate-50 rounded-lg overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
          {character.image ? (
            <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <label className="flex flex-col items-center justify-center gap-1 text-slate-400 cursor-pointer w-full h-full">
              <Upload size={20} />
              <span className="text-[10px] font-medium uppercase">Ref Img</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 rounded-md px-2 py-1">
          <User size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Name..."
            className="bg-transparent text-xs font-medium focus:outline-none w-full"
            value={character.name}
            onChange={(e) => onUpdate(character.id, { name: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
