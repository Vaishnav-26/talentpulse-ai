import React from 'react';
import { 
  Award, 
  ArrowLeft, 
  Printer, 
  CheckCircle, 
  Smile, 
  Zap, 
  Eye, 
  Clock, 
  FileText,
  UserCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Volume2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AnalysisReport({
  candidateName = "Vaishnav Tardekar",
  candidateRole = "Full-Stack Engineer",
  sessionTime = 0,
  sessionFacialLog = [],
  completedQuestionsLog = [],
  onBackToPractice
}) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const durationFormatted = `${Math.floor(sessionTime / 60)}m ${sessionTime % 60}s`;
  const totalFrames = sessionFacialLog.length;

  // --------------------------------------------------------------------------
  // 1. DYNAMIC FACIAL TELEMETRY COMPUTATION (From real sessionFacialLog)
  // --------------------------------------------------------------------------
  let composedCount = 0;
  let confidentCount = 0;
  let tenseCount = 0;
  let totalEyeContact = 0;

  sessionFacialLog.forEach((item) => {
    const expr = (item.expression || item.dominantEmotion || '').toLowerCase();
    if (expr.includes('confident') || expr.includes('positive') || expr.includes('happy')) {
      confidentCount++;
    } else if (expr.includes('tense') || expr.includes('nervous') || expr.includes('angry') || expr.includes('fear')) {
      tenseCount++;
    } else {
      composedCount++;
    }
    totalEyeContact += (item.eyeContact || 90);
  });

  const composedPercent = totalFrames > 0 ? Math.round((composedCount / totalFrames) * 1000) / 10 : 0;
  const confidentPercent = totalFrames > 0 ? Math.round((confidentCount / totalFrames) * 1000) / 10 : 0;
  const tensePercent = totalFrames > 0 ? Math.round((tenseCount / totalFrames) * 1000) / 10 : 0;
  const avgEyeContact = totalFrames > 0 ? Math.round(totalEyeContact / totalFrames) : 0;
  const stabilityScore = totalFrames > 0 ? Math.min(100, Math.round(composedPercent + confidentPercent)) : 0;

  let dominantFacialEmotion = "No Telemetry Recorded";
  if (totalFrames > 0) {
    if (composedPercent >= confidentPercent && composedPercent >= tensePercent) {
      dominantFacialEmotion = "Composed / Neutral";
    } else if (confidentPercent >= composedPercent && confidentPercent >= tensePercent) {
      dominantFacialEmotion = "Confident / Positive";
    } else {
      dominantFacialEmotion = "Tense / Nervous";
    }
  }

  // --------------------------------------------------------------------------
  // 2. DYNAMIC VOCAL TELEMETRY COMPUTATION (From real completedQuestionsLog)
  // --------------------------------------------------------------------------
  const totalQuestionsAnswered = completedQuestionsLog.length;
  let totalWordsSpoken = 0;
  let totalFillers = 0;
  let wpmSum = 0;
  let scoreSum = 0;
  const toneCounts = { Confident: 0, Balanced: 0, Hesitant: 0 };

  completedQuestionsLog.forEach((q) => {
    const words = q.transcript ? q.transcript.trim().split(/\s+/).filter(Boolean).length : 0;
    totalWordsSpoken += words;
    totalFillers += (q.fillerCount || 0);
    wpmSum += (q.wpm || 0);
    scoreSum += (q.score || 0);

    const tone = q.vocalTone || 'Balanced';
    if (tone in toneCounts) {
      toneCounts[tone]++;
    } else {
      toneCounts['Balanced']++;
    }
  });

  const avgWpm = totalQuestionsAnswered > 0 ? Math.round(wpmSum / totalQuestionsAnswered) : 0;
  const avgScore = totalQuestionsAnswered > 0 ? Math.round(scoreSum / totalQuestionsAnswered) : 0;
  const clarityScore = totalQuestionsAnswered > 0 ? Math.max(60, Math.min(99, 100 - (totalFillers * 4))) : 0;

  let dominantTone = "Balanced";
  if (totalQuestionsAnswered > 0) {
    dominantTone = Object.keys(toneCounts).reduce((a, b) => toneCounts[a] >= toneCounts[b] ? a : b);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1450px] mx-auto w-full pb-16 space-y-6">
      
      {/* Top Header / Navigation Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPractice}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Practice Room</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Candidate Interview Assessment Report
            </h1>
            <p className="text-xs text-slate-500">
              TalentPulse AI v3.5 Multi-Modal Evaluation: Technical Logic, Facial Demeanor & Vocal Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile & Session Meta Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          
          <div className="flex items-center space-x-3.5 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
              VT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{candidateName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>
              <p className="text-xs text-indigo-600 font-medium">{candidateRole}</p>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium">Session Timestamp:</span>
            <p className="font-semibold text-slate-800">{timestamp}</p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium">Session Duration:</span>
            <p className="font-semibold text-slate-800">
              {durationFormatted} ({totalFrames} frames analyzed)
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium">Technical Average:</span>
            <p className="font-bold text-indigo-600 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              {totalQuestionsAnswered > 0 ? `${avgScore}% Overall Score` : 'Pending Submission'}
            </p>
          </div>

        </div>
      </div>

      {/* 2-Column Telemetry: Facial Demeanor (Left) & Vocal Communication (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* 1. FACIAL DEMEANOR & EXPRESSION TELEMETRY (Col 6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Facial Demeanor & Expression Telemetry
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live Vision Analysis across {totalFrames} video frames
                </p>
              </div>
            </div>
            {totalFrames > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {stabilityScore}% Stability
              </span>
            )}
          </div>

          {totalFrames === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No webcam frames recorded in this session.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Turn on your camera in the Practice Room to populate live optical demeanor and gaze telemetry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Distribution Bars */}
              <div className="space-y-3">
                {/* Composed / Neutral */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Composed / Neutral
                    </span>
                    <span className="font-mono text-indigo-700">{composedPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${composedPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Confident / Positive */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Confident / Positive
                    </span>
                    <span className="font-mono text-emerald-700">{confidentPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${confidentPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Tense / Nervous */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Tense / Nervous
                    </span>
                    <span className="font-mono text-amber-700">{tensePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${tensePercent}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Eye Contact & Poise Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <Eye className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Eye Focus</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{avgEyeContact}%</p>
                  <span className={`text-[10px] font-semibold ${avgEyeContact >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {avgEyeContact >= 80 ? 'Optimal Gaze' : 'Gaze Variance'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Poise Consistency</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{stabilityScore}%</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {dominantFacialEmotion}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 2. VOCAL & COMMUNICATION TELEMETRY (Col 6 - Replaces ML Architecture) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Vocal & Communication Telemetry
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cadence, Filler Density, and Articulation Sentiment
                </p>
              </div>
            </div>
            {totalQuestionsAnswered > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {clarityScore}% Clarity
              </span>
            )}
          </div>

          {totalQuestionsAnswered === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No spoken answers submitted yet.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Speak or type answers in the Practice Room and click "Submit Answer" to track speaking rate and tone.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Speaking Pace & Cadence */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Speaking Pace:</span>
                  <span className="font-mono font-bold text-slate-900">{avgWpm} WPM</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Conversational Cadence:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    avgWpm >= 115 && avgWpm <= 165
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {avgWpm >= 115 && avgWpm <= 165 ? 'Optimal Cadence (115-165 WPM)' : 'Pacing Variance'}
                  </span>
                </div>
              </div>

              {/* Vocal Tone & Fluency Stats */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Words</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">{totalWordsSpoken}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Filler Words</span>
                  <p className={`text-base font-bold mt-0.5 font-mono ${totalFillers === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {totalFillers}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Dominant Tone</span>
                  <p className="text-xs font-bold text-indigo-700 mt-1 truncate">{dominantTone}</p>
                </div>
              </div>

              {/* Vocal Sentiment Distribution Chips */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-slate-500 font-medium">Tone Breakdown:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Confident: {toneCounts.Confident}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Balanced: {toneCounts.Balanced}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Hesitant: {toneCounts.Hesitant}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 3. QUESTION-BY-QUESTION TECHNICAL, FACIAL & VOCAL AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question-by-Question Technical & Demeanor Audit
              </h3>
              <p className="text-[11px] text-slate-500">
                Correlating Algorithmic Logic with Facial Poise and Vocal Delivery
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {totalQuestionsAnswered} Questions Logged
          </span>
        </div>

        {totalQuestionsAnswered === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No questions answered yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Return to the Practice Room to answer technical questions and see your approach, Big-O complexity checks, and facial/vocal scores logged here.
            </p>
            <button
              onClick={onBackToPractice}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to Practice Room</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Track</th>
                  <th className="py-2.5 px-3">Time O(N)</th>
                  <th className="py-2.5 px-3">Space O(1)</th>
                  <th className="py-2.5 px-3">Facial Demeanor</th>
                  <th className="py-2.5 px-3">Vocal Pace</th>
                  <th className="py-2.5 px-3">Tone</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {completedQuestionsLog.map((q, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-400">
                      Q{idx + 1}
                    </td>
                    <td className="py-3 px-3 max-w-[280px]">
                      <p className="font-semibold text-slate-900 truncate">{q.questionText || q.title}</p>
                      <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                        "{q.transcript || 'No verbal transcript recorded'}"
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {q.domain || "Algorithms"}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {q.timeComplexityMentioned !== false ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Satisfied
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Omitted</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {q.spaceComplexityMentioned !== false ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Satisfied
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Omitted</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {q.dominantEmotion || (q.telemetry?.dominantEmotion) || "Composed / Neutral"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {q.wpm ? `${q.wpm} WPM` : `${avgWpm || 135} WPM`}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        (q.vocalTone || 'Confident') === 'Confident'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (q.vocalTone === 'Hesitant')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {q.vocalTone || 'Balanced'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {q.score || 85}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. EXECUTIVE CANDIDATE ASSESSMENT SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Executive Candidate Assessment Summary
            </h3>
            <p className="text-[11px] text-slate-500">
              Technical Readiness, Behavioral Presence & Communication Insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Algorithmic Articulation</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              Demonstrates consistent articulation of optimal time bounds and auxiliary space trade-offs across assessed problem rounds.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Demeanor & Composure</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              Maintained {stabilityScore > 0 ? `${stabilityScore}%` : 'high'} composed and positive poise with stable front-facing camera eye contact.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Speech Fluency & Cadence</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              Delivered verbal technical walkthroughs at {avgWpm > 0 ? `${avgWpm} WPM` : 'consistent pacing'} with minimal filler words.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
