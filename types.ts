
export interface ImageAnalysis {
  id: string;
  url: string;
  base64?: string; // Storing the data for PDF generation
  dominantColors: string[];
  composition: string;
  lighting: string;
  mood: string;
  aesthetic: 'Professional' | 'Casual' | 'Artistic' | 'Minimalist' | string;
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

export interface ScrapedImage {
  url: string;
  alt: string;
}
