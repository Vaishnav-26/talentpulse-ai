import React from 'react';
import { 
  BarChart2, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  TrendingUp,
  Radio,
  Sliders
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryPanel({
  liveMetrics,
  telemetryHistory,
  anomalyLogs,
  isOpen,
  onToggle
}) {
  // Chart.js Line Chart Setup for Light Theme
  const chartData = {
    labels: telemetryHistory.map((h) => h.timeLabel),
    datasets: [
      {
        label: 'Eye Contact %',
        data: telemetryHistory.map((h) => h.eyeContact),
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Happy / Confident %',
        data: telemetryHistory.map((h) => h.happy),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      },
      {
        label: 'Nervous %',
        data: telemetryHistory.map((h) => h.nervous),
        borderColor: '#F43F5E',
        backgroundColor: 'rgba(244, 63, 94, 0.05)',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 1.5,
        borderDash: [3, 3],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 8,
          color: '#475569',
          font: { family: 'JetBrains Mono', size: 9, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#06B6D4',
        borderWidth: 1,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
        padding: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.04)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 5 }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(15, 23, 42, 0.04)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 } }
      }
    }
  };

  return (
    <aside 
      className={`transition-all duration-300 relative flex flex-col ${
        isOpen ? 'w-full lg:w-[380px] xl:w-[420px]' : 'w-full lg:w-14'
      }`}
    >
      {/* Sidebar Expand/Collapse Toggle Button for Desktop */}
      <button
        onClick={onToggle}
        className="hidden lg:flex absolute -left-3.5 top-6 z-40 w-7 h-7 rounded-full bg-white border border-slate-300 text-indigo-600 items-center justify-center shadow-md hover:scale-110 hover:border-indigo-400 transition-all cursor-pointer"
        title={isOpen ? 'Collapse Telemetry Panel' : 'Expand Telemetry Panel'}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Collapsed State Icon Column */}
      {!isOpen && (
        <div className="hidden lg:flex flex-col items-center py-6 space-y-6 glass-panel rounded-3xl border border-white/80 h-full shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
          <Activity className="w-5 h-5 text-cyan-600 animate-pulse" />
          <BarChart2 className="w-5 h-5 text-indigo-600" />
          <div className="h-px w-6 bg-slate-200" />
          <span className="font-mono-tech text-[10px] font-bold text-cyan-700 rotate-90 whitespace-nowrap uppercase tracking-widest mt-8">
            REALTIME MATRIX
          </span>
        </div>
      )}

      {/* Expanded Main Panel */}
      {isOpen && (
        <div className="glass-panel rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] border border-white/80 flex flex-col space-y-5 h-full overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-2xs">
                <Activity className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-black text-slate-900 uppercase tracking-wide">
                  TELEMETRY MATRIX
                </h3>
                <p className="text-[10px] font-mono-tech text-slate-500 font-medium">REAL-TIME FACIAL & VOICE STREAM</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 text-[10px] font-mono-tech font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg shadow-2xs">
              LIVE 60Hz
            </span>
          </div>

          {/* Section 1: Dynamic Emotion Breakdown Bar Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                <span>EMOTIONAL SPECTRUM BREAKDOWN</span>
              </span>
            </div>

            <div className="space-y-2.5 bg-white/85 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              
              {/* Neutral */}
              <div>
                <div className="flex justify-between text-xs font-mono-tech mb-1">
                  <span className="text-slate-600 font-semibold">NEUTRAL / COMPOSED</span>
                  <span className="text-indigo-700 font-bold">{liveMetrics.emotionScores.neutral}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${liveMetrics.emotionScores.neutral}%` }} 
                  />
                </div>
              </div>

              {/* Happy / Confident */}
              <div>
                <div className="flex justify-between text-xs font-mono-tech mb-1">
                  <span className="text-slate-600 font-semibold">HAPPY / CONFIDENT</span>
                  <span className="text-emerald-700 font-bold">{liveMetrics.emotionScores.happy}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${liveMetrics.emotionScores.happy}%` }} 
                  />
                </div>
              </div>

              {/* Nervous / Fear */}
              <div>
                <div className="flex justify-between text-xs font-mono-tech mb-1">
                  <span className="text-slate-600 font-semibold">NERVOUS / FEAR</span>
                  <span className="text-rose-700 font-bold">{liveMetrics.emotionScores.nervous}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-rose-500 transition-all duration-500" 
                    style={{ width: `${liveMetrics.emotionScores.nervous}%` }} 
                  />
                </div>
              </div>

              {/* Surprised / Thoughtful */}
              <div>
                <div className="flex justify-between text-xs font-mono-tech mb-1">
                  <span className="text-slate-600 font-semibold">SURPRISED / THOUGHTFUL</span>
                  <span className="text-amber-700 font-bold">{liveMetrics.emotionScores.surprised}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${liveMetrics.emotionScores.surprised}%` }} 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Live Timeline Graph showing emotion fluctuations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                <span>LIVE FLUCTUATION TIMELINE</span>
              </span>
            </div>

            <div className="h-44 w-full bg-white/85 p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Section 3: Micro-Expression Anomaly Feed */}
          <div className="space-y-2 flex-1 flex flex-col min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>ANOMALY EVENT FEED</span>
              </span>
              <span className="text-[10px] font-mono-tech text-slate-500 font-bold">COUNT: {anomalyLogs.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1">
              {anomalyLogs.map((log) => (
                <div 
                  key={log.id} 
                  className={`p-2.5 rounded-2xl border text-xs font-mono-tech flex items-start space-x-2.5 transition-all shadow-2xs ${
                    log.type === 'warning' 
                      ? 'bg-rose-50/90 border-rose-200 text-rose-800' 
                      : log.type === 'success'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                      : 'bg-white/90 border-slate-200 text-slate-700'
                  }`}
                >
                  {log.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />}
                  {log.type === 'info' && <Info className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />}

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500">[{log.time}]</span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-white text-slate-600 border border-slate-200">
                        {log.type}
                      </span>
                    </div>
                    <p className="leading-snug text-slate-800 font-sans font-medium">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </aside>
  );
}
