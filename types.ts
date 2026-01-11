
export interface Character {
  id: string;
  name: string;
  image?: string; // base64
  mimeType?: string;
}

export interface User {
  email: string;
  name: string;
}

export interface Scene {
  id: string; // Unique identifier for regeneration
  number: string;
  description: string;
  filename: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  prompt?: string;
}

export type StylePreset = 'Photorealistic' | 'Anime Style' | '3D Render' | 'Digital Art';

export const STYLE_PRESETS: StylePreset[] = [
  'Photorealistic',
  'Anime Style',
  '3D Render',
  'Digital Art'
];

export type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16';
export type Language = 'en' | 'ko';
