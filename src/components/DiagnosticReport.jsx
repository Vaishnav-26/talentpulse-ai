import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Video, 
  Clock, 
  Sparkles, 
  Play, 
  FileCheck,
  RotateCcw,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

export default function DiagnosticReport({
  finalAssessment,
  telemetryHistory = [],
  onRestartInterview,
  onNavigateToQuestions
}) {
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);

  const report = finalAssessment || {
    score: 92,
    ratingLabel: 'EXCEPTIONAL // SENIOR CAPABLE',
    readinessGrade: 'A+',
    totalDurationFormatted: '03m 45s',
    questionsAnswered: 3,
    radarMetrics: { technicalSkills: 94, softSkills: 88, bodyLanguage: 92, structureSTAR: 90 },
    questionBreakdown: [
      {
        qId: 1,
        title: 'Real-Time Video Telemetry Architecture',
        score: 94,
        eyeContact: '95% Focus',
        pacing: '142 WPM',
        confidence: 'High',
        transcriptSnippet: 'I would leverage WebSockets for low-latency video frame streaming directly to an edge processing gateway...',
        aiFeedback: 'Excellent breakdown of backpressure and zero-copy socket buffers. Gaze stability remained consistently locked.'
      },
      {
        qId: 2,
        title: 'Two Sum & Two-Pointer Optimizations',
        score: 92,
        eyeContact: '92% Focus',
        pacing: '138 WPM',
        confidence: 'High',
        transcriptSnippet: 'Using a Hash Map dictionary allows single-pass O(N) lookup of target complements in linear time...',
        aiFeedback: 'Clear explanation of time vs space trade-offs between Hash Maps and Two-Pointer scans.'
      },
      {
        qId: 3,
        title: '60 FPS Canvas Telemetry Rendering',
        score: 91,
        eyeContact: '93% Focus',
        pacing: '146 WPM',
        confidence: 'High',
        transcriptSnippet: 'Decoupled UI render cycles from incoming WebSocket message ticks using mutable refs and OffscreenCanvas...',
        aiFeedback: 'Very clear explanation of rAF rendering loops and memory allocation strategies.'
      }
    ],
    timestampedEvents: [
      { timestamp: '00:12', label: 'Lens Lock Verified', type: 'success', note: 'Direct eye contact reached 96%.' },
      { timestamp: '01:15', label: 'Optimal Vocal Rhythm', type: 'info', note: 'Speech stabilized at 142 WPM.' },
      { timestamp: '02:04', label: 'High Confidence Peak', type: 'success', note: 'Happy/Confident index peaked at 88%.' },
      { timestamp: '03:05', label: 'STAR Action Climax', type: 'success', note: 'High engagement & articulation reached 94%.' }
    ],
    improvements: [
      {
        title: 'Refine System Trade-off Pacing',
        type: 'Pacing',
        suggestion: 'Slightly pause before answering complex architecture trade-offs to reduce micro-expression hesitation.'
      },
      {
        title: 'Incorporate Quantified Impact in STAR Answers',
        type: 'Structure',
        suggestion: 'Add specific percentage metrics to the Result phase (e.g., "Reduced query latency by 45%").'
      }
    ]
  };

  return (
    <div className="max-w-[1750px] mx-auto w-full space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.05)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl shadow-2xs">
              POST-INTERVIEW DIAGNOSTIC REPORT
            </span>
            <span className="px-3 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-2xs uppercase">
              {report.ratingLabel}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Candidate Diagnostic Assessment
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Comprehensive score breakdown per question with synchronized timestamped emotion and STAR logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/90 px-5 py-3 rounded-2xl border border-indigo-200 shadow-sm text-center">
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">OVERALL SCORE</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
              {report.score} / 100
            </p>
          </div>
        </div>
      </div>

      {/* Top Split: Video Replay & Timestamped Emotion Flag Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Video Replay Container */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-7 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              <span>Recorded Video Telemetry Session</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{report.totalDurationFormatted}</span>
            </span>
          </div>

          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto shadow-md">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
              <p className="text-xs font-mono text-cyan-300">
                {selectedTimestamp ? `SCRUBBED TO EVENT: ${selectedTimestamp}` : 'SESSION PLAYBACK WITH TELEMETRY TIMELINE'}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamped Emotion Flags */}
        <div className="glass-panel p-6 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.04)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <span>Timestamped Emotion Flags</span>
            </h3>

            <div className="space-y-2.5">
              {report.timestampedEvents.map((evt, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTimestamp(evt.timestamp)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedTimestamp === evt.timestamp
                      ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                      : 'bg-white/80 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-indigo-700">[{evt.timestamp}]</span>
                    <span className="text-[11px] font-bold text-slate-700">{evt.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{evt.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Synchronized Logs</span>
            <span className="text-emerald-700 font-bold">100% Calibrated</span>
          </div>
        </div>

      </div>

      {/* Per-Question Score Breakdown */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.04)] space-y-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <span>Question-by-Question Technical & Behavioral Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.questionBreakdown.map((q, idx) => (
            <div
              key={idx}
              className="bg-white/80 p-5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    QUESTION {idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                    {q.score} / 100
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {q.title}
                </h4>

                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                  <span>Eye: {q.eyeContact}</span>
                  <span>•</span>
                  <span>Pacing: {q.pacing}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 italic leading-relaxed">
                  "{q.transcriptSnippet}"
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 space-y-1">
                <p className="text-[10px] font-mono text-indigo-800 font-bold uppercase">
                  AI Evaluator Feedback:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {q.aiFeedback}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Feedback & AI Suggested Answer Improvements */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.04)] space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Actionable AI Improvements & STAR Recommendations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.improvements.map((imp, idx) => (
            <div
              key={idx}
              className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200/80 space-y-2 shadow-2xs"
            >
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-indigo-900">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>{imp.title} ({imp.type})</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {imp.suggestion}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons to Restart or Explore Questions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onRestartInterview}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>START NEW PRACTICE ROUND</span>
          </button>

          {onNavigateToQuestions && (
            <button
              onClick={onNavigateToQuestions}
              className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>EXPLORE ALL 50+ QUESTIONS</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
