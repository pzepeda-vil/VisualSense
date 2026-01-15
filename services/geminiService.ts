
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    images: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
          composition: { type: Type.STRING },
          lighting: { type: Type.STRING },
          mood: { type: Type.STRING },
          aesthetic: { type: Type.STRING },
          qualityScore: { type: Type.NUMBER },
          description: { type: Type.STRING },
          howToImprove: { type: Type.STRING, description: "Actionable technical tips to improve this specific image's quality or impact." }
        },
        required: ["id", "dominantColors", "composition", "lighting", "mood", "aesthetic", "qualityScore", "description", "howToImprove"]
      }
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        brandConsistency: { type: Type.NUMBER },
        creativeStyle: { type: Type.STRING },
        typographyNotes: { type: Type.STRING },
        layoutAnalysis: { type: Type.STRING },
        marketingActionables: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallAesthetic: { type: Type.STRING },
        visualRoadmap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step optimization roadmap for the brand's visual identity." }
      },
      required: ["brandConsistency", "creativeStyle", "typographyNotes", "layoutAnalysis", "marketingActionables", "overallAesthetic", "visualRoadmap"]
    }
  },
  required: ["images", "summary"]
};

export async function analyzeProductPage(
  pageUrl: string, 
  images: { url: string; base64: string }[]
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: "image/jpeg"
    }
  }));

  const prompt = `
    Perform a professional audit on these images from ${pageUrl}.
    1. For each image, provide detailed visual attributes and a specific "How to Improve" tip focusing on photography or editing.
    2. Provide a 'Visual Roadmap' (an array of strings) that gives the merchant 5 clear steps to improve their brand aesthetic.
    3. Analyze typography and layout based on visual cues in the images and surrounding patterns.
    Return the response as JSON matching the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    const jsonStr = response.text || '{}';
    const parsed = JSON.parse(jsonStr);
    
    const analyzedImages = (parsed.images || []).map((aiImg: any, idx: number) => ({
      ...aiImg,
      url: images[idx]?.url || ''
    }));

    return {
      url: pageUrl,
      images: analyzedImages,
      summary: parsed.summary || {}
    };
  } catch (error: any) {
    throw new Error(`AI Analysis Error: ${error.message}`);
  }
}

export async function proxyFetchHtml(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Status ${response.status}: Site is blocking the proxy.`);
    return await response.text();
  } catch (error: any) {
    throw new Error("Connection Blocked: Ensure your ad-blocker is off and the URL is correct.");
  }
}

export async function imageToBase64(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error("Failed to read image data."));
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    throw error;
  }
}
