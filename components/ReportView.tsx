
import React, { useRef, useState } from 'react';
import { AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, CheckCircle2, Eye, Camera, Lightbulb, ArrowRight, Gauge, FileText, Loader2 } from 'lucide-react';
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
    downloadAnchorNode.setAttribute("download", `audit_report_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`VisualSense_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. You can try the JSON export instead.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const scoreData = [
    { name: 'Consistency', value: result.summary.brandConsistency },
    { name: 'Avg Quality', value: Math.round(result.images.reduce((acc, img) => acc + img.qualityScore, 0) / result.images.length) },
  ];

  const displayUrl = () => {
    try { return new URL(result.url).hostname; } catch { return result.url; }
  };

  return (
    <div className="space-y-8 sm:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Dashboard Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 sm:p-3 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200">
            <Eye className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">Audit Dashboard</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">Results for {displayUrl()}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={downloadReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all"
          >
            <Download className="w-4 h-4" /> <span className="hidden xs:inline">JSON</span>
          </button>
          <button
            onClick={downloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xl shadow-indigo-100 relative overflow-hidden"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            PDF Report
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 sm:space-y-16 p-1 sm:p-2">
        {/* Executive Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-indigo-50 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50 blur-3xl"></div>
            
            <div className="mb-6 sm:mb-10 relative">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                Visual DNA Analysis
              </h3>
              <p className="text-sm sm:text-slate-500 mt-1 font-medium">Decoding aesthetic structure and brand harmony.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 relative">
              <div className="space-y-6">
                <div className="p-5 sm:p-6 bg-indigo-50 rounded-2xl sm:rounded-3xl border border-indigo-100">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Aesthetic Direction</span>
                  <p className="text-xl sm:text-2xl font-black text-indigo-900 mt-1">{result.summary.creativeStyle}</p>
                  <p className="text-xs sm:text-sm text-indigo-700/70 mt-2 leading-relaxed italic">"{result.summary.overallAesthetic}"</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Sync</span>
                    <p className="text-lg sm:text-xl font-black text-slate-900">{result.summary.brandConsistency}%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typo Health</span>
                    <p className="text-lg sm:text-xl font-black text-slate-900">Optimal</p>
                  </div>
                </div>
              </div>

              <div className="h-48 sm:h-56 bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center mt-2 flex items-center justify-center gap-2 text-slate-400">
                   <Gauge className="w-3 h-3" /> <span className="text-[9px] font-bold uppercase tracking-tighter">Performance Benchmarks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionables */}
          <div className="bg-indigo-600 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl text-white relative overflow-hidden flex flex-col">
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
            <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center gap-3 relative z-10">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" /> Quick Fixes
            </h3>
            <ul className="space-y-3 sm:space-y-4 flex-1 relative z-10">
              {result.summary.marketingActionables.map((item, idx) => (
                <li key={idx} className="flex gap-3 sm:gap-4 text-xs sm:text-sm font-medium leading-relaxed bg-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm">
                  <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black">
                    {idx + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Optimization Roadmap */}
        <section className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-8 sm:mb-10 text-center sm:text-left">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Lightbulb className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Visual Optimization Roadmap</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Strategic milestones to achieve enterprise-level quality.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {result.summary.visualRoadmap.map((step, idx) => (
              <div key={idx} className={`bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 group hover:bg-indigo-50 transition-all ${idx === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-slate-400 mb-3 sm:mb-4 shadow-sm">
                  0{idx + 1}
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Image Deep Dive */}
        <section>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 sm:px-4 gap-4">
            <div className="flex items-center gap-3">
              <Camera className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" />
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Asset Deep Dive</h3>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              {result.images.length} High-Value Assets
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            {result.images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col group">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={img.base64 ? `data:image/jpeg;base64,${img.base64}` : img.url} 
                    alt="Product Asset" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/95 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black text-indigo-600 shadow-xl border border-white">
                    Asset Audit #{idx + 1}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Photography Setup</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{img.lighting}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quality Score</p>
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="hidden sm:block w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${img.qualityScore}%` }}></div>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-indigo-600">{img.qualityScore}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3" /> Technical Optimization
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed italic">
                      "{img.howToImprove}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-4 sm:pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Dominant Palette</p>
                      <div className="flex gap-1.5 sm:gap-2">
                        {img.dominantColors.map((color, cIdx) => (
                          <div key={cIdx} className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border border-white shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aesthetic Mood</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{img.aesthetic}</p>
                    </div>
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
