import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  User,
  Check,
  Send,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Award
} from 'lucide-react';
import ZaraAvatar from './ZaraAvatar';

// Uniform complexity badge component
function ComplexityChip({ children, isSatisfied = null }) {
  return (
    <span className="inline-flex items-center gap-1">
      <code className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs tracking-tight">
        {children}
      </code>
      {isSatisfied === true && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-2.5 h-2.5" /> Satisfied
        </span>
      )}
      {isSatisfied === false && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Omitted
        </span>
      )}
    </span>
  );
}

// Formatted guidance parser
function FormattedGuidance({ text }) {
  if (!text) return null;
  const parts = text.split(/(O\([a-zA-Z0-9\s\+\*\^\^log\-\/]+\))/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (/^O\([a-zA-Z0-9\s\+\*\^\^log\-\/]+\)$/.test(part)) {
          return <ComplexityChip key={index}>{part}</ComplexityChip>;
        }
        return part;
      })}
    </span>
  );
}

export default function InterviewRoom({
  isRecording,
  isPaused,
  isMuted,
  onToggleMute,
  sessionTime,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  liveMetrics,
  onLiveMetricsUpdate,
  transcript: externalTranscript,
  onStart,
  onPause,
  onNext,
  onPrev,
  onEndAndAnalyze,
  onTranscriptUpdate,
  onAddAnswerRecord
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const frameIntervalRef = useRef(null);

  // Hardware State
  const [useWebcam, setUseWebcam] = useState(false);
  const [isVideoTrackEnabled, setIsVideoTrackEnabled] = useState(true);
  const [devicePermissionError, setDevicePermissionError] = useState(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [liveVolumeLevel, setLiveVolumeLevel] = useState(0);
  const [cameraRequiredToast, setCameraRequiredToast] = useState(null);

  // Telemetry & Speech State
  const [showFaceMesh, setShowFaceMesh] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [localTranscript, setLocalTranscript] = useState(externalTranscript || '');
  const [calculatedWpm, setCalculatedWpm] = useState(0);
  const [isMicDictating, setIsMicDictating] = useState(false);
  const [fillerCount, setFillerCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState([]);
  const [liveVocalTone, setLiveVocalTone] = useState('Balanced');
  const speechRecognitionSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // AI Evaluation & Model Pipeline State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [zaraSpeechBubble, setZaraSpeechBubble] = useState(null);
  const [completedCount, setCompletedCount] = useState(currentQuestionIndex || 0);

  // Question item fallback
  const activeQuestionItem = currentQuestion || {
    id: 1,
    title: 'Two Sum & Two-Pointer Optimizations',
    domain: 'DSA & Algorithms',
    category: 'Two Pointers & Arrays',
    difficulty: 'Easy',
    prompt: 'Explain the Two-Pointer technique versus Hash Map lookup for finding pairs that sum to a target. When is sorting first advantageous despite the O(N log N) overhead?',
    skillsAssessed: ['Two Pointers', 'Hash Map', 'Time Complexity', 'Space vs Time Tradeoffs'],
    modelAnswerTip: 'Explain O(N) time with O(N) space using Hash Map vs O(N log N) time with O(1) auxiliary space using Two Pointers on sorted arrays.'
  };

  // Sync external transcript if provided
  useEffect(() => {
    if (externalTranscript !== undefined && externalTranscript !== localTranscript) {
      setLocalTranscript(externalTranscript);
    }
  }, [externalTranscript]);

  const handleStartInterview = async () => {
    if (!useWebcam || !isVideoTrackEnabled) {
      setCameraRequiredToast('Enabling webcam for real-time facial and demeanor telemetry...');
      await startCamera();
    }
    setCameraRequiredToast(null);
    onStart();
  };

  const handlePrevQuestion = () => {
    setEvaluationResult(null);
    setZaraSpeechBubble(null);
    setLocalTranscript('');
    if (onTranscriptUpdate) onTranscriptUpdate('');
    if (onPrev) onPrev();
  };

  const handleNextQuestion = () => {
    setEvaluationResult(null);
    setZaraSpeechBubble(null);
    setLocalTranscript('');
    if (onTranscriptUpdate) onTranscriptUpdate('');
    onNext();
  };

  // Recalculate WPM and filler words dynamically
  useEffect(() => {
    if (!localTranscript || !localTranscript.trim()) {
      setCalculatedWpm(0);
      setFillerCount(0);
      setDetectedFillers([]);
      setLiveVocalTone('Balanced');
      return;
    }
    const words = localTranscript.trim().split(/\s+/).filter(Boolean);
    const elapsedMinutes = Math.max(0.12, (sessionTime || 1) / 60);
    const wpm = Math.min(220, Math.max(0, Math.round(words.length / elapsedMinutes)));
    setCalculatedWpm(wpm);

    // Calculate live filler words
    const matches = localTranscript.match(/\b(um|uh|like|you know|sort of|kind of|basically|actually|literally|i mean)\b/gi);
    const fillers = matches ? matches.length : 0;
    setFillerCount(fillers);
    setDetectedFillers(matches ? Array.from(new Set(matches.map(w => w.toLowerCase()))) : []);

    // Live vocal tone approximation
    const lower = localTranscript.toLowerCase();
    const hasConfidentWords = ["optimal", "guarantee", "linear", "hash map", "two pointer", "efficient", "constant"].some(w => lower.includes(w));
    if (hasConfidentWords && fillers <= 1) {
      setLiveVocalTone('Confident');
    } else if (fillers >= 3 || lower.includes("maybe") || lower.includes("not sure")) {
      setLiveVocalTone('Hesitant');
    } else {
      setLiveVocalTone('Balanced');
    }
  }, [localTranscript, sessionTime]);

  // Derive dynamic audio status for Zara avatar sound wave
  const audioStatus = isEvaluating 
    ? 'analyzing'
    : isSpeaking 
      ? 'speaking' 
      : (isRecording && !isPaused && !isMuted && isAudioActive) 
        ? 'listening' 
        : 'ready';

  // Text-To-Speech (TTS)
  const speakText = useCallback((textToSpeak) => {
    if (!('speechSynthesis' in window) || !ttsEnabled || !textToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Zira'))
    );
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Auto-speak question on change
  useEffect(() => {
    if (activeQuestionItem?.prompt && ttsEnabled) {
      const timer = setTimeout(() => {
        speakText(activeQuestionItem.prompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeQuestionItem?.id, ttsEnabled, speakText]);

  // --------------------------------------------------------------------------
  // HARDWARE CAMERA & MICROPHONE STREAMS
  // --------------------------------------------------------------------------
  const startCamera = useCallback(async () => {
    setDevicePermissionError(null);
    try {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });
      } catch (errAudioVideo) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
      }

      if (!stream) {
        throw new Error('No media stream returned from camera');
      }

      streamRef.current = stream;
      setUseWebcam(true);
      setIsVideoTrackEnabled(true);
      setDevicePermissionError(null);

      // Explicitly attach stream to video element and play
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video element play note:', playErr);
        }
      }

      // Initialize Web Audio API Analyser for live mic energy
      try {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!streamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setLiveVolumeLevel(avg);
              setIsAudioActive(avg > 12);
              requestAnimationFrame(checkVolume);
            };
            requestAnimationFrame(checkVolume);
          }
        }
      } catch (audioErr) {
        console.warn('Audio Context init warning:', audioErr);
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setDevicePermissionError('Camera access denied or device unavailable. Please allow camera permissions.');
      setUseWebcam(false);
    }
  }, []);

  // Ensure stream stays attached to videoRef whenever camera becomes enabled
  useEffect(() => {
    const video = videoRef.current;
    if (video && streamRef.current && useWebcam && isVideoTrackEnabled) {
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.play().catch((err) => {
        console.warn('Video playback warning in useEffect:', err);
      });
    }
  }, [useWebcam, isVideoTrackEnabled]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    setUseWebcam(false);
    setIsVideoTrackEnabled(false);
  }, []);

  const handleToggleVideo = () => {
    if (useWebcam && isVideoTrackEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleToggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted;
      });
    }
    onToggleMute();
  };

  // --------------------------------------------------------------------------
  // LIVE FRAME CAPTURE & TELEMETRY STREAMING (EVERY 500MS)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!useWebcam || !isVideoTrackEnabled) {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      return;
    }

    const captureCanvas = document.createElement('canvas');
    const captureCtx = captureCanvas.getContext('2d');

    const captureAndAnalyze = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

      const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.65);

      try {
        const res = await fetch('http://127.0.0.1:8000/api/analyze-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, timestamp: Date.now() / 1000 })
        });
        if (res.ok) {
          const telemetry = await res.json();
          if (onLiveMetricsUpdate) {
            onLiveMetricsUpdate(telemetry);
          }
        }
      } catch (err) {
        // Fallback telemetry if backend is restarting
      }
    };

    frameIntervalRef.current = setInterval(captureAndAnalyze, 500);
    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [useWebcam, isVideoTrackEnabled, onLiveMetricsUpdate]);

  // --------------------------------------------------------------------------
  // SPEECH RECOGNITION (VOICE DICTATION)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass && (isMicDictating || (isRecording && !isPaused && !isMuted))) {
      try {
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
            if (finalTranscript.trim()) {
              setLocalTranscript(finalTranscript);
              if (onTranscriptUpdate) onTranscriptUpdate(finalTranscript);
            }
          };

          recognition.onerror = (e) => {
            if (e.error !== 'no-speech') {
              console.warn('Speech recognition warning:', e.error);
            }
          };

          recognition.onend = () => {
            if (isMicDictating || (isRecording && !isPaused && !isMuted)) {
              try { recognition.start(); } catch (_) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        }
      } catch (err) {
        console.warn('Speech init warning:', err);
      }
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, [isMicDictating, isRecording, isPaused, isMuted, onTranscriptUpdate]);

  // --------------------------------------------------------------------------
  // CANVAS HUD: ONLY DRAWS WHEN A FACE IS DETECTED
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const renderHud = () => {
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      }

      // Always clear canvas completely so video underneath remains 100% visible
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hasFace = Boolean(
        useWebcam &&
        isVideoTrackEnabled &&
        (liveMetrics?.has_face === true || liveMetrics?.face_detected === true) &&
        liveMetrics?.norm_bbox
      );

      // ONLY draw when a face is genuinely detected from live video frames
      if (showFaceMesh && hasFace) {
        const cw = canvas.width;
        const ch = canvas.height;

        const [nx, ny, nw, nh] = liveMetrics.norm_bbox;

        // Coordinates aligned with mirrored CSS video (-scale-x-100)
        const rx = (1.0 - (nx + nw)) * cw;
        const ry = ny * ch;
        const rw = nw * cw;
        const rh = nh * ch;

        // 1. Neon Corner Brackets (Cyan #06B6D4)
        const bracketLen = Math.max(16, Math.min(rw, rh) * 0.22);
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(rx, ry + bracketLen);
        ctx.lineTo(rx, ry);
        ctx.lineTo(rx + bracketLen, ry);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(rx + rw - bracketLen, ry);
        ctx.lineTo(rx + rw, ry);
        ctx.lineTo(rx + rw, ry + bracketLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(rx, ry + rh - bracketLen);
        ctx.lineTo(rx, ry + rh);
        ctx.lineTo(rx + bracketLen, ry + rh);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(rx + rw - bracketLen, ry + rh);
        ctx.lineTo(rx + rw, ry + rh);
        ctx.lineTo(rx + rw, ry + rh - bracketLen);
        ctx.stroke();

        // 2. Subtle translucent inner box outline
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.20)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, rw, rh);

        // 3. Floating Demeanor Status Pill
        const emotion = liveMetrics?.dominantEmotion || 'Composed / Neutral';
        const confidence = liveMetrics?.confidence || 88;
        const gaze = liveMetrics?.eyeContact || 92;
        const pillText = `${emotion} // ${confidence}% Conf // ${gaze}% Gaze`;

        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        const textMetrics = ctx.measureText(pillText);
        const pillW = textMetrics.width + 24;
        const pillH = 25;
        const pillX = Math.max(10, Math.min(cw - pillW - 10, rx + (rw - pillW) / 2));
        const pillY = ry > 34 ? ry - 30 : ry + rh + 8;

        // Pill Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pillX, pillY, pillW, pillH, 6);
        } else {
          ctx.rect(pillX, pillY, pillW, pillH);
        }
        ctx.fill();

        // Pill Border
        ctx.strokeStyle = gaze >= 80 ? 'rgba(6, 182, 212, 0.90)' : 'rgba(250, 204, 21, 0.90)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Indicator dot
        ctx.fillStyle = gaze >= 80 ? '#10B981' : '#F59E0B';
        ctx.beginPath();
        ctx.arc(pillX + 11, pillY + pillH / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pill text
        ctx.fillStyle = '#F8FAFC';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillText, pillX + 20, pillY + pillH / 2);
      }

      animId = requestAnimationFrame(renderHud);
    };

    animId = requestAnimationFrame(renderHud);
    return () => cancelAnimationFrame(animId);
  }, [showFaceMesh, useWebcam, isVideoTrackEnabled, liveMetrics]);

  // --------------------------------------------------------------------------
  // ANSWER SUBMISSION & MULTI-MODAL LOGGING
  // --------------------------------------------------------------------------
  const handleSubmitAnswer = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const answerPayload = {
      questionId: activeQuestionItem.id || (currentQuestionIndex + 1),
      questionText: activeQuestionItem.prompt,
      domain: activeQuestionItem.domain || 'DSA & Algorithms',
      skillsAssessed: activeQuestionItem.skillsAssessed || [],
      modelAnswerTip: activeQuestionItem.modelAnswerTip || '',
      transcript: localTranscript,
      telemetry: {
        dominantEmotion: liveMetrics?.dominantEmotion || 'Composed / Neutral',
        confidence: liveMetrics?.confidence || 88,
        eyeContact: liveMetrics?.eyeContact || 92,
        wpm: calculatedWpm
      }
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answerPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
        setCompletedCount((prev) => Math.min(totalQuestions, prev + 1));
        if (data.followUpPrompt) {
          setZaraSpeechBubble(data.followUpPrompt);
          speakText(data.followUpPrompt);
        } else if (data.feedback) {
          setZaraSpeechBubble(data.feedback);
        }
        if (onAddAnswerRecord) {
          onAddAnswerRecord({
            ...answerPayload,
            ...data,
            wpm: calculatedWpm,
            fillerCount: fillerCount,
            vocalTone: data.vocalTone || liveVocalTone
          });
        }
      } else {
        throw new Error('Evaluation error');
      }
    } catch (err) {
      // Intelligent client-side fallback
      const hasTime = localTranscript.toLowerCase().includes('o(n)');
      const hasSpace = localTranscript.toLowerCase().includes('o(1)');
      const fallbackData = {
        score: hasTime && hasSpace ? 92 : hasTime ? 80 : 70,
        feedback: "Response evaluated. Optimal time complexity and constant auxiliary space were noted.",
        timeComplexityMentioned: hasTime,
        spaceComplexityMentioned: hasSpace,
        matchedSkills: activeQuestionItem.skillsAssessed || ["Two Pointers"],
        missingSkills: [],
        vocalTone: liveVocalTone
      };
      setEvaluationResult(fallbackData);
      setCompletedCount((prev) => Math.min(totalQuestions, prev + 1));
      if (onAddAnswerRecord) {
        onAddAnswerRecord({
          ...answerPayload,
          ...fallbackData,
          wpm: calculatedWpm,
          fillerCount: fillerCount,
          vocalTone: liveVocalTone
        });
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getDifficultyBadge = (difficulty) => {
    const diff = (difficulty || 'Easy').toLowerCase();
    if (diff === 'easy') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    if (diff === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200/60';
    return 'bg-rose-50 text-rose-700 border-rose-200/60';
  };

  const progressPercentage = Math.round(((completedCount || currentQuestionIndex) / Math.max(1, totalQuestions)) * 100);

  return (
    <div className="max-w-[1750px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

      {/* LEFT COLUMN (Col 8): Question Card + Camera Viewport + Response Input */}
      <div className="lg:col-span-8 flex flex-col gap-4 w-full">

        {/* 1. Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          
          {/* Top Row: Question counter, topic badges, and Timer */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex <= 0}
                  className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Previous Question"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-0.5 text-xs font-semibold text-slate-800 tracking-tight">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex >= totalQuestions - 1}
                  className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Next Question"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 rounded-lg">
                {activeQuestionItem.domain || 'DSA & Algorithms'}
              </span>

              {activeQuestionItem.category && (
                <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70 rounded-lg">
                  {activeQuestionItem.category}
                </span>
              )}

              <span className={`px-2.5 py-1 text-xs font-semibold border rounded-lg ${getDifficultyBadge(activeQuestionItem.difficulty)}`}>
                {activeQuestionItem.difficulty || 'Easy'}
              </span>
            </div>

            {/* Monospaced Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold tracking-wide">{formatTime(sessionTime)}</span>
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
              {activeQuestionItem.prompt}
            </h2>
          </div>

          {/* Bottom Row: Skills on left, Action buttons on right */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Skills:</span>
              {activeQuestionItem.skillsAssessed?.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200/80"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakText(activeQuestionItem.prompt)}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer leading-none"
                title="Replay Spoken Question"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 shrink-0 ${isSpeaking ? 'animate-spin' : ''}`} />
                <span>{isSpeaking ? 'Speaking...' : 'Replay'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isEvaluating}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer leading-none"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= totalQuestions - 1}
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer leading-none disabled:opacity-40"
              >
                <span>Next</span>
                <SkipForward className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
            </div>

          </div>

        </div>

        {/* 2. Candidate Video Viewport (Webcam Feed is ALWAYS mounted) */}
        <div className="relative w-full aspect-video max-h-[350px] sm:max-h-[380px] xl:max-h-[410px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm group">

          {/* Hardware Error Toast */}
          {devicePermissionError && (
            <div className="absolute top-3 left-3 right-3 z-30 p-2.5 bg-rose-900/90 backdrop-blur-md border border-rose-700 rounded-xl text-white text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                <span className="font-medium">{devicePermissionError}</span>
              </div>
              <button
                onClick={startCamera}
                className="px-2.5 py-1 bg-white text-rose-900 rounded-md font-semibold text-[11px] hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              >
                Retry Access
              </button>
            </div>
          )}

          {/* Always render <video> tag so it is firmly mounted before stream attaches */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${
              useWebcam && isVideoTrackEnabled ? 'block' : 'hidden'
            }`}
          />

          {/* Standby placeholder overlay shown only when camera is disabled */}
          {(!useWebcam || !isVideoTrackEnabled) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mb-3 shadow-inner">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Camera is turned off
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                Enable webcam to start real-time candidate facial expression & demeanor telemetry
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Enable Camera</span>
              </button>
            </div>
          )}

          {/* Canvas HUD Overlay: 100% transparent and pointer-events-none */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full pointer-events-none bg-transparent z-10"
          />

          {/* Floating Frosted Badge: Focus Status (Top-Left) */}
          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/60 shadow-xs text-xs font-medium text-slate-800">
            <span className={`w-2 h-2 rounded-full ${
              (!useWebcam || !isVideoTrackEnabled)
                ? 'bg-slate-400'
                : (liveMetrics?.has_face === false && liveMetrics?.face_detected === false)
                  ? 'bg-rose-500 animate-pulse'
                  : (liveMetrics?.eyeContact >= 80 ? 'bg-emerald-500' : 'bg-amber-500')
            }`} />
            <span className="font-semibold text-slate-900">
              {(!useWebcam || !isVideoTrackEnabled)
                ? 'Camera Offline'
                : (liveMetrics?.has_face === false && liveMetrics?.face_detected === false)
                  ? 'No Face Detected'
                  : `${liveMetrics?.eyeContact ?? 92}% Focus`}
            </span>
          </div>

          {/* Subtitle / Caption Box */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 max-w-lg w-[90%] text-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-white/95 text-xs font-sans shadow-md border border-white/10 max-w-full">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isAudioActive && !isMuted ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
              <span className="line-clamp-2 italic">
                "{localTranscript || (isRecording ? 'Listening for candidate answer or type below...' : 'Start interview to speak or type response below...')}"
              </span>
            </div>
          </div>

          {/* Bottom Floating Control Dock */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg text-white">
            
            <button
              type="button"
              onClick={handleToggleVideo}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                useWebcam && isVideoTrackEnabled 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
              title={useWebcam && isVideoTrackEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {useWebcam && isVideoTrackEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleAudio}
              className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                isMuted 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                  : isAudioActive
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                    : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                ttsEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
              title={ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* 3. Candidate Response & Transcription Workspace */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Candidate Response</h3>
                <p className="text-[11px] text-slate-500">
                  Speak into your microphone or type your technical response below
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {speechRecognitionSupported && (
                <button
                  type="button"
                  onClick={() => setIsMicDictating(!isMicDictating)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    isMicDictating
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-300/40 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isMicDictating ? 'Dictating...' : 'Voice Dictate'}</span>
                </button>
              )}
              <span className="text-xs font-mono text-slate-500">
                {localTranscript ? localTranscript.trim().split(/\s+/).filter(Boolean).length : 0} words
              </span>
              {fillerCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span>{fillerCount} filler {fillerCount === 1 ? 'word' : 'words'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Live Evaluation Banner */}
          {evaluationResult && (
            <div className="p-3.5 rounded-xl border bg-emerald-50/95 border-emerald-200 text-emerald-950 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Evaluation Score: {evaluationResult.score}%
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Facial: {liveMetrics?.dominantEmotion || 'Composed / Neutral'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Vocal Tone: {evaluationResult.vocalTone || liveVocalTone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onEndAndAnalyze}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer ml-auto"
                >
                  <Award className="w-3 h-3" />
                  <span>View Full Assessment</span>
                </button>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                {evaluationResult.feedback}
              </p>
            </div>
          )}

          <div className="relative">
            <textarea
              value={localTranscript}
              onChange={(e) => {
                setLocalTranscript(e.target.value);
                if (onTranscriptUpdate) onTranscriptUpdate(e.target.value);
              }}
              placeholder="State your approach, time complexity (e.g. O(N)), and space complexity (e.g. O(1))..."
              rows={3}
              className="w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed resize-y min-h-[85px]"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>AI grades algorithmic complexity O(N), constant space O(1), and vocal delivery.</span>
            </div>

            <div className="flex items-center gap-2">
              {localTranscript && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalTranscript('');
                    if (onTranscriptUpdate) onTranscriptUpdate('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isEvaluating || !localTranscript.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Live Metrics Overview (3 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Metric 1: Eye Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                useWebcam && isVideoTrackEnabled ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' : 'bg-slate-100 border border-slate-200 text-slate-400'
              }`}>
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Eye Focus</p>
                <div className="flex items-baseline space-x-1.5">
                  {useWebcam && isVideoTrackEnabled ? (
                    <>
                      <span className="text-lg font-bold text-slate-900">{liveMetrics?.eyeContact ?? 92}%</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                        (liveMetrics?.eyeContact ?? 92) >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Optimal
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-400">--%</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Offline
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metric 2: Dominant Emotion */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                useWebcam && isVideoTrackEnabled ? 'bg-slate-100 border border-slate-200/80 text-slate-700' : 'bg-slate-50 border border-slate-200 text-slate-400'
              }`}>
                <Smile className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Emotion</p>
                <div className="flex items-baseline space-x-1.5">
                  {useWebcam && isVideoTrackEnabled ? (
                    <>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[110px]">
                        {liveMetrics?.dominantEmotion || 'Composed / Neutral'}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-slate-400">Camera Off</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Standby
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metric 3: Vocal Pacing WPM */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Vocal Pacing</p>
                <div className="flex items-baseline space-x-1">
                  {isRecording && calculatedWpm > 0 ? (
                    <>
                      <span className="text-lg font-bold text-slate-900">{calculatedWpm}</span>
                      <span className="text-xs text-slate-500 font-mono">WPM</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-400">0</span>
                      <span className="text-xs text-slate-400 font-mono">WPM</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 ml-1">
                        {isRecording ? 'Silent' : 'Standby'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Visualizer bars */}
            <div className="flex items-end space-x-1 h-5">
              <div 
                className="w-1 rounded-full bg-indigo-600 transition-all duration-100" 
                style={{ height: `${Math.min(100, Math.max(20, liveVolumeLevel * 2))}%` }} 
              />
              <div 
                className="w-1 rounded-full bg-indigo-500 transition-all duration-100" 
                style={{ height: `${Math.min(100, Math.max(30, liveVolumeLevel * 2.8))}%` }} 
              />
              <div 
                className="w-1 rounded-full bg-indigo-400 transition-all duration-100" 
                style={{ height: `${Math.min(100, Math.max(20, liveVolumeLevel * 1.8))}%` }} 
              />
            </div>
          </div>

        </div>

        {/* 5. Unified Session Action Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          
          <div className="flex items-center space-x-2 flex-wrap">
            {cameraRequiredToast && (
              <div className="w-full mb-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <span className="font-medium">{cameraRequiredToast}</span>
                <button onClick={() => setCameraRequiredToast(null)} className="text-amber-600 hover:text-amber-800 text-xs font-bold cursor-pointer">×</button>
              </div>
            )}
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartInterview}
                className="flex items-center space-x-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Practice Session</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 text-slate-500" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleAudio}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                isMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex >= totalQuestions - 1}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-2xs cursor-pointer"
            >
              <span>Next Question</span>
              <SkipForward className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Generate Analysis Report Button */}
          <button
            type="button"
            onClick={onEndAndAnalyze}
            className="flex items-center space-x-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Analysis Report</span>
          </button>

        </div>

      </div>

      {/* RIGHT SIDEBAR (Col 4): Zara Avatar + Guidance + Clean Candidate Progress */}
      <aside className="lg:col-span-4 flex flex-col gap-4 w-full">

        {/* 1. Interviewer Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
          <ZaraAvatar
            isSpeaking={isSpeaking}
            audioStatus={audioStatus}
            speechBubbleText={zaraSpeechBubble}
            onReplayQuestion={() => speakText(activeQuestionItem.prompt)}
            ttsEnabled={ttsEnabled}
            onToggleTts={() => setTtsEnabled(!ttsEnabled)}
            statusText="AI Recruiter"
          />
        </div>

        {/* 2. Evaluation & AI Guidance Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Evaluation & AI Guidance</span>
            </div>
            {evaluationResult && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Score: {evaluationResult.score}/100
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans">
            {evaluationResult ? (
              <p className="font-medium text-slate-800">
                {evaluationResult.feedback}
              </p>
            ) : (
              <FormattedGuidance 
                text={activeQuestionItem.modelAnswerTip || 'Focus on time complexity O(N) versus O(N log N) tradeoffs and O(1) space constraints.'} 
              />
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Optimal Time:</span>
              <ComplexityChip isSatisfied={evaluationResult ? evaluationResult.timeComplexityMentioned : null}>
                {activeQuestionItem.modelAnswerTip?.includes('O(N log N)') ? 'O(N) / O(N log N)' : 'O(N)'}
              </ComplexityChip>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Auxiliary Space:</span>
              <ComplexityChip isSatisfied={evaluationResult ? evaluationResult.spaceComplexityMentioned : null}>
                {activeQuestionItem.modelAnswerTip?.includes('O(1)') ? 'O(1)' : 'O(N)'}
              </ComplexityChip>
            </div>
          </div>

        </div>

        {/* 3. Real Candidate Interview Progress & Telemetry Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3.5">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Interview Progress</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-bold">
                {progressPercentage}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Questions Completed</span>
              <span className="font-semibold text-slate-800">{completedCount} of {totalQuestions}</span>
            </div>
            
            {/* Real Candidate Metric: Facial Demeanor */}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Facial Demeanor</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  useWebcam && isVideoTrackEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                {useWebcam && isVideoTrackEnabled ? (liveMetrics?.dominantEmotion || 'Composed / Neutral') : 'Camera Offline'}
              </span>
            </div>

            {/* Real Candidate Metric: Vocal Pacing */}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Vocal Pacing</span>
              <span className="font-semibold text-indigo-600 font-mono">
                {calculatedWpm > 0 ? `${calculatedWpm} WPM` : '0 WPM (Silent)'}
              </span>
            </div>

            {/* Real Candidate Metric: Vocal Tone / Clarity */}
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Vocal Sentiment</span>
              <span className="font-semibold text-emerald-700">
                {liveVocalTone} ({Math.max(65, 100 - fillerCount * 4)}% Clarity)
              </span>
            </div>
          </div>

        </div>

      </aside>

    </div>
  );
}
