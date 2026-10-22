import React, { useState } from 'react';
import { 
  Video, 
  Award, 
  Bot, 
  ChevronDown,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isRecording = false,
  dominantEmotion = 'Composed / Neutral',
  hasFace = true
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const tabs = [
    { id: 'interview', label: 'Practice Room', icon: Video },
    { id: 'report', label: 'Analysis Report', icon: Award }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-[1750px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base tracking-tight text-slate-900">
                TalentPulse <span className="text-indigo-600">AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md">
                v3.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Cognitive Demeanor Telemetry & Technical Assessment
            </p>
          </div>
        </div>

        {/* Center: Practice Room & Analysis Report Pill Selector */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'interview' && isRecording && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Live Session Active" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Far Right: Vaishnav Tardekar (Full-Stack) user badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-800 cursor-pointer border border-slate-200/80 bg-white shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                VT
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight text-slate-900 truncate max-w-[150px]">
                  Vaishnav Tardekar
                </span>
                <span className="text-[11px] text-indigo-600 font-medium leading-tight">
                  Full-Stack Engineer
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3.5 space-y-2.5 z-50 animate-fadeIn">
                <div className="px-1 py-1 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-slate-900">Vaishnav Tardekar</p>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">vaishnav.tardekar@academic.edu</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                      Full-Stack Track
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                      Senior Ready
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Interview Status:</span>
                    <span className="font-semibold text-emerald-600">Active Candidate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assessment Track:</span>
                    <span className="font-semibold text-slate-800">Full-Stack / DSA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Live Telemetry:</span>
                    <span className="font-semibold text-indigo-600">Facial & Vocal</span>
                  </div>
                </div>

                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full mt-2 py-1.5 text-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
