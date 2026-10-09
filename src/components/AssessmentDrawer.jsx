import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Mic, 
  Smile, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Share2, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Copy, 
  Check 
} from 'lucide-react';

export default function AssessmentDrawer({
  isOpen,
  onClose,
  finalAssessment,
  telemetryHistory
}) {
  const [activeTab, setActiveTab] = useState('verbal'); // 'verbal' | 'facial' | 'llm'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !finalAssessment) return null;

  const {
    score,
    ratingLabel,
    totalDurationFormatted,
    questionsAnswered,
    metrics = { avgEyeContact: 94, avgPaceWPM: 142, fillerWordCount: 2, postureStability: '95% Steady', confidenceIndex: '88% High' },
    verbalDelivery = { wpmStatus: 'Optimal Pacing', clarityScore: '96%', fillerWords: [{ word: 'um', count: 1, timestamp: '01:12' }], toneAnalysis: 'Vocal delivery remained confident and well structured.' },
    facialBodyLanguage = { eyeContactConsistency: '94%', headTiltStability: '95%', microExpressions: 'Composed expression maintained throughout trade-off questions.' },
    llmFeedback = { architectureScore: '94/100', modelAnswerSnippet: 'Decouple ingestion pipelines via partitioned message queues.', strengths: ['High gaze stability', 'Clear STAR format'], areasToImprove: ['Add quantitative impact metrics'] }
  } = finalAssessment;

  const handleCopyReport = () => {
    const text = `TALENTPULSE AI // ASSESSMENT REPORT
Overall Score: ${score}/100 (${ratingLabel})
Duration: ${totalDurationFormatted} | Questions: ${questionsAnswered}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ finalAssessment, telemetryHistory }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `talentpulse_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      
      {/* Drawer Card Container */}
      <div className="relative w-full max-w-5xl glass-panel-solid rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col my-auto overflow-hidden border border-white">
        
        {/* Header Bar */}
        <div className="p-6 lg:p-8 bg-white/90 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Award className="w-7 h-7 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] font-mono-tech font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md uppercase">
                  POST-SESSION COMPREHENSIVE ANALYSIS
                </span>
                <span className="text-xs font-mono-tech text-slate-500">
                  DURATION: {totalDurationFormatted}
                </span>
              </div>
              <h2 className="text-xl lg:text-2xl font-orbitron font-extrabold text-slate-900 uppercase tracking-wide mt-1">
                SESSION EVALUATION SCORECARD
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono-tech font-bold transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED!' : 'COPY SUMMARY'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-mono-tech font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scorecard Hero Banner */}
        <div className="p-6 lg:p-8 border-b border-slate-200/80 bg-slate-50/50 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Score */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <p className="text-xs font-mono-tech text-cyan-800 font-bold uppercase tracking-widest mb-1">
              OVERALL SCORE
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600">
                {score}
              </span>
              <span className="text-lg font-orbitron text-slate-400 font-bold">/100</span>
            </div>
            <span className="mt-2 px-3 py-1 text-[11px] font-mono-tech font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full uppercase">
              {ratingLabel}
            </span>
          </div>

          {/* Metric Highlights */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[11px] font-mono-tech text-slate-500 font-medium">AVG EYE CONTACT</span>
              <span className="text-2xl font-orbitron font-black text-cyan-700 mt-1">
                {metrics.avgEyeContact}%
              </span>
              <span className="text-[10px] text-emerald-700 font-mono-tech font-bold mt-0.5">HIGH GAZE FOCUS</span>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[11px] font-mono-tech text-slate-500 font-medium">SPEECH PACE</span>
              <span className="text-2xl font-orbitron font-black text-indigo-700 mt-1">
                {metrics.avgPaceWPM} <span className="text-xs text-slate-400 font-sans font-medium">WPM</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-mono-tech font-bold mt-0.5">OPTIMAL RANGE</span>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[11px] font-mono-tech text-slate-500 font-medium">CONFIDENCE INDEX</span>
              <span className="text-2xl font-orbitron font-black text-emerald-700 mt-1">
                {metrics.confidenceIndex}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono-tech font-bold mt-0.5">POSITIVE BASELINE</span>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col justify-center">
              <span className="text-[11px] font-mono-tech text-slate-500 font-medium">POSTURE STABILITY</span>
              <span className="text-2xl font-orbitron font-black text-amber-700 mt-1">
                {metrics.postureStability}
              </span>
              <span className="text-[10px] text-amber-700 font-mono-tech font-bold mt-0.5">STEADY ALIGNMENT</span>
            </div>
          </div>

        </div>

        {/* Structured Tabs Navigation */}
        <div className="px-6 lg:px-8 pt-6">
          <div className="flex border-b border-slate-200 space-x-2">
            <button
              onClick={() => setActiveTab('verbal')}
              className={`flex items-center space-x-2 pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'verbal'
                  ? 'border-cyan-500 text-cyan-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Verbal Delivery</span>
            </button>

            <button
              onClick={() => setActiveTab('facial')}
              className={`flex items-center space-x-2 pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'facial'
                  ? 'border-indigo-500 text-indigo-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smile className="w-4 h-4" />
              <span>Facial Expression & Gaze</span>
            </button>

            <button
              onClick={() => setActiveTab('llm')}
              className={`flex items-center space-x-2 pb-3 px-4 font-heading font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'llm'
                  ? 'border-emerald-500 text-emerald-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Technical & AI Feedback</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
          {activeTab === 'verbal' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <h4 className="font-mono-tech text-xs font-bold text-cyan-800 uppercase">SPEECH PACE & FLUENCY</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">{verbalDelivery.toneAnalysis}</p>
              </div>
            </div>
          )}

          {activeTab === 'facial' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <h4 className="font-mono-tech text-xs font-bold text-indigo-800 uppercase">GAZE & MICRO-EXPRESSION DYNAMICS</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">{facialBodyLanguage.microExpressions}</p>
              </div>
            </div>
          )}

          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <h4 className="font-mono-tech text-xs font-bold text-emerald-800 uppercase">MODEL ANSWER HIGHLIGHT</h4>
                <p className="text-xs text-slate-700 italic font-sans font-medium">"{llmFeedback.modelAnswerSnippet}"</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
