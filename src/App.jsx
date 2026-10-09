import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import InterviewRoom from './components/InterviewRoom';
import CodingPlayground from './components/CodingPlayground';
import PerformanceDashboard from './components/PerformanceDashboard';
import QuestionBank from './components/QuestionBank';
import ResumeATSBuilder from './components/ResumeATSBuilder';
import DiagnosticReport from './components/DiagnosticReport';
import TelemetryPanel from './components/TelemetryPanel';
import DevWebSocketModal from './components/DevWebSocketModal';
import { useInterviewState } from './hooks/useInterviewState';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('talentpulse_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const {
    activeTab,
    setActiveTab,
    connectionMode,
    setConnectionMode,
    wsStatus,
    wsUrl,
    connectWebSocket,
    isRecording,
    isPaused,
    isMuted,
    toggleMute,
    countdown,
    sessionTime,
    questionBank,
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    selectQuestionAndStart,
    appendFollowUpQuestion,
    liveMetrics,
    telemetryHistory,
    anomalyLogs,
    transcript,
    setTranscript,
    resumeData,
    setResumeData,
    autoFixResumeWithAI,
    telemetryDrawerOpen,
    setTelemetryDrawerOpen,
    devModalOpen,
    setDevModalOpen,
    finalAssessment,
    startSession,
    pauseSession,
    nextQuestion,
    endAndAnalyze
  } = useInterviewState();

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('interview');
  };

  const handleLogout = () => {
    localStorage.removeItem('talentpulse_user');
    setUser(null);
  };

  // If user is not logged in, render the Light Glassmorphic Auth Page
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative selection:bg-indigo-500/15 selection:text-indigo-900 bg-subtle-grid">
      
      {/* Top Floating Frosted Glass Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionMode={connectionMode}
        setConnectionMode={setConnectionMode}
        wsStatus={wsStatus}
        liveMetrics={liveMetrics}
        onOpenDevModal={() => setDevModalOpen(true)}
        isRecording={isRecording}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Active Tab Page Container */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Page 1: Live Interview Room with AI Avatar & TTS */}
          {activeTab === 'interview' && (
            <InterviewRoom
              isRecording={isRecording}
              isPaused={isPaused}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              countdown={countdown}
              sessionTime={sessionTime}
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              liveMetrics={liveMetrics}
              transcript={transcript}
              onStart={startSession}
              onPause={pauseSession}
              onNext={nextQuestion}
              onEndAndAnalyze={endAndAnalyze}
              onOpenTelemetryDrawer={() => setTelemetryDrawerOpen((v) => !v)}
              onTranscriptUpdate={(newTxt) => setTranscript((prev) => prev ? `${prev} ${newTxt}` : newTxt)}
              onAppendFollowUpQuestion={appendFollowUpQuestion}
            />
          )}

          {/* Page 2: Integrated Live Coding Playground */}
          {activeTab === 'coding' && (
            <CodingPlayground />
          )}

          {/* Page 3: Performance & Telemetry Dashboard */}
          {activeTab === 'analytics' && (
            <PerformanceDashboard
              liveMetrics={liveMetrics}
              telemetryHistory={telemetryHistory}
              finalAssessment={finalAssessment}
            />
          )}

          {/* Page 4: Question Bank & Track Selector */}
          {activeTab === 'questions' && (
            <QuestionBank
              questionBank={questionBank}
              onSelectQuestion={selectQuestionAndStart}
            />
          )}

          {/* Page 5: AI Resume Builder & ATS Matcher */}
          {activeTab === 'resume' && (
            <ResumeATSBuilder
              resumeData={resumeData}
              setResumeData={setResumeData}
              onAutoFixResume={autoFixResumeWithAI}
            />
          )}

          {/* Page 6: Post-Interview Diagnostic Report */}
          {activeTab === 'report' && (
            <DiagnosticReport
              finalAssessment={finalAssessment}
              telemetryHistory={telemetryHistory}
              onRestartInterview={() => setActiveTab('interview')}
              onNavigateToQuestions={() => setActiveTab('questions')}
            />
          )}

        </div>

        {/* Collapsible Telemetry Drawer Panel for Live Telemetry */}
        {telemetryDrawerOpen && (
          <TelemetryPanel
            liveMetrics={liveMetrics}
            telemetryHistory={telemetryHistory}
            anomalyLogs={anomalyLogs}
            isOpen={telemetryDrawerOpen}
            onToggle={() => setTelemetryDrawerOpen((v) => !v)}
          />
        )}

      </main>

      {/* Developer WebSocket Integration Schema Modal */}
      <DevWebSocketModal
        isOpen={devModalOpen}
        onClose={() => setDevModalOpen(false)}
        wsUrl={wsUrl}
        wsStatus={wsStatus}
        onConnectWs={connectWebSocket}
      />

      {/* Subtle ambient gradient at the top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

    </div>
  );
}
