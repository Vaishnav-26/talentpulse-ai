import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  Video, 
  VideoOff, 
  Eye, 
  Smile, 
  Zap, 
  Volume2, 
  Mic, 
  HelpCircle,
  Sparkles,
  Lock,
  Layers,
  BarChart2,
  Maximize2
} from 'lucide-react';

export default function LiveRecordingView({
  isRecording,
  isPaused,
  countdown,
  sessionTime,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  liveMetrics,
  transcript,
  onStart,
  onPause,
  onNext,
  onEndAndAnalyze
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState(null); // null | 'granted' | 'denied'
  const [showFaceMesh, setShowFaceMesh] = useState(true);

  // Handle real webcam feed toggling
  useEffect(() => {
    let stream = null;
    if (useWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          setWebcamPermission('granted');
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unavailable:', err);
          setWebcamPermission('denied');
          setUseWebcam(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useWebcam]);

  // Stream live webcam frames to PyTorch backend via WebSocket
  useEffect(() => {
    if (useWebcam && isRecording && !isPaused) {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 320;
      offscreenCanvas.height = 240;
      const ctx = offscreenCanvas.getContext('2d');

      const interval = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          const b64 = offscreenCanvas.toDataURL('image/jpeg', 0.6);
          if (window.CognitiveLab?.sendFrame) {
            window.CognitiveLab.sendFrame(b64);
          }
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [useWebcam, isRecording, isPaused]);

  // Interactive HUD Canvas animation for facial landmark mesh simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const drawMesh = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!showFaceMesh) return;

      const w = canvas.width;
      const h = canvas.height;
      const time = Date.now() * 0.003;

      // Simulated candidate face center coordinates
      const cx = w * 0.5 + Math.sin(time * 0.8) * 8;
      const cy = h * 0.45 + Math.cos(time * 0.5) * 6;

      ctx.save();
      ctx.lineWidth = 1;

      // Outer Face Oval Grid Points
      const faceOvalRadiusX = w * 0.16;
      const faceOvalRadiusY = h * 0.26;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, faceOvalRadiusX, faceOvalRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Facial Bounding Target Box with Corners
      const boxW = faceOvalRadiusX * 2.3;
      const boxH = faceOvalRadiusY * 2.3;
      const bx = cx - boxW / 2;
      const by = cy - boxH / 2;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.setLineDash([]);
      ctx.strokeRect(bx, by, boxW, boxH);

      // Eye Tracking Crosshairs & Boxes
      const eyeOffsetX = faceOvalRadiusX * 0.45;
      const eyeOffsetY = -faceOvalRadiusY * 0.25;

      // Left Eye Box
      const leX = cx - eyeOffsetX;
      const leY = cy + eyeOffsetY;
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(leX - 16, leY - 10, 32, 20);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(leX, leY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye Box
      const reX = cx + eyeOffsetX;
      const reY = cy + eyeOffsetY;
      ctx.strokeRect(reX - 16, reY - 10, 32, 20);
      ctx.beginPath();
      ctx.arc(reX, reY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Connect Gaze Line to Center Camera Focus
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'; // emerald eye gaze
      ctx.beginPath();
      ctx.moveTo(leX, leY);
      ctx.lineTo(w * 0.5, h * 0.25);
      ctx.moveTo(reX, reY);
      ctx.lineTo(w * 0.5, h * 0.25);
      ctx.stroke();

      // Mouth Tracking Arc
      const mouthY = cy + faceOvalRadiusY * 0.4;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.beginPath();
      ctx.arc(cx, mouthY - 5, 24, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Dynamic Face Mesh Node Points
      ctx.fillStyle = '#22d3ee';
      const nodes = [
        { x: cx, y: cy - faceOvalRadiusY * 0.7 }, // forehead
        { x: cx, y: cy + faceOvalRadiusY * 0.1 }, // nose bridge
        { x: cx - 12, y: cy + faceOvalRadiusY * 0.2 }, // left nostril
        { x: cx + 12, y: cy + faceOvalRadiusY * 0.2 }, // right nostril
        { x: cx - faceOvalRadiusX * 0.8, y: cy }, // left cheekbone
        { x: cx + faceOvalRadiusX * 0.8, y: cy }, // right cheekbone
        { x: cx, y: cy + faceOvalRadiusY * 0.85 }, // chin tip
      ];

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect Mesh Wireframe Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      nodes.forEach((n, i) => {
        if (i === 0) ctx.moveTo(n.x, n.y);
        else ctx.lineTo(n.x, n.y);
      });
      ctx.stroke();

      // Orientation Telemetry Text Overlay near Bounding Box
      ctx.fillStyle = '#00f0ff';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`PITCH: ${liveMetrics.pitchYawRoll.pitch}°  YAW: ${liveMetrics.pitchYawRoll.yaw}°`, bx + 6, by - 6);
      ctx.fillText(`GAZE LOCK: ${liveMetrics.eyeContact}%`, bx + boxW - 110, by - 6);

      ctx.restore();
      animId = requestAnimationFrame(drawMesh);
    };

    drawMesh();

    return () => cancelAnimationFrame(animId);
  }, [showFaceMesh, liveMetrics]);

  // Format time (seconds to MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Status Colors Helper
  const getEyeStatusColor = (val) => {
    if (val >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', tag: 'OPTIMAL' };
    if (val >= 70) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', tag: 'MODERATE' };
    return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', tag: 'LOW FOCUS' };
  };

  const getWpmStatusColor = (wpm) => {
    if (wpm >= 130 && wpm <= 165) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', tag: 'BALANCED' };
    if (wpm > 165) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', tag: 'FAST PACE' };
    return { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', tag: 'MEASURED' };
  };

  const eyeStatus = getEyeStatusColor(liveMetrics.eyeContact);
  const wpmStatus = getWpmStatusColor(liveMetrics.speechWPM);

  return (
    <div className="flex flex-col space-y-4 w-full">

      {/* Active Question Banner */}
      <div className="glass-panel rounded-2xl p-4 lg:p-5 border border-cyan-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-mono-tech font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg">
              QUESTION {currentQuestionIndex + 1} OF {totalQuestions}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono-tech bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              {currentQuestion.category}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono-tech bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              {currentQuestion.difficulty}
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono-tech text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SESSION TIMER:</span>
            <span className="text-cyan-300 font-bold text-sm tracking-wider">
              {formatTime(sessionTime)}
            </span>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-heading font-bold text-slate-100 leading-snug">
          {currentQuestion.prompt}
        </h2>
      </div>

      {/* Main 16:9 Video Viewport Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-[0_0_35px_rgba(0,0,0,0.8)] group">
        
        {/* Animated HUD Corner Reticles */}
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />

        {/* HUD Scanning Horizontal Beam */}
        {isRecording && !isPaused && <div className="hud-scan-line" />}

        {/* Cyber Grid Background */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

        {/* Video Source: Webcam Feed OR High-Tech Simulated Candidate Feed */}
        {useWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0b1329] via-[#090d19] to-[#050810]">
            {/* Simulated Candidate Stylized Silhouette */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-gradient-to-t from-cyan-500/20 via-indigo-600/20 to-transparent border-2 border-cyan-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.15)]">
                <div className="w-32 h-32 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <p className="mt-4 font-mono-tech text-xs text-cyan-400/80 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>AI SYNTHETIC CANDIDATE STREAM ACTIVE</span>
              </p>
            </div>
          </div>
        )}

        {/* HUD Overlay Canvas for Landmark Tracking Nodes */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Countdown Overlay when initializing interview */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="text-xs font-mono-tech text-cyan-400 tracking-widest uppercase mb-2">
              GET READY // INTERVIEW CALIBRATION
            </span>
            <span className="font-orbitron text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 animate-bounce">
              {countdown}
            </span>
          </div>
        )}

        {/* Viewport Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Facial Lock Badge */}
          <div className="pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/85 border border-cyan-500/30 backdrop-blur-md text-xs font-mono-tech">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300">FACIAL MESH:</span>
            <span className="text-cyan-400 font-bold">LOCKED (468 POINTS)</span>
          </div>

          {/* Controls: Webcam Toggle & Mesh Toggle */}
          <div className="pointer-events-auto flex items-center space-x-2">
            <button
              onClick={() => setShowFaceMesh((v) => !v)}
              className={`p-2 rounded-lg border text-xs font-mono-tech transition-all backdrop-blur-md ${
                showFaceMesh
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Interactive HUD Mesh Overlay"
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              onClick={() => setUseWebcam((v) => !v)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-tech transition-all backdrop-blur-md ${
                useWebcam
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-semibold'
                  : 'bg-slate-900/80 text-slate-300 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {useWebcam ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
              <span>{useWebcam ? 'Webcam Active' : 'Enable Webcam'}</span>
            </button>
          </div>
        </div>

        {/* Live Speech-to-Text Transcript Bottom Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 text-xs font-mono-tech flex items-start space-x-3">
            <Mic className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0 animate-pulse" />
            <div className="flex-1 overflow-hidden">
              <span className="text-slate-400 font-semibold uppercase mr-2">LIVE TRANSCRIPTION:</span>
              <span className="text-slate-200 italic line-clamp-2">
                "{transcript}"
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Live Metrics Bar (Eye Contact %, Dominant Emotion, Speech WPM) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Metric 1: Eye Contact % */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono-tech font-semibold">EYE CONTACT RATE</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-orbitron font-bold text-slate-100">
                  {liveMetrics.eyeContact}%
                </span>
                <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded border font-semibold ${eyeStatus.bg} ${eyeStatus.text} ${eyeStatus.border}`}>
                  {eyeStatus.tag}
                </span>
              </div>
            </div>
          </div>
          {/* Gauge Ring Visualizer */}
          <div className="relative w-11 h-11">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-500"
                strokeDasharray={`${liveMetrics.eyeContact}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        {/* Metric 2: Dominant Emotion */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Smile className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono-tech font-semibold">DOMINANT EMOTION</p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-base font-heading font-bold text-indigo-300">
                  {liveMetrics.dominantEmotion}
                </span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono-tech font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg">
            {liveMetrics.emotionScores.happy}% CONF.
          </span>
        </div>

        {/* Metric 3: Speech WPM (Words Per Minute) */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono-tech font-semibold">SPEECH PACE</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-orbitron font-bold text-slate-100">
                  {liveMetrics.speechWPM} <span className="text-xs text-slate-400 font-sans">WPM</span>
                </span>
                <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded border font-semibold ${wpmStatus.bg} ${wpmStatus.text} ${wpmStatus.border}`}>
                  {wpmStatus.tag}
                </span>
              </div>
            </div>
          </div>
          {/* Audio Volume Wave indicator */}
          <div className="flex items-end space-x-1 h-8">
            <div className="w-1.5 rounded-full bg-cyan-400 transition-all duration-150" style={{ height: `${Math.min(100, liveMetrics.audioVolume * 0.8)}%` }} />
            <div className="w-1.5 rounded-full bg-cyan-400 transition-all duration-150" style={{ height: `${Math.min(100, liveMetrics.audioVolume * 1.2)}%` }} />
            <div className="w-1.5 rounded-full bg-indigo-400 transition-all duration-150" style={{ height: `${Math.min(100, liveMetrics.audioVolume * 0.9)}%` }} />
            <div className="w-1.5 rounded-full bg-indigo-400 transition-all duration-150" style={{ height: `${Math.min(100, liveMetrics.audioVolume * 0.6)}%` }} />
          </div>
        </div>

      </div>

      {/* Recording Control Action Buttons */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Session Control Buttons */}
        <div className="flex items-center space-x-3">
          {!isRecording ? (
            <button
              onClick={onStart}
              className="flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-heading font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START INTERVIEW</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-heading font-semibold text-sm transition-all"
            >
              <Pause className="w-4 h-4 text-amber-400" />
              <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>
          )}

          <button
            onClick={onNext}
            disabled={!isRecording || currentQuestionIndex >= totalQuestions - 1}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-heading font-semibold text-sm transition-all disabled:opacity-40 disabled:pointer-events-none hover:border-cyan-400"
          >
            <span>NEXT QUESTION</span>
            <SkipForward className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Right: End & Analyze Button */}
        <button
          onClick={onEndAndAnalyze}
          className="flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-100 font-heading font-bold text-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          <span>END & ANALYZE SESSION</span>
        </button>

      </div>

    </div>
  );
}
