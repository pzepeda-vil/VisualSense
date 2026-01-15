import React, { useState } from 'react';
import { analyzeProductPage, proxyFetchHtml, imageToBase64 } from './services/geminiService.ts';
import { AnalysisResult } from './types.ts';
import ReportView from './components/ReportView.tsx';
import { Search, Loader2, RefreshCcw, ShieldAlert, Zap, Globe, Cpu } from 'lucide-react';

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
    setStatusText('Initiating secure proxy tunnel...');

    try {
      const html = await proxyFetchHtml(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      setStatusText('Scanning for high-res hero assets...');
      
      const potentialImages: string[] = [];
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImg) potentialImages.push(ogImg);

      const imgElements = Array.from(doc.querySelectorAll('img'));
      imgElements.forEach(img => {
        const src = img.getAttribute('src') || '';
        const srcset = img.getAttribute('srcset') || '';
        const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-zoom-src') || '';
        
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
      if (uniqueImages.length === 0) throw new Error("Target site is aggressively blocking standard crawlers.");

      setStatusText(`Decoding ${uniqueImages.length} assets for AI context...`);
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
      if (validImages.length === 0) throw new Error("CORS Barrier: Site security settings prevent image extraction.");

      setStatusText('Gemini AI is generating audit...');
      const analysisResult = await analyzeProductPage(url, validImages);
      
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-indigo-100">
              <Zap className="text-white w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <h1 className="font-black text-lg sm:text-xl tracking-tighter">VISUAL<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">SENSE</span></h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Cpu className="w-3 h-3" /> System Live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-10 sm:pt-16">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 border border-indigo-100 shadow-sm">
            <Globe className="w-3.5 h-3.5" /> Enterprise Grade Audit
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-4 sm:mb-6 tracking-tighter leading-[1.1] sm:leading-[0.9]">
            The World's Smartest Visual Optimizer.
          </h2>
          <p className="text-base sm:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto px-4">
            Benchmark your site's photography and design patterns against industry standards using next-gen vision models.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16 sm:mb-20">
          <form onSubmit={handleAnalyze} className="relative group px-2 sm:px-0">
            <div className="relative flex flex-col sm:block">
              <div className="absolute inset-y-0 left-0 pl-6 hidden sm:flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="url"
                required
                placeholder="https://nike.com/product-url"
                className="block w-full sm:pl-16 sm:pr-44 py-4 sm:py-6 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-indigo-200/20 focus:ring-8 sm:focus:ring-12 focus:ring-indigo-600/5 focus:border-indigo-600 text-lg sm:text-xl transition-all outline-none font-medium placeholder:text-slate-300 text-center sm:text-left"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-4 sm:mt-0 sm:absolute sm:right-3 sm:top-3 sm:bottom-3 px-8 sm:px-10 py-4 sm:py-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-xl sm:rounded-3xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Optimize Store'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-8 sm:mt-12 p-8 sm:p-16 bg-white rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 animate-spin relative z-10" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight px-4">{statusText}</h3>
              <p className="text-slate-400 mt-2 font-medium max-w-sm px-4">Generating REAL DATA analysis. This takes about 10 seconds...</p>
            </div>
          )}

          {error && (
            <div className="mt-8 p-6 sm:p-10 bg-rose-50 border border-rose-100 rounded-2xl sm:rounded-[2.5rem] flex flex-col sm:flex-row gap-6 sm:gap-8 text-rose-700 items-center sm:items-start shadow-xl shadow-rose-200/10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-4 bg-rose-100 rounded-2xl shadow-sm">
                <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-black text-2xl sm:text-3xl mb-2 tracking-tighter">Access Denied</p>
                <p className="text-base sm:text-lg leading-relaxed opacity-90 font-medium">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                   <button 
                    onClick={(e) => handleAnalyze(e as any)}
                    className="flex items-center justify-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-xl sm:rounded-2xl text-sm font-black hover:bg-rose-700 transition-all shadow-lg active:scale-95"
                  >
                    <RefreshCcw className="w-4 h-4" /> Retry Audit
                  </button>
                  <button 
                    onClick={() => { setUrl(''); setError(null); }}
                    className="px-8 py-3 rounded-xl sm:rounded-2xl text-sm font-black text-rose-600 hover:bg-rose-100 transition-all"
                  >
                    Clear URL
                  </button>
                </div>
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