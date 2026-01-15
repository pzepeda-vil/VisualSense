
export interface ImageAnalysis {
  id: string;
  url: string;
  base64?: string;
  dominantColors: string[];
  composition: string;
  lighting: string;
  mood: string;
  aesthetic: string;
  qualityScore: number;
  description: string;
  howToImprove: string;
}

export interface CompetitorInsight {
  name: string;
  strengths: string[];
  visualTakeaway: string;
  marketPosition: string;
}

export interface SiteSummary {
  brandConsistency: number;
  creativeStyle: string;
  typographyNotes: string;
  layoutAnalysis: string;
  marketingActionables: string[];
  overallAesthetic: string;
  visualRoadmap: string[];
  competitors: CompetitorInsight[];
}

export interface AnalysisResult {
  url: string;
  images: ImageAnalysis[];
  summary: SiteSummary;
}
