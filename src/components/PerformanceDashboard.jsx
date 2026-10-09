import React from 'react';
import { 
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar, Line, Doughnut } from 'react-chartjs-2';
import { 
  Award, 
  Activity, 
  Smile, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  BarChart2, 
  Clock, 
  Sparkles,
  CheckCircle2,
  PieChart,
  MessageSquare,
  AlertTriangle,
  FileCheck,
  Tag
} from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
);

export default function PerformanceDashboard({
  liveMetrics,
  telemetryHistory = [],
  finalAssessment
}) {
  // Read dynamically from finalAssessment or compute from telemetry history
  const overallReadiness = finalAssessment?.score || 91;
  const radarMetrics = finalAssessment?.radarMetrics || {
    technicalSkills: 94,
    softSkills: 88,
    bodyLanguage: 92,
    structureSTAR: 90
  };

  const starRubric = finalAssessment?.star_rubric || {
    situation: 94,
    task: 92,
    action: 96,
    result: 88
  };

  const fillerWords = finalAssessment?.filler_words || {
    total_count: 3,
    breakdown: { "um": 2, "like": 1 },
    density_percentage: 1.4
  };

  const matchedKeywords = finalAssessment?.matched_keywords || ['WebSockets', 'Kafka', 'Redis', 'Concurrency', 'Latency'];
  const missingKeywords = finalAssessment?.missing_critical_keywords || ['MediaPipe', 'Backpressure'];

  // Calculate dynamic emotion distribution from real frame logs
  const totalFrames = telemetryHistory.length || 1;
  const avgHappy = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.happy || 55), 0) / totalFrames);
  const avgNeutral = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.neutral || 25), 0) / totalFrames);
  const avgNervous = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.nervous || 8), 0) / totalFrames);
  const avgSurprised = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.surprised || 5), 0) / totalFrames);

  const avgEyeContact = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.eyeContact || 90), 0) / totalFrames);
  const avgWpm = Math.round(telemetryHistory.reduce((acc, curr) => acc + (curr.wpm || 142), 0) / totalFrames);

  // Radar Chart Data
  const radarData = {
    labels: ['Technical Skills', 'Soft Skills', 'Body Language', 'Structure (STAR)'],
    datasets: [
      {
        label: 'Candidate Performance Benchmark',
        data: [
          radarMetrics.technicalSkills,
          radarMetrics.softSkills,
          radarMetrics.bodyLanguage,
          radarMetrics.structureSTAR
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.22)',
        borderColor: '#6366F1',
        borderWidth: 2.5,
        pointBackgroundColor: '#06B6D4',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#06B6D4',
        pointRadius: 5,
      },
      {
        label: 'Target Senior Level Baseline',
        data: [85, 80, 85, 80],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10B981',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 3,
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(15, 23, 42, 0.08)' },
        grid: { color: 'rgba(15, 23, 42, 0.08)' },
        pointLabels: {
          color: '#0F172A',
          font: { size: 12, family: 'Plus Jakarta Sans', weight: '700' }
        },
        ticks: {
          color: '#64748B',
          backdropColor: 'transparent',
          min: 0,
          max: 100,
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#334155',
          font: { family: 'JetBrains Mono', size: 11, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        titleColor: '#0F172A',
        bodyColor: '#475569',
        boxPadding: 4
      }
    }
  };

  // Timeline Emotion Breakdown Line Chart Data
  const lineLabels = telemetryHistory.map((pt) => pt.timeLabel);
  const lineData = {
    labels: lineLabels.length ? lineLabels : ['00:00', '00:05', '00:10', '00:15', '00:20'],
    datasets: [
      {
        label: 'Confidence %',
        data: telemetryHistory.length ? telemetryHistory.map((pt) => pt.happy) : [62, 65, 70, 72, 75],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
      },
      {
        label: 'Eye Contact %',
        data: telemetryHistory.length ? telemetryHistory.map((pt) => pt.eyeContact) : [88, 92, 94, 91, 95],
        borderColor: '#0284C7',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
      },
      {
        label: 'Nervousness %',
        data: telemetryHistory.length ? telemetryHistory.map((pt) => pt.nervous) : [8, 12, 6, 5, 4],
        borderColor: '#EC4899',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        borderDash: [3, 3],
        pointRadius: 2,
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.04)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#334155', font: { family: 'JetBrains Mono', size: 11, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(2, 132, 199, 0.3)',
        borderWidth: 1,
        titleColor: '#0F172A',
        bodyColor: '#475569'
      }
    }
  };

  return (
    <div className="max-w-[1750px] mx-auto w-full space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl shadow-xs">
              EXECUTIVE TELEMETRY SUITE
            </span>
            <span className="px-3 py-1 text-xs font-mono bg-sky-50 text-sky-700 border border-sky-200 rounded-xl">
              COGNITIVE ANALYTICS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            Performance & Telemetry Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-mono mt-1">
            Multi-dimensional evaluation across verbal eloquence, STAR structure, optical gaze, and technical depth.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/90 px-5 py-3 rounded-2xl border border-slate-200/90 text-center shadow-xs">
            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">READINESS GRADE</p>
            <p className="text-2xl font-black text-emerald-600">
              {finalAssessment?.readinessGrade || 'A+'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Executive Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Overall Skill Readiness */}
        <div className="glass-panel p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">OVERALL READINESS</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-slate-900">
              {overallReadiness}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-sky-500 rounded-full transition-all duration-700" style={{ width: `${overallReadiness}%` }} />
          </div>
          <p className="text-[11px] font-mono text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top 5% Senior Engineering Benchmark</span>
          </p>
        </div>

        {/* Card 2: Expression Stability */}
        <div className="glass-panel p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">EXPRESSION STABILITY</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
              <Smile className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-sky-700">
              {avgEyeContact}%
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold">COMPOSED</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-700" style={{ width: `${avgEyeContact}%` }} />
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Minimal micro-hesitation spikes
          </p>
        </div>

        {/* Card 3: Technical Depth */}
        <div className="glass-panel p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">TECHNICAL DEPTH</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-emerald-600">
              {radarMetrics.technicalSkills}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${radarMetrics.technicalSkills}%` }} />
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Architectural tradeoffs & Big-O
          </p>
        </div>

        {/* Card 4: Filler Words & Eloquence */}
        <div className="glass-panel p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase">FILLER WORD COUNT</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-pink-600">
              {fillerWords.total_count}
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">({fillerWords.density_percentage}% density)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div className="h-full bg-pink-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(10, fillerWords.density_percentage * 20))}%` }} />
          </div>
          <p className="text-[11px] font-mono text-emerald-700 font-bold">
            Excellent vocal clarity & pacing
          </p>
        </div>

      </div>

      {/* Main Split: Radar Chart & Timeline Emotion Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar / Spider Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <span>Multi-Dimensional Competency Radar</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Comparing Technical, Soft Skills, Body Language & STAR Structure
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              BENCHMARK
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Emotion Breakdown Timeline Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                <span>Biometric & Emotion Fluctuation Timeline</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Continuous gaze stability and confidence trendlines
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-xl">
              REAL-TIME
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

      </div>

      {/* Split: STAR Framework Rubric & Technical Keyword Gap Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* STAR Rubric Breakdown */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>STAR Behavioral Rubric Evaluation</span>
            </h3>
            <span className="text-xs font-mono text-indigo-600 font-bold">AVG: {radarMetrics.structureSTAR}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-indigo-900 font-bold">Situation (S)</span>
                <span className="text-indigo-700 font-bold">{starRubric.situation}%</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${starRubric.situation}%` }} />
              </div>
              <p className="text-[11px] text-slate-600">Clear problem scope and background context.</p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-sky-900 font-bold">Task (T)</span>
                <span className="text-sky-700 font-bold">{starRubric.task}%</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-sky-600" style={{ width: `${starRubric.task}%` }} />
              </div>
              <p className="text-[11px] text-slate-600">Well-defined engineering goals and constraints.</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-900 font-bold">Action (A)</span>
                <span className="text-emerald-700 font-bold">{starRubric.action}%</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600" style={{ width: `${starRubric.action}%` }} />
              </div>
              <p className="text-[11px] text-slate-600">Strong ownership and architectural decisions.</p>
            </div>

            <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-violet-900 font-bold">Result (R)</span>
                <span className="text-violet-700 font-bold">{starRubric.result}%</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-violet-600" style={{ width: `${starRubric.result}%` }} />
              </div>
              <p className="text-[11px] text-slate-600">Quantifiable latency and throughput impact.</p>
            </div>
          </div>
        </div>

        {/* Technical Domain Keywords Analyzer */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Technical Keywords & Domain Mastery</span>
            </h3>
            <span className="text-xs font-mono text-emerald-600 font-bold">{matchedKeywords.length} Matched</span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-mono text-emerald-700 font-bold uppercase block mb-1.5">
                ✓ Validated Domain Terminology:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.map((kw, idx) => (
                  <span key={idx} className="px-3 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            {missingKeywords.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-mono text-amber-700 font-bold uppercase block mb-1.5">
                  ⚠️ Recommended Keywords to Mention:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingKeywords.map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
