
import React, { useState } from 'react';
import { analyzeProductPage, proxyFetchHtml, imageToBase64 } from './services/geminiService';
import { AnalysisResult } from './types';
import ReportView from './components/ReportView';
import { Search, Loader2, Sparkles, LayoutDashboard, RefreshCcw, ShieldAlert, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStatusText('Deep scanning page structure...');

    try {
      const html = await proxyFetchHtml(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      setStatusText('Extracting high-resolution assets...');
      
      const potentialImages: string[] = [];
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImg) potentialImages.push(ogImg);

      const imgElements = Array.from(doc.querySelectorAll('img'));
      imgElements.forEach(img => {
        const src = img.getAttribute('src') || '';
        const srcset = img.getAttribute('srcset') || '';
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-zoom-src') || img.getAttribute('data-lazy-src') || '';
        
        let targetUrl = dataSrc || src;
        if (srcset) {
          const sets = srcset.split(',').map(s => s.trim().split(' ')[0]);
          targetUrl = sets[sets.length - 1] || targetUrl;
        }

        if (targetUrl) {
          if (targetUrl.startsWith('//')) targetUrl = 'https:' + targetUrl;
          if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
            try { targetUrl = new URL(url).origin + targetUrl; } catch {}
          }
          const isImg = targetUrl.match(/\.(jpg|jpeg|png|webp|avif)/i);
          const isNotIcon = !targetUrl.toLowerCase().includes('icon') && !targetUrl.toLowerCase().includes('logo') && !targetUrl.toLowerCase().includes('svg');
          if (targetUrl.startsWith('http') && isImg && isNotIcon) {
            potentialImages.push(targetUrl);
          }
        }
      });

      const uniqueImages = Array.from(new Set(potentialImages)).slice(0, 5);
      if (uniqueImages.length === 0) throw new Error("No displayable images found.");

      setStatusText(`Encoding ${uniqueImages.length} images for AI...`);
      const base64Images = await Promise.all(
        uniqueImages.map(async (u) => {
          try {
            const b64 = await imageToBase64(u);
            return { url: u, base64: b64 };
          } catch (e) {
            return null;
          }
        })
      );

      const validImages = base64Images.filter((i): i is { url: string; base64: string } => i !== null);
      if (validImages.length === 0) throw new Error("Asset Lockdown: Proxy blocked image access.");

      setStatusText('Gemini AI generating visual audit...');
      const analysisResult = await analyzeProductPage(url, validImages);
      
      // Inject base64 back into results for PDF generation
      const finalResult: AnalysisResult = {
        ...analysisResult,
        images: analysisResult.images.map((img, idx) => ({
          ...img,
          base64: validImages[idx]?.base64
        }))
      };

      setResult(finalResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Visual<span className="text-indigo-600">Sense</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight">
              Free Tier • Audit Mode
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            E-Commerce Visual Optimizer
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            Audit your site's photography, design consistency, and layout psychology with professional-grade AI.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16">
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <input
                type="url"
                required
                placeholder="https://yourstore.com/product/..."
                className="block w-full pl-14 pr-40 py-5 bg-white border-2 border-slate-100 rounded-3xl shadow-2xl focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 text-xl transition-all outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Audit Site'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-10 p-12 bg-white rounded-[2rem] border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-2xl font-bold text-slate-800">{statusText}</h3>
              <p className="text-slate-400 mt-2 text-center">Bypassing site restrictions and decoding high-res assets for analysis...</p>
            </div>
          )}

          {error && (
            <div className="mt-8 p-8 bg-rose-50 border border-rose-100 rounded-3xl flex gap-6 text-rose-700 animate-in fade-in zoom-in-95">
              <ShieldAlert className="w-10 h-10 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-2xl mb-2">Audit Interrupted</p>
                <p className="text-lg leading-relaxed opacity-90">{error}</p>
                <button 
                  onClick={(e) => handleAnalyze(e as any)}
                  className="mt-6 flex items-center gap-2 bg-rose-200/50 px-6 py-2 rounded-full text-sm font-bold hover:bg-rose-200 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" /> Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {result && <ReportView result={result} />}
      </main>
    </div>
  );
};

export default App;
