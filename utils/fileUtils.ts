
import JSZip from 'jszip';
import { Scene } from '../types';

export const parseScript = (text: string): Scene[] => {
  // Regex to find patterns like "1. ", "2. ", etc.
  const regex = /(\d+\.)/g;
  const parts = text.split(regex);
  const scenes: Scene[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const number = parts[i].replace('.', '').trim();
    const content = parts[i + 1]?.trim();
    
    if (content) {
      const firstLine = content.split('\n')[0].replace(/[^\w\s가-힣]/g, '').slice(0, 15);
      // Adding a unique ID for each scene frame
      scenes.push({
        id: Math.random().toString(36).substr(2, 9),
        number,
        description: content,
        filename: `${number}_${firstLine}.png`,
        status: 'idle'
      });
    }
  }
  return scenes;
};

export const downloadAsZip = async (scenes: Scene[]) => {
  const zip = new JSZip();
  const folder = zip.folder("storyboard_images");

  for (const scene of scenes) {
    if (scene.imageUrl) {
      const base64Data = scene.imageUrl.split(',')[1];
      folder?.file(scene.filename, base64Data, { base64: true });
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = "storyboard_package.zip";
  link.click();
};

export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ 
      data: reader.result as string, 
      mimeType: file.type 
    });
    reader.onerror = error => reject(error);
  });
};
