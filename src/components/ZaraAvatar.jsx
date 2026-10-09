import React, { useState, useEffect, useRef } from 'react';
import { Bot, Volume2, VolumeX, RotateCcw, Sparkles, MessageSquare } from 'lucide-react';

export default function ZaraAvatar({ 
  isSpeaking = false, 
  audioStatus = 'ready', // 'speaking' | 'listening' | 'analyzing' | 'ready'
  speechBubbleText = null,
  onReplayQuestion,
  ttsEnabled = true,
  onToggleTts,
  statusText = 'AI Recruiter'
}) {
  const [viseme, setViseme] = useState('rest'); // 'rest' | 'open_wide' | 'open_round' | 'open_teeth' | 'closed'
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);

  const animFrameRef = useRef(null);

  // Dynamic Lip-Sync Oscillation bound to speech activity
  useEffect(() => {
    if (!isSpeaking) {
      setViseme('rest');
      setHeadTilt(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const visemeSequence = ['open_wide', 'open_teeth', 'open_round', 'closed', 'open_wide', 'open_teeth'];
    let lastTime = performance.now();
    let index = 0;

    const loop = (currentTime) => {
      if (currentTime - lastTime > 95) {
        index = (index + 1) % visemeSequence.length;
        setViseme(visemeSequence[index]);
        setHeadTilt(Math.sin(currentTime * 0.005) * 1.5);
        lastTime = currentTime;
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking]);

  // Natural Eye Blinking Logic
  useEffect(() => {
    let blinkTimer;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 3000 + 2500;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  // SVG Mouth Paths per Viseme
  const renderMouth = () => {
    switch (viseme) {
      case 'open_wide':
        return (
          <g>
            <path d="M 86 128 Q 100 144 114 128 Q 100 134 86 128 Z" fill="#881337" stroke="#BE123C" strokeWidth="1.5" />
            <path d="M 90 129 Q 100 132 110 129 L 108 132 Q 100 134 92 132 Z" fill="#FFFFFF" />
            <path d="M 94 139 Q 100 135 106 139 Q 100 143 94 139 Z" fill="#FB7185" />
          </g>
        );
      case 'open_round':
        return (
          <g>
            <ellipse cx="100" cy="130" rx="9" ry="8" fill="#881337" stroke="#BE123C" strokeWidth="1.5" />
            <ellipse cx="100" cy="131" rx="5" ry="4" fill="#4C0519" />
          </g>
        );
      case 'open_teeth':
        return (
          <g>
            <path d="M 84 128 Q 100 138 116 128 Q 100 134 84 128 Z" fill="#881337" stroke="#BE123C" strokeWidth="1.5" />
            <rect x="88" y="129" width="24" height="4" rx="2" fill="#FFFFFF" />
          </g>
        );
      case 'closed':
        return (
          <path d="M 88 129 Q 100 132 112 129" fill="none" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
        );
      case 'rest':
      default:
        return (
          <g>
            <path d="M 86 127 Q 100 133 114 127" fill="none" stroke="#BE123C" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="85" cy="126" r="1" fill="#BE123C" />
            <circle cx="115" cy="126" r="1" fill="#BE123C" />
          </g>
        );
    }
  };

  // Derive dynamic state
  const currentStatus = audioStatus === 'analyzing'
    ? 'analyzing'
    : isSpeaking
      ? 'speaking'
      : (audioStatus || 'ready');

  return (
    <div className="flex flex-col items-center justify-center text-center select-none w-full">
      
      {/* Clean Avatar Container with Online Status Indicator */}
      <div className="relative pt-1">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-1 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-200">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
            
            {/* 2D Vector SVG AI Recruiter "Zara" */}
            <svg 
              viewBox="0 0 200 200" 
              className="w-full h-full transform transition-transform duration-100"
              style={{ transform: `rotate(${headTilt}deg)` }}
            >
              <defs>
                <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1E1B4B" />
                  <stop offset="50%" stopColor="#312E81" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>

                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFEDD5" />
                  <stop offset="100%" stopColor="#FED7AA" />
                </linearGradient>

                <linearGradient id="suitGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                <radialGradient id="blush">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Back Hair Volume */}
              <ellipse cx="100" cy="95" rx="46" ry="48" fill="url(#hairGrad)" />

              {/* Neck */}
              <path d="M 90 135 L 90 160 L 110 160 L 110 135 Z" fill="#FDBA74" />

              {/* Suit / Shoulders */}
              <path d="M 50 200 L 70 155 L 90 160 L 110 160 L 130 155 L 150 200 Z" fill="url(#suitGrad)" />
              <polygon points="90,160 100,180 110,160 100,168" fill="#FFFFFF" />
              <polygon points="100,180 97,200 103,200" fill="#0284C7" />

              {/* Face Shape */}
              <path 
                d="M 68 85 C 68 55, 132 55, 132 85 C 132 120, 118 145, 100 145 C 82 145, 68 120, 68 85 Z" 
                fill="url(#skinGrad)" 
              />

              {/* Cheeks Blush */}
              <circle cx="78" cy="115" r="8" fill="url(#blush)" />
              <circle cx="122" cy="115" r="8" fill="url(#blush)" />

              {/* Front Modern Hairstyle */}
              <path d="M 66 80 Q 85 50 134 70 Q 110 65 72 85 Z" fill="url(#hairGrad)" />
              <path d="M 66 80 Q 64 120 72 135 Q 68 110 70 85 Z" fill="url(#hairGrad)" />
              <path d="M 134 70 Q 136 120 128 135 Q 132 110 130 85 Z" fill="url(#hairGrad)" />

              {/* Eyebrows */}
              <path d="M 76 86 Q 84 82 92 85" fill="none" stroke="#312E81" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 108 85 Q 116 82 124 86" fill="none" stroke="#312E81" strokeWidth="2.2" strokeLinecap="round" />

              {/* Eyes & Blinking Animation */}
              {isBlinking ? (
                <g>
                  <path d="M 76 98 Q 84 104 92 98" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M 108 98 Q 116 104 124 98" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  {/* Left Eye */}
                  <ellipse cx="84" cy="98" rx="6.5" ry="6" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                  <circle cx="84" cy="98" r="4" fill="#0369A1" />
                  <circle cx="84" cy="98" r="2.2" fill="#0F172A" />
                  <circle cx="82.5" cy="96" r="1.5" fill="#FFFFFF" />

                  {/* Right Eye */}
                  <ellipse cx="116" cy="98" rx="6.5" ry="6" fill="#FFFFFF" stroke="#334155" strokeWidth="0.8" />
                  <circle cx="116" cy="98" r="4" fill="#0369A1" />
                  <circle cx="116" cy="98" r="2.2" fill="#0F172A" />
                  <circle cx="114.5" cy="96" r="1.5" fill="#FFFFFF" />

                  {/* Eyelashes */}
                  <path d="M 77 94 Q 84 91 92 94" fill="none" stroke="#0F172A" strokeWidth="1.5" />
                  <path d="M 108 94 Q 116 91 123 94" fill="none" stroke="#0F172A" strokeWidth="1.5" />
                </g>
              )}

              {/* Nose */}
              <path d="M 100 102 L 98 116 L 102 116" fill="none" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" />

              {/* Lip-Synced Mouth */}
              {renderMouth()}

              {/* Headset Earpiece */}
              <g>
                <path d="M 68 95 Q 64 95 62 105 Q 60 115 65 125" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 64 120 Q 72 135 84 135" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="84" cy="135" r="2.5" fill="#0F172A" />
                <circle cx="63" cy="105" r="3" fill={currentStatus === 'speaking' ? '#10B981' : currentStatus === 'listening' ? '#06B6D4' : currentStatus === 'analyzing' ? '#F59E0B' : '#6366F1'} />
              </g>
            </svg>

          </div>
        </div>

        {/* Online Status Indicator */}
        <span 
          className="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" 
          title="Interviewer Online"
        />
      </div>

      {/* Modernized Profile Info */}
      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-heading font-bold text-base text-slate-900 leading-tight">Zara</h3>
          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
            {statusText}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">Senior Technical Interviewer</p>
      </div>

      {/* Dynamic Sound Wave Indicator (Listening vs Speaking vs Analyzing vs Ready) */}
      <div className={`mt-3 inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 shadow-2xs ${
        currentStatus === 'speaking'
          ? 'bg-indigo-50 border-indigo-200/80 text-indigo-700'
          : currentStatus === 'listening'
            ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
            : currentStatus === 'analyzing'
              ? 'bg-amber-50 border-amber-200/80 text-amber-700 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-end gap-1 h-3.5">
          {currentStatus === 'speaking' ? (
            <>
              <span className="w-1 bg-indigo-600 rounded-full animate-wave-speak-1" />
              <span className="w-1 bg-indigo-600 rounded-full animate-wave-speak-2" />
              <span className="w-1 bg-indigo-600 rounded-full animate-wave-speak-3" />
              <span className="w-1 bg-indigo-600 rounded-full animate-wave-speak-4" />
              <span className="w-1 bg-indigo-600 rounded-full animate-wave-speak-5" />
            </>
          ) : currentStatus === 'listening' ? (
            <>
              <span className="w-1 bg-emerald-500 rounded-full animate-wave-listen-1" />
              <span className="w-1 bg-emerald-500 rounded-full animate-wave-listen-2" />
              <span className="w-1 bg-emerald-500 rounded-full animate-wave-listen-3" />
              <span className="w-1 bg-emerald-500 rounded-full animate-wave-listen-4" />
              <span className="w-1 bg-emerald-500 rounded-full animate-wave-listen-5" />
            </>
          ) : currentStatus === 'analyzing' ? (
            <>
              <span className="w-1 bg-amber-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0s' }} />
              <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 bg-amber-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: '0.3s' }} />
              <span className="w-1 bg-amber-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0.45s' }} />
            </>
          ) : (
            <>
              <span className="w-1 bg-slate-300 rounded-full h-1.5" />
              <span className="w-1 bg-slate-300 rounded-full h-2" />
              <span className="w-1 bg-slate-300 rounded-full h-2.5" />
              <span className="w-1 bg-slate-300 rounded-full h-2" />
              <span className="w-1 bg-slate-300 rounded-full h-1.5" />
            </>
          )}
        </div>
        <span className="text-[10px] font-semibold tracking-wide capitalize">
          {currentStatus === 'analyzing' ? 'Analyzing response...' : currentStatus}
        </span>
      </div>

      {/* Zara Speech Bubble / Follow-Up Prompt */}
      {speechBubbleText && (
        <div className="mt-3 w-full text-left bg-slate-50 border border-slate-200/90 rounded-xl p-3 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-indigo-700">
            <MessageSquare className="w-3 h-3" />
            <span>Zara's Follow-Up:</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            "{speechBubbleText}"
          </p>
        </div>
      )}

    </div>
  );
}
