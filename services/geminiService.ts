import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types.ts";

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
          howToImprove: { type: Type.STRING }
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
        visualRoadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
        competitors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualTakeaway: { type: Type.STRING },
              marketPosition: { type: Type.STRING }
            },
            required: ["name", "strengths", "visualTakeaway", "marketPosition"]
          }
        }
      },
      required: ["brandConsistency", "creativeStyle", "typographyNotes", "layoutAnalysis", "marketingActionables", "overallAesthetic", "visualRoadmap", "competitors"]
    }
  },
  required: ["images", "summary"]
};

export async function analyzeProductPage(
  pageUrl: string, 
  images: { url: string; base64: string }[]
): Promise<AnalysisResult> {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  if (!apiKey) {
    throw new Error("Missing API Key. Check your environment settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: "image/jpeg"
    }
  }));

  const prompt = `
    Audit the product page ${pageUrl} based on the attached visual assets.
    
    1. IMAGE ANALYSIS: For each image, provide technical photography feedback.
    2. COMPETITIVE ANALYSIS: Identify 3 real-world direct competitors for ${pageUrl}. 
       Explain what these competitors are doing right visually (their "Winning Formula").
    3. STRATEGY: Create a 5-step roadmap to outperform them.
    
    Style of response: Professional, data-driven, art-director level technical terminology.
    Return JSON format strictly following the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    const parsed = JSON.parse(response.text || '{}');
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
    throw new Error(`AI Analysis Failed: ${error.message}`);
  }
}

export async function proxyFetchHtml(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Status ${response.status}: Target host is blocking crawler access.`);
    return await response.text();
  } catch (err) {
    throw new Error("Proxy connection failed. The target site may have robust CORS protection.");
  }
}

export async function imageToBase64(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    throw new Error(`Failed to fetch image: ${url}`);
  }
}