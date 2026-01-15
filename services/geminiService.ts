
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
          howToImprove: { type: Type.STRING, description: "Highly technical photography or post-processing advice." }
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
        visualRoadmap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific 5-step roadmap to professionalize the site's look." }
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
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  const ai = new GoogleGenAI({ apiKey });

  const imageParts = images.map((img) => ({
    inlineData: {
      data: img.base64,
      mimeType: "image/jpeg"
    }
  }));

  const prompt = `
    Role: Senior Art Director & E-commerce Strategy Expert.
    Task: Conduct a high-fidelity visual audit of the provided assets from ${pageUrl}.
    
    Audit Guidelines for REAL DATA:
    1. For "Lighting", describe the technical setup (e.g., 'Soft-box 45-degree key light', 'Natural overcast lighting').
    2. For "Composition", mention specific photographic rules (e.g., 'Rule of thirds compliant', 'Central focus with shallow depth of field').
    3. For "How to Improve", provide one specific technical change (e.g., 'Increase contrast in the mid-tones to make the texture pop' or 'Use a wider aperture to blur the background distracting elements').
    4. For "Visual Roadmap", provide 5 sequential, actionable steps the merchant should take in the next 30 days to increase conversion through design.
    5. The "Overall Aesthetic" should capture the emotional value proposition.

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
    if (!response.ok) throw new Error(`Status ${response.status}: Site is blocking the audit.`);
    return await response.text();
  } catch (error: any) {
    throw new Error("Connection Blocked: Please ensure you aren't using a VPN or strict ad-blocker that interferes with the proxy.");
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
