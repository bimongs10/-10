
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Character, Scene, AspectRatio } from "../types";

// Always initialize with process.env.API_KEY directly from environment
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Uses gemini-3-flash-preview to optimize a scene description into a high-quality image prompt.
 */
export const optimizePrompt = async (
  sceneContent: string,
  stylePreset: string,
  customStyle: string,
  characters: Character[]
): Promise<string> => {
  const ai = getAI();
  const charNames = characters.map(c => c.name).filter(n => n).join(', ');
  
  const systemInstruction = `You are a world-class storyboard artist and image prompting expert. 
  Your goal is to transform a Korean or English scene description into a highly detailed, professional English image generation prompt.
  Focus on lighting, camera angle, composition, and specific character traits.
  The style should be: ${stylePreset}. ${customStyle ? `Additional style details: ${customStyle}` : ''}
  Characters involved: ${charNames}.
  Output ONLY the final English prompt, no explanations.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this scene: ${sceneContent}`,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text?.trim() || sceneContent;
};

/**
 * Uses gemini-2.5-flash-image to generate a scene image with specific aspect ratio.
 */
export const generateSceneImage = async (
  prompt: string,
  characters: Character[],
  aspectRatio: AspectRatio = "16:9",
  styleRef?: { data: string, mimeType: string }
): Promise<string | undefined> => {
  const ai = getAI();
  
  const parts: Part[] = [];

  // Include character images as context for consistency
  characters
    .filter(c => c.image && c.mimeType)
    .forEach(c => {
      parts.push({
        inlineData: {
          data: c.image!.split(',')[1] || c.image!,
          mimeType: c.mimeType!,
        },
      });
    });

  // Include style reference image if provided
  if (styleRef) {
    parts.push({
      inlineData: {
        data: styleRef.data.split(',')[1] || styleRef.data,
        mimeType: styleRef.mimeType,
      },
    });
  }

  // Final text prompt
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return undefined;
};
