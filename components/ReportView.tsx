import React, { useRef, useState } from 'react';
import { AnalysisResult } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, CheckCircle2, Eye, Camera, Lightbulb, FileText, Loader2, Trophy, Users, Zap, Target } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportViewProps {
  result: AnalysisResult;
}

const ReportView: React.FC<ReportViewProps> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `audit_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VisualSense_Audit.pdf`);
    } catch (err) {
      alert("PDF failed. Use JSON export.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const scoreData = [
    { name: 'Consistency', value: result.summary.brandConsistency },
    { name: 'Avg Quality', value: Math.round(result.images.reduce((acc, img) => acc + img.qualityScore, 0) / result.images.length) },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Eye className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">Optimization Report</h3>
            <p className="text-sm text-slate-400 font-medium truncate max-w-[200px]">Benchmark: {new URL(result.url).hostname}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={downloadReport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all">
            <Download className="w-4 h-4" /> JSON
          </button>
          <button onClick={downloadPdf} disabled={isGeneratingPdf} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100">
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-12 p-1">
        {/* DNA Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-8 relative z-10">Visual DNA Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Aesthetic Archetype</span>
                  <p className="text-2xl font-black text-indigo-900 leading-none">{result.summary.creativeStyle}</p>
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
            <h3 className="text-xl font-black mb-6 flex items-center gap-3"><CheckCircle2 className="w-6 h-6" /> Top Actionables</h3>
            <ul className="space-y-4">
              {result.summary.marketingActionables.map((item, idx) => (
                <li key={idx} className="flex gap-4 text-xs font-medium leading-relaxed bg-white/10 p-4 rounded-2xl border border-white/10">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Competitor Analysis Card */}
        <section className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600"><Users className="w-8 h-8" /></div>
            <div>
              <h3 className="text-3xl font-black text-slate-900">Market Benchmarking</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Competitor Visual Strengths</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {result.summary.competitors?.map((comp, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">{comp.name}</h4>
                  <Trophy className="w-5 h-5 text-amber-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-3 mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Winning Strategies</span>
                  {comp.strengths.map((s, si) => (
                    <div key={si} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-slate-100">{s}</div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-200">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Visual Takeaway</span>
                  <p className="text-xs font-bold text-slate-800 italic leading-relaxed">"{comp.visualTakeaway}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-emerald-100 rounded-2xl"><Lightbulb className="text-emerald-600 w-8 h-8" /></div>
            <h3 className="text-3xl font-black text-slate-900">Growth Roadmap</h3>
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

        {/* Asset Deep Dive */}
        <section>
          <div className="flex items-center gap-3 mb-8 px-4">
            <Camera className="text-indigo-600 w-8 h-8" />
            <h3 className="text-3xl font-black text-slate-900">Asset Deep Dive</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {result.images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col group">
                <div className="relative aspect-video overflow-hidden bg-slate-200">
                  <img src={img.base64 ? `data:image/jpeg;base64,${img.base64}` : img.url} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Audit Target" />
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl text-xs font-black text-indigo-600 shadow-xl border border-white">Asset #{idx + 1}</div>
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

export default ReportView;