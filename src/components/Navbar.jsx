import React, { useState } from 'react';
import { 
  Video, 
  Terminal, 
  BarChart3, 
  BookOpen, 
  FileText, 
  Award, 
  Bot, 
  LogOut, 
  ChevronDown
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  connectionMode,
  setConnectionMode,
  wsStatus,
  liveMetrics,
  onOpenDevModal,
  isRecording,
  user,
  onLogout
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  // Primary navigation options for the unified segmented pill control
  const primaryTabs = [
    { id: 'interview', label: 'Practice Room', icon: Video },
    { id: 'coding', label: 'Live Coding', icon: Terminal },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Secondary tabs tucked into a subtle "More" menu
  const secondaryTabs = [
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'report', label: 'Diagnostic Report', icon: Award },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1750px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Far Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base tracking-tight text-slate-900">
                TalentPulse <span className="text-indigo-600">AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                v3.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              AI Mock Interview & Technical Assessment
            </p>
          </div>
        </div>

        {/* Center: Unified, Subtle Segmented Pill Control */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'interview' && isRecording && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}

          {/* Subtle More Menu for Question Bank, Resume, and Report */}
          <div className="relative">
            <button
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isSecondaryActive
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{isSecondaryActive ? secondaryTabs.find((t) => t.id === activeTab)?.label : 'More'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {moreDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-lg p-1 z-50 animate-fadeIn">
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMoreDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                        isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Far Right: User Profile Avatar / Name with Clean Typography */}
        <div className="flex items-center space-x-3 shrink-0">
          {user && (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-800 cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  {user.avatarInitials || 'AL'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-slate-900 truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    {user.role || 'Candidate'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-2 z-50 animate-fadeIn">
                  <div className="px-2 py-1.5 border-b border-slate-100 pb-2">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {user.role}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                        {user.seniority}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
