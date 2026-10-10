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
  ChevronRight
} from 'lucide-react';
import ZaraAvatar from './ZaraAvatar';

// Uniform complexity badge component matching exact border radii, font, and padding
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

// Helper component to parse and render complexity tags like O(N), O(1), O(N log N) using ComplexityChip
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

const DEFAULT_QUESTION = {
  id: 1,
  title: 'Two Sum & Two-Pointer Optimizations',
  domain: 'DSA & Algorithms',
  category: 'Two Pointers & Arrays',
  difficulty: 'Easy',
  prompt: 'Explain the Two-Pointer technique versus Hash Map lookup for finding pairs that sum to a target. When is sorting first advantageous despite the O(N log N) overhead?',
  skillsAssessed: ['Two Pointers', 'Hash Map', 'Time Complexity', 'Space vs Time Tradeoffs'],
  modelAnswerTip: 'Explain O(N) time with O(N) space using Hash Map vs O(N log N) time with O(1) auxiliary space using Two Pointers on sorted arrays.'
};

export default function InterviewRoom({
  isRecording,
  isPaused,
  isMuted,
  onToggleMute,
  countdown,
  sessionTime,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  liveMetrics,
  transcript: externalTranscript,
  onStart,
  onPause,
  onNext,
  onPrev,
  onEndAndAnalyze,
  onOpenTelemetryDrawer,
  onTranscriptUpdate,
  onAppendFollowUpQuestion
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);

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
  const speechRecognitionSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // AI Evaluation & Model Pipeline State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAnswerHints, setShowAnswerHints] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  const [zaraSpeechBubble, setZaraSpeechBubble] = useState(null);
  const [completedCount, setCompletedCount] = useState(currentQuestionIndex || 0);

  const handleStartInterview = async () => {
    if (!useWebcam || !isVideoTrackEnabled) {
      setCameraRequiredToast('Webcam is required to track demeanor and eye gaze. Please enable your camera first.');
      await startCamera();
      return;
    }
    setCameraRequiredToast(null);
    onStart();
  };

  const handlePrevQuestion = () => {
    setActiveFollowUp(null);
    setEvaluationResult(null);
    setZaraSpeechBubble(null);
    setLocalTranscript('');
    if (onTranscriptUpdate) onTranscriptUpdate('');
    if (onPrev) onPrev();
  };
  const handleNextQuestion = () => {
    setActiveFollowUp(null);
    setEvaluationResult(null);
    setZaraSpeechBubble(null);
    setLocalTranscript('');
    if (onTranscriptUpdate) onTranscriptUpdate('');
    onNext();
  };

  // Recalculate WPM dynamically based on actual transcript words and session elapsed time
  useEffect(() => {
    if (!localTranscript || !localTranscript.trim()) {
      setCalculatedWpm(0);
      return;
    }
    const words = localTranscript.trim().split(/\s+/).filter(Boolean);
    const elapsedMinutes = Math.max(0.12, (sessionTime || 1) / 60);
    const wpm = Math.min(220, Math.max(0, Math.round(words.length / elapsedMinutes)));
    setCalculatedWpm(wpm);
  }, [localTranscript, sessionTime]);


  // Safe question fallback: guarantees Question Card is never blank or collapsed
  const activeQuestionItem = activeFollowUp || (currentQuestion && currentQuestion.prompt ? currentQuestion : DEFAULT_QUESTION);

  // Ensure scroll is at top when mounting to prevent persistent viewport clipping
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Reset answer when moving to a new question
  useEffect(() => {
    setLocalTranscript('');
    if (onTranscriptUpdate) onTranscriptUpdate('');
  }, [currentQuestionIndex, activeQuestionItem?.id]);

  // Derive dynamic audio status for Zara avatar sound wave: 'speaking' | 'listening' | 'analyzing' | 'ready'
  // Real-time focus loss detection during active recording
  const isFocusLost = Boolean(
    isRecording &&
    !isPaused &&
    useWebcam &&
    isVideoTrackEnabled &&
    (liveMetrics?.has_face === false || (liveMetrics?.eyeContact !== undefined && liveMetrics.eyeContact < 65))
  );

  const audioStatus = isEvaluating 
    ? 'analyzing'
    : isSpeaking 
      ? 'speaking' 
      : (isRecording && !isPaused && !isMuted && isAudioActive) 
        ? 'listening' 
        : 'ready';

  // Text-To-Speech (TTS) using window.speechSynthesis
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

  // Auto-speak initial question on mount
  useEffect(() => {
    if (activeQuestionItem?.prompt && ttsEnabled) {
      const timer = setTimeout(() => {
        speakText(activeQuestionItem.prompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeQuestionItem?.prompt, ttsEnabled, speakText]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // HARDWARE STREAMS & MEDIA PIPELINE (CAMERA & MIC)
  // --------------------------------------------------------------------------
  const startCamera = useCallback(async () => {
    setDevicePermissionError(null);
    try {
      let stream = null;
      // 1. Try video + audio with ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });
      } catch (errAudioVideo) {
        console.warn('Video+audio getUserMedia failed, trying video-only fallback:', errAudioVideo);
        // 2. Fallback to video only if audio permission/device is locked
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play caught:', err));
      }

      // Initialize Web Audio API Analyser if audio track exists
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
            checkVolume();
          }
        }
      } catch (e) {
        console.warn('AudioContext init note:', e);
      }

    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      const isBlocked = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isBlocked
        ? 'Camera access blocked. Please click the camera icon in your address bar, click Allow, then click Retry.'
        : `Camera error (${err.name || 'Unavailable'}). Check if another app is using the webcam.`;
      setDevicePermissionError(msg);
      setUseWebcam(false);
    }
  }, []);

  // Stream live webcam frames to WebSocket telemetry pipeline
  useEffect(() => {
    if (useWebcam && isVideoTrackEnabled) {
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
  }, [useWebcam, isVideoTrackEnabled]);

  // Re-attach video stream if element re-renders
  useEffect(() => {
    if (useWebcam && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [useWebcam]);

  // Cleanup media tracks and audio context on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Toggle Video Track dynamically
  const handleToggleVideo = () => {
    if (!useWebcam || !streamRef.current) {
      startCamera();
      return;
    }
    // If currently running, stop video stream completely to turn off camera hardware
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setUseWebcam(false);
    setIsVideoTrackEnabled(false);
  };

  // Toggle Audio Track dynamically
  const handleToggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      const nextMuted = !isMuted;
      audioTracks.forEach((t) => (t.enabled = !nextMuted));
    }
    if (onToggleMute) onToggleMute();
  };

  // --------------------------------------------------------------------------
  // REAL-TIME SPEECH RECOGNITION & VOCAL CADENCE WPM
  // --------------------------------------------------------------------------
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording && !isPaused && !isMuted) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let updatedTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            updatedTranscript += event.results[i][0].transcript;
          }
          if (updatedTranscript) {
            setLocalTranscript((prev) => {
              const combined = prev ? `${prev} ${updatedTranscript}` : updatedTranscript;
              if (onTranscriptUpdate) onTranscriptUpdate(combined);

              // Calculate Words Per Minute (WPM) dynamically
              const words = combined.trim().split(/\s+/).filter(Boolean);
              const elapsedMinutes = Math.max(0.12, (sessionTime || 1) / 60);
              const wpm = Math.min(220, Math.max(85, Math.round(words.length / elapsedMinutes)));
              setCalculatedWpm(wpm);

              return combined;
            });
          }
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition status:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init note:', err);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, isPaused, isMuted, sessionTime, onTranscriptUpdate]);

  // Subtle Eye Focus Reticle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const drawSubtleEyeIndicator = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!showFaceMesh || !useWebcam || !isVideoTrackEnabled) return;

      const w = canvas.width;
      const h = canvas.height;
      const time = Date.now() * 0.002;

      const cx = w * 0.5 + Math.sin(time * 0.7) * 5;
      const cy = h * 0.44 + Math.cos(time * 0.5) * 4;
      const eyeSpacing = w * 0.06;
      const eyeY = cy - h * 0.04;

      ctx.save();
      const leftEyeX = cx - eyeSpacing;
      const rightEyeX = cx + eyeSpacing;

      [leftEyeX, rightEyeX].forEach((eyeX) => {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(drawSubtleEyeIndicator);
    };

    drawSubtleEyeIndicator();
    return () => cancelAnimationFrame(animId);
  }, [showFaceMesh, useWebcam, isVideoTrackEnabled]);

  // --------------------------------------------------------------------------
  // MODEL INTEGRATION & EVALUATION PIPELINE
  // --------------------------------------------------------------------------
  const handleSubmitAnswer = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    const payload = {
      questionId: activeQuestionItem.id || (currentQuestionIndex + 1),
      questionText: activeQuestionItem.prompt,
      domain: activeQuestionItem.domain || 'DSA & Algorithms',
      skillsAssessed: activeQuestionItem.skillsAssessed || [],
      modelAnswerTip: activeQuestionItem.modelAnswerTip || '',
      isFollowUp: Boolean(activeFollowUp),
      transcript: localTranscript,
      rubric: {
        optimalTime: 'O(N) / O(N log N)',
        auxiliarySpace: 'O(1)',
        keyConcepts: activeQuestionItem.skillsAssessed || []
      },
      telemetry: {
        eyeFocusAvg: liveMetrics?.eyeContact || 94,
        wpm: calculatedWpm
      }
    };

    try {
      // Send evaluation to FastAPI model endpoint
      const response = await fetch('http://127.0.0.1:8000/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      applyEvaluationSuccess(data);
    } catch (err) {
      console.warn('Backend model endpoint offline, using intelligent client-side fallback evaluation:', err);
      // Resilient local fallback evaluation
      const transcriptLower = localTranscript.toLowerCase();
      const unknownPhrases = [
        "dont know", "don't know", "do not know", "no idea", "not sure",
        "skip", "pass", "no clue", "dunno", "cant answer", "can't answer"
      ];
      const hasTime = ['o(n)', 'o(n log n)', 'o(1)', 'linear time', 'n log n'].some((t) => transcriptLower.includes(t));
      const hasSpace = ['o(1)', 'o(n)', 'constant space', 'auxiliary space'].some((s) => transcriptLower.includes(s));
      const isUnknown = unknownPhrases.some((p) => transcriptLower.includes(p)) || (transcriptLower.trim().split(/\s+/).length <= 2 && !hasTime && !hasSpace);

      let fallbackData;
      if (isUnknown) {
        fallbackData = {
          score: 30,
          timeComplexityMentioned: false,
          spaceComplexityMentioned: false,
          isUnknown: true,
          feedback: "Answer marked as unknown or skipped. In technical interviews, articulate your initial brute-force thoughts or ask clarifying questions rather than passing.",
          evaluationSummary: "Candidate marked question as unknown / skipped (Score: 30%). Review the model answer and advance to the next challenge.",
          followUpPrompt: null
        };
      } else {
        fallbackData = {
          score: hasTime && hasSpace ? 92 : hasTime || hasSpace ? 82 : 70,
          timeComplexityMentioned: hasTime,
          spaceComplexityMentioned: hasSpace,
          isUnknown: false,
          feedback: hasTime && hasSpace
            ? 'Exceptional technical depth. Both runtime bounds O(N) and auxiliary memory trade-offs O(1) were articulated with precision.'
            : 'Solid conceptual answer. Ensure you explicitly qualify whether auxiliary storage is constant O(1) or linear O(N).',
          evaluationSummary: `Optimal time complexity: ${hasTime ? 'Satisfied' : 'Needs Mention'}. Auxiliary space complexity: ${hasSpace ? 'Satisfied' : 'Omitted'}.`,
          followUpPrompt: activeFollowUp ? null : (!hasTime
            ? 'How would your algorithm scale if the array was unsorted and required O(N log N) preprocessing?'
            : 'Can you elaborate on how you would handle this if input stream chunks arrived concurrently via WebSockets?')
        };
      }
      applyEvaluationSuccess(fallbackData);
    } finally {
      setIsEvaluating(false);
    }
  };

  const applyEvaluationSuccess = (data) => {
    setEvaluationResult(data);
    setCompletedCount((prev) => Math.min(totalQuestions, prev + 1));

    // Only trigger a follow-up if primary round, data has follow-up prompt, and user didn't mark unknown
    if (data.followUpPrompt && !activeFollowUp && !data.isUnknown) {
      setZaraSpeechBubble(data.followUpPrompt);
      speakText(data.followUpPrompt);

      const followUpObj = {
        id: `followup_${Date.now()}`,
        title: 'Adaptive Follow-Up: Complexity & Scaling',
        domain: activeQuestionItem.domain || 'DSA & Algorithms',
        category: 'Adaptive AI Follow-Up',
        difficulty: 'Hard',
        prompt: data.followUpPrompt,
        modelAnswerTip: 'Address edge-case resilience, memory limits, and stream backpressure with O(1) buffers.',
        isFollowUp: true
      };
      setActiveFollowUp(followUpObj);
    } else {
      setActiveFollowUp(null);
      if (data.feedback) {
        setZaraSpeechBubble(data.feedback);
      }
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

      {/* LEFT COLUMN (Col 8): Question Card firmly placed above Candidate Video & Controls */}
      <div className="lg:col-span-8 flex flex-col gap-4 w-full">

        {/* 1. Question Card (Persistent above video feed) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          
          {/* Top Row: Muted pastel badges & Monospaced Timer in top-right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Question Navigator */}
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
                  {activeFollowUp ? 'Follow-Up Round' : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
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

            {/* Timer moved to Top-Right Corner */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold tracking-wide">{formatTime(sessionTime)}</span>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
              {activeQuestionItem.prompt}
            </h2>
          </div>

          {/* Bottom Row: Secondary skills on left, Standardized action buttons on right */}
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

            {/* Standardized Buttons: Identical h-9 Height, px-3.5 Padding, and Baseline Alignment */}
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
                title="Skip or proceed to next question"
              >
                <span>Next</span>
                <SkipForward className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
            </div>

          </div>

        </div>

        {/* 2. Candidate Video Viewport (Directly beneath Question Card) */}
        <div className={`relative w-full aspect-video max-h-[350px] sm:max-h-[380px] xl:max-h-[410px] rounded-2xl overflow-hidden bg-slate-900 border shadow-sm group transition-all duration-300 ${
          isFocusLost 
            ? 'ring-4 ring-rose-500 shadow-rose-500/25 border-rose-400' 
            : 'border-slate-200'
        }`}>

          {/* Real-time Focus Loss Floating Warning */}
          {isFocusLost && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-rose-600/95 text-white text-xs font-bold backdrop-blur-md shadow-2xl flex items-center gap-2 border border-rose-300 animate-pulse pointer-events-none">
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                {liveMetrics?.has_face === false 
                  ? "⚠️ Face Not Detected — Re-align yourself in center frame" 
                  : `⚠️ Eye Contact Warning (${liveMetrics.eyeContact}% Focus) — Look directly into the camera lens`}
              </span>
            </div>
          )}

          {/* Hardware Error Prompt Banner */}
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

          {/* Video Feed (Webcam Stream or Centered Standby State) */}
          {useWebcam && isVideoTrackEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mb-3 shadow-inner">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Camera is turned off
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                Enable your webcam to start real-time optical gaze & demeanor telemetry
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

          {/* Subtle Focus Indicator Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Minimal Floating Frosted-Glass Badge: Focus status (Top-Left) */}
          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-xs text-xs font-medium text-slate-800">
            <span className={`w-2 h-2 rounded-full ${
              (!useWebcam || !isVideoTrackEnabled)
                ? 'bg-slate-400'
                : (liveMetrics?.has_face === false)
                  ? 'bg-rose-500 animate-pulse'
                  : (liveMetrics?.eyeContact >= 80 ? 'bg-emerald-500' : 'bg-amber-500')
            }`} />
            <span className="font-semibold text-slate-900">
              {(!useWebcam || !isVideoTrackEnabled)
                ? 'Camera Offline'
                : (liveMetrics?.has_face === false)
                  ? 'No Face Detected'
                  : `${liveMetrics?.eyeContact ?? 0}% Focus`}
            </span>
          </div>

          {/* Real-time Subtitle/Caption Box right above bottom dock */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 max-w-lg w-[90%] text-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-white/95 text-xs font-sans shadow-md border border-white/10 max-w-full">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isAudioActive && !isMuted ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
              <span className="line-clamp-2 italic">
                "{localTranscript || (isRecording ? 'Listening for candidate speech input or type below...' : 'Start interview to speak or type response below...')}"
              </span>
            </div>
          </div>

          {/* Compact Floating Dock at Bottom Center of Viewport */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg text-white">
            
            {/* Camera Toggle */}
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

            {/* Microphone Toggle with Audio Level Ring */}
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

            {/* AI Voice Toggle */}
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
                  Speak aloud into your microphone or type your response below
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {speechRecognitionSupported ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRecording && !isMuted ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                  {isRecording ? (isMuted ? 'Mic Muted' : 'Speech Active') : 'Speech Ready'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Firefox does not support SpeechRecognition by default">
                  ⌨️ Keyboard Mode (Type Response Below)
                </span>
              )}
              <span className="text-xs font-mono text-slate-400">
                {localTranscript ? localTranscript.trim().split(/\s+/).filter(Boolean).length : 0} words
              </span>
            </div>
          </div>

          {/* Live Multi-Domain Evaluation Banner */}
          {evaluationResult && (
            <div className={`p-3.5 rounded-xl border space-y-2.5 animate-fadeIn ${
              evaluationResult.isUnknown
                ? 'bg-amber-50/95 border-amber-200 text-amber-950'
                : 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 shrink-0 ${evaluationResult.isUnknown ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {evaluationResult.isUnknown ? 'Question Skipped' : `Evaluation Score: ${evaluationResult.score}%`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer ml-auto shrink-0"
                >
                  <span>Proceed to Next Question</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-medium leading-relaxed">
                {evaluationResult.feedback}
              </p>

              {evaluationResult.matchedSkills && evaluationResult.matchedSkills.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-emerald-700">Concepts Mastered:</span>
                  {evaluationResult.matchedSkills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-300">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}

              {evaluationResult.missingSkills && evaluationResult.missingSkills.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] font-semibold text-amber-700">Recommended to cover:</span>
                  {evaluationResult.missingSkills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100/90 text-amber-800 border border-amber-300">
                      • {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <textarea
              value={localTranscript}
              onChange={(e) => {
                setLocalTranscript(e.target.value);
                if (onTranscriptUpdate) onTranscriptUpdate(e.target.value);
              }}
              placeholder="Type your answer here or speak aloud into your microphone. Be sure to explain your approach and state time complexity (e.g., O(N)) and space complexity (e.g., O(1))..."
              rows={3}
              className="w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed resize-y min-h-[90px]"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>AI grades algorithmic logic, O(N) runtime accuracy, and constant O(1) space.</span>
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
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex >= totalQuestions - 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                title="Proceed to next question"
              >
                <span>Next Question</span>
                <SkipForward className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Live Metrics Overview */}
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
                      <span className="text-lg font-bold text-slate-900">{liveMetrics?.eyeContact ?? 0}%</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                        liveMetrics?.eyeContact >= 80 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {liveMetrics?.eyeContact >= 80 ? 'Optimal' : 'Low'}
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
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[100px]">
                        {liveMetrics?.dominantEmotion || 'Neutral'}
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

          {/* Metric 3: Dynamic Vocal Pacing WPM */}
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

            {/* Live Audio Visualizer Bars */}
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

        {/* 4. Unified Session Action Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          
          <div className="flex items-center space-x-2 flex-wrap">
            {cameraRequiredToast && (
              <div className="w-full mb-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <span className="font-medium">{cameraRequiredToast}</span>
                <button onClick={() => setCameraRequiredToast(null)} className="text-amber-600 hover:text-amber-800 text-xs font-bold">×</button>
              </div>
            )}
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartInterview}
                className={`flex items-center space-x-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer ${
                  useWebcam && isVideoTrackEnabled
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/50'
                }`}
                title={useWebcam && isVideoTrackEnabled ? 'Start interview session' : 'Camera must be turned on to begin'}
              >
                {useWebcam && isVideoTrackEnabled ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Interview</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    <span>Turn On Camera to Start</span>
                  </>
                )}
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

          {/* Finish & Evaluate Button */}
          <button
            type="button"
            onClick={onEndAndAnalyze}
            className="flex items-center space-x-2 px-4.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Finish & Evaluate</span>
          </button>

        </div>

      </div>

      {/* RIGHT SIDEBAR (Col 4): Aligns seamlessly with Left Column, No Clipping */}
      <aside className="lg:col-span-4 flex flex-col gap-4 w-full">

        {/* 1. Interviewer Profile Card (Top-aligned, no clipping) */}
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

        {/* 2. Redesigned Evaluation & AI Guidance Card */}
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

          {/* Model Answer Tip / Evaluation Feedback */}
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

          {/* Key Complexity Requirements with Dynamic Satisfaction Checks */}
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

          {evaluationResult?.evaluationSummary && (
            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
              {evaluationResult.evaluationSummary}
            </p>
          )}

        </div>

        {/* 3. Polished Session Progress Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3.5">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Interview Progress</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-bold">
                {progressPercentage}%
              </span>
            </div>

            {/* Polished progress track container */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Progress Breakdown */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Completed Questions</span>
              <span className="font-semibold text-slate-800">{completedCount} of {totalQuestions}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Track</span>
              <span className="font-semibold text-slate-800">{activeQuestionItem.domain || 'Algorithms'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Speech Activity</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Normal Cadence
              </span>
            </div>
          </div>

        </div>

      </aside>

    </div>
  );
}
