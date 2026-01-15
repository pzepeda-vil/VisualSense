import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { 
  Search, Loader2, ShieldAlert, Zap, Globe, Cpu, 
  CheckCircle2, Eye, Lightbulb, FileText, 
  Trophy, Users, Target, Camera, RefreshCcw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- TYPES ---
interface ImageAsset {
  url: string;
  base64: string;
  mimeType: string;
}

interface ImageAnalysis {
  id: string;
  url: string;
  base64?: string;
  mimeType?: string;
  dominantColors: string[];
  composition: string;
  lighting: string;
  mood: string;
  aesthetic: string;
  qualityScore: number;
  description: string;
  howToImprove: string;
}

interface CompetitorInsight {
  name: string;
  strengths: string[];
  visualTakeaway: string;
  marketPosition: string;
}

interface SiteSummary {
  brandConsistency: number;
  creativeStyle: string;
  typographyNotes: string;
  layoutAnalysis: string;
  marketingActionables: string[];
  overallAesthetic: string;
  visualRoadmap: string[];
  competitors: CompetitorInsight[];
}

interface AnalysisResult {
  url: string;
  images: ImageAnalysis[];
  summary: SiteSummary;
}

// --- CONFIG & SCHEMAS ---
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

// --- HELPERS ---
async function proxyFetchHtml(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("Target site is unreachable or blocking the audit proxy.");
  return await response.text();
}

async function fetchAssetAsBase64(url: string): Promise<ImageAsset | null> {
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    // CRITICAL: Block SVGs to prevent 400 errors in Gemini API
    const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];
    if (blob.type.includes('svg') || !supportedMimes.includes(blob.type)) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          url: url,
          base64: base64String,
          mimeType: blob.type
        });
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

// --- COMPONENTS ---
const ReportView: React.FC<{ result: AnalysisResult }> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Audit_${new URL(result.url).hostname}.pdf`);
    } catch (err) {
      alert("PDF generation failed.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const scoreData = [
    { name: 'Consistency', value: result.summary.brandConsistency },
    { name: 'Avg Quality', value: Math.round(result.images.reduce((acc, img) => acc + img.qualityScore, 0) / Math.max(result.images.length, 1)) },
  ];

  return (
    <div className="space-y-12 report-fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl"><Eye className="text-white w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">Optimization Report</h3>
            <p className="text-sm text-slate-400 font-medium">{new URL(result.url).hostname}</p>
          </div>
        </div>
        <button onClick={downloadPdf} disabled={isGeneratingPdf} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Export PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10"><Zap className="text-indigo-600 w-6 h-6" /> Visual DNA Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Archetype</span>
                  <p className="text-2xl font-black text-indigo-900 leading-tight">{result.summary.creativeStyle}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase block">Brand Sync</span><p className="text-xl font-black text-slate-900">{result.summary.brandConsistency}%</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase block">UX Score</span><p className="text-xl font-black text-slate-900">Optimal</p></div>
                </div>
              </div>
              <div className="h-48 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 shadow-2xl text-white">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3"><CheckCircle2 className="w-6 h-6" /> Priorities</h3>
            <ul className="space-y-4">
              {result.summary.marketingActionables.map((item, idx) => (
                <li key={idx} className="flex gap-4 text-xs font-medium leading-relaxed bg-white/10 p-4 rounded-2xl border border-white/10">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600"><Users className="w-8 h-8" /></div>
            <div><h3 className="text-3xl font-black text-slate-900 tracking-tight">Market Benchmarking</h3><p className="text-slate-400 font-bold text-xs uppercase mt-1">Direct Industry Competitors</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {result.summary.competitors?.map((comp, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-indigo-50/30 transition-all shadow-sm">
                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{comp.name}</h4>
                <div className="space-y-2 mb-6">
                  {comp.strengths.map((s, si) => (
                    <div key={si} className="text-[10px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-100">{s}</div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-200">
                  <span className="text-[10px] font-black text-indigo-400 uppercase block mb-2">Visual Strategy</span>
                  <p className="text-xs font-bold text-slate-800 italic">"{comp.visualTakeaway}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-emerald-100 rounded-2xl"><Lightbulb className="text-emerald-600 w-8 h-8" /></div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Optimization Roadmap</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {result.summary.visualRoadmap.map((step, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:bg-indigo-50 transition-all">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-slate-400 mb-4 shadow-sm group-hover:text-indigo-600">0{idx + 1}</div>
                <p className="text-xs font-bold text-slate-800 leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8 px-4">
            <Camera className="text-indigo-600 w-8 h-8" />
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Asset Audit</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {result.images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col group">
                <div className="relative aspect-video overflow-hidden bg-slate-200">
                  <img 
                    src={img.base64 ? `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` : img.url} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" 
                    alt="Audit Target" 
                  />
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl text-xs font-black text-indigo-600 border border-white">Asset #{idx + 1}</div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase block mb-1">Lighting</p><p className="text-sm font-bold text-slate-800">{img.lighting}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase block mb-1">Quality Score</p><p className="text-sm font-black text-indigo-600">{img.qualityScore}%</p></div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-indigo-500 uppercase block mb-2 flex items-center gap-2"><Zap className="w-3 h-3" /> Technical Optimization</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{img.howToImprove}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setError(null); setResult(null); setStatusText('Accessing domain...');
    
    try {
      const targetBase = new URL(url).origin;
      const html = await proxyFetchHtml(url);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      setStatusText('Identifying visual assets...');
      const candidates: string[] = [];
      
      // 1. OG Images
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImg) candidates.push(ogImg);
      
      // 2. Picture tags and Sources
      Array.from(doc.querySelectorAll('source')).forEach(s => {
        const srcset = s.getAttribute('srcset');
        if (srcset) {
          const sets = srcset.split(',').map(part => part.trim().split(' ')[0]);
          candidates.push(sets[sets.length - 1]);
        }
      });

      // 3. Img tags (standard and lazy-load)
      Array.from(doc.querySelectorAll('img')).forEach(img => {
        const src = img.getAttribute('src');
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
        const srcset = img.getAttribute('srcset');
        
        let foundUrl = dataSrc || src;
        if (srcset) {
          const parts = srcset.split(',').map(p => p.trim().split(' ')[0]);
          foundUrl = parts[parts.length - 1]; 
        }
        if (foundUrl) candidates.push(foundUrl);
      });

      // Filtering and Resolution
      const resolvedUrls = Array.from(new Set(candidates))
        .map(u => {
          try { return new URL(u, targetBase).href; } catch { return null; }
        })
        .filter((u): u is string => {
          if (!u) return false;
          const low = u.toLowerCase();
          // STRICT SVG FILTERING: Explicitly block .svg and base64 svgs to avoid Gemini 400 errors
          const isSvg = low.endsWith('.svg') || low.includes('.svg?') || low.includes('image/svg+xml') || low.includes('data:image/svg+xml');
          return u.startsWith('http') && !low.includes('icon') && !low.includes('logo') && !isSvg;
        })
        .slice(0, 4);

      if (resolvedUrls.length === 0) throw new Error("No compatible product images (JPEG/PNG/WebP) detected. The site might be using SVGs only or blocking access.");
      
      setStatusText('Encoding design patterns...');
      const assetTasks = resolvedUrls.map(i => fetchAssetAsBase64(i));
      const assetResults = await Promise.all(assetTasks);
      const validAssets = assetResults.filter((a): a is ImageAsset => a !== null);

      if (validAssets.length === 0) throw new Error("Could not extract supported image data. SVGs were detected but are incompatible with the audit engine.");

      setStatusText('Gemini AI is auditing design...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const imageParts = validAssets.map(asset => ({ 
        inlineData: { data: asset.base64, mimeType: asset.mimeType } 
      }));
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          parts: [
            ...imageParts, 
            { text: `Audit ${url} for visual consistency, lighting, and benchmarking against 3 competitors. Respond in JSON.` }
          ] 
        }],
        config: { responseMimeType: "application/json", responseSchema: ANALYSIS_SCHEMA }
      });

      if (!response.text) throw new Error("AI engine failure.");
      const parsed = JSON.parse(response.text);
      
      const finalImages = (parsed.images || []).map((aiImg: any, idx: number) => ({
        ...aiImg,
        url: validAssets[idx]?.url || '',
        base64: validAssets[idx]?.base64,
        mimeType: validAssets[idx]?.mimeType
      }));

      setResult({ url, images: finalImages, summary: parsed.summary });
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
      setStatusText(''); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md border-b h-16 flex items-center px-6 sticky top-0 z-50">
        <Zap className="text-indigo-600 mr-2 w-5 h-5 fill-indigo-600" />
        <h1 className="font-black text-xl tracking-tighter text-slate-900">VISUAL<span className="text-indigo-600">SENSE</span></h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm">
            <Globe className="w-3 h-3" /> Professional Visual Auditor
          </div>
          <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[0.9]">Smart Creative Strategy.</h2>
          <p className="text-lg text-slate-500 font-medium px-4">Audit any product page's visual quality, lighting, and composition against direct competitors.</p>
        </div>

        <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto mb-20 px-2 sm:px-0">
          <div className="relative group">
            <input 
              type="url" 
              required 
              placeholder="https://nike.com/product-page" 
              className="w-full px-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl shadow-indigo-200/20 text-xl text-black placeholder:text-slate-300 outline-none focus:border-indigo-600 transition-all font-bold" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
            <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] disabled:bg-slate-300 transition-all active:scale-95 shadow-lg shadow-indigo-600/30">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Audit Design'}
            </button>
          </div>
          {statusText && <p className="text-center mt-6 text-indigo-600 font-black text-xs uppercase tracking-widest animate-pulse">{statusText}</p>}
        </form>

        {error && (
          <div className="max-w-3xl mx-auto mb-12 p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex gap-6 text-rose-700 items-start animate-in fade-in slide-in-from-top-4">
            <ShieldAlert className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-black text-2xl mb-1 tracking-tight uppercase">Audit Blocked</p>
              <p className="text-sm font-bold opacity-80 leading-relaxed">{error}</p>
              <button 
                onClick={() => { setUrl(''); setError(null); }}
                className="mt-4 flex items-center gap-2 text-xs font-black text-rose-600 bg-white px-4 py-2 rounded-xl border border-rose-200 shadow-sm hover:bg-rose-100 transition-colors"
              >
                <RefreshCcw className="w-3 h-3" /> Clear and Retry
              </button>
            </div>
          </div>
        )}

        {result && <ReportView result={result} />}
      </main>
    </div>
  );
};

// --- MOUNT ---
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}