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
  if (!apiKey) throw new Error("API Key is missing or invalid.");
  
  const ai = new GoogleGenAI({ apiKey });

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: "image/jpeg"
    }
  }));

  const prompt = `
    Conduct a professional visual audit of ${pageUrl}. 
    
    1. ASSET ANALYSIS: Evaluate the photography quality and technical composition of the provided images.
    2. MARKET BENCHMARKING: Identify 3 high-performing direct competitors. Detail their specific visual strengths (lighting, model choice, layout).
    3. OPTIMIZATION: Provide a concrete 5-step roadmap to surpass these competitors visually.
    
    Respond strictly in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [...imageParts, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.7
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      url: pageUrl,
      images: (parsed.images || []).map((aiImg: any, idx: number) => ({
        ...aiImg,
        url: images[idx]?.url || ''
      })),
      summary: parsed.summary || {}
    };
  } catch (error: any) {
    throw new Error(`Visual Analysis Engine Failed: ${error.message}`);
  }
}

export async function proxyFetchHtml(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("CORS Proxy rejected the request. Target may have high security.");
  return await response.text();
}

export async function imageToBase64(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`Asset Retrieval Failed (${response.status})`);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}