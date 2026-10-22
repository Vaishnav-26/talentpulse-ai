import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import InterviewRoom from './components/InterviewRoom';
import AnalysisReport from './components/AnalysisReport';
import questionsData from './data/questions.json';

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    title: 'Two Sum & Two-Pointer Optimizations',
    domain: 'DSA & Algorithms',
    category: 'Two Pointers & Arrays',
    difficulty: 'Easy',
    prompt: 'Explain the Two-Pointer technique versus Hash Map lookup for finding pairs that sum to a target. When is sorting first advantageous despite the O(N log N) overhead?',
    skillsAssessed: ['Two Pointers', 'Hash Map', 'Time Complexity', 'Space vs Time Tradeoffs'],
    modelAnswerTip: 'Explain O(N) time with O(N) space using Hash Map vs O(N log N) time with O(1) auxiliary space using Two Pointers on sorted arrays.'
  },
  {
    id: 2,
    title: 'LRU Cache Design & Big-O Complexity',
    domain: 'System Design',
    category: 'Data Structures & Caching',
    difficulty: 'Medium',
    prompt: 'How would you architect a Least Recently Used (LRU) Cache ensuring both get() and put() operations run in strict O(1) time? Why is a Doubly Linked List paired with a Hash Map?',
    skillsAssessed: ['Doubly Linked List', 'Hash Map', 'O(1) Eviction', 'Concurrency'],
    modelAnswerTip: 'Articulate pairing a Hash Map for O(1) lookups with a Doubly Linked List for O(1) node deletion and head insertion.'
  },
  {
    id: 3,
    title: 'Microservices & Idempotent API Architecture',
    domain: 'Full-Stack Architecture',
    category: 'Distributed Systems',
    difficulty: 'Hard',
    prompt: 'In high-throughput microservices, how do you prevent duplicate transaction processing when an HTTP request retries over an unstable network? Explain idempotency keys and transactional outbox patterns.',
    skillsAssessed: ['Idempotency Keys', 'Distributed Transactions', 'Outbox Pattern', 'At-Least-Once Delivery'],
    modelAnswerTip: 'Highlight unique client-generated Idempotency-Key headers, Redis deduplication with TTL, and DB transactional outbox.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('interview');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Question navigation
  const [questionList] = useState(questionsData?.length ? questionsData : DEFAULT_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');

  // Live Telemetry
  const [liveMetrics, setLiveMetrics] = useState({
    has_face: false,
    face_detected: false,
    norm_bbox: null,
    dominantEmotion: 'Composed / Neutral',
    confidence: 0,
    eyeContact: 92,
    emotionScores: { composed: 70, confident: 20, tense: 10 }
  });

  // Dynamic Session Logs
  const [sessionFacialLog, setSessionFacialLog] = useState([]);
  const [completedQuestionsLog, setCompletedQuestionsLog] = useState([]);
  const timerRef = useRef(null);

  // Session timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Frame telemetry receiver: appends real predictions to sessionFacialLog
  const handleLiveMetricsUpdate = useCallback((newMetrics) => {
    setLiveMetrics(newMetrics);
    if (newMetrics.has_face || newMetrics.face_detected) {
      setSessionFacialLog((prev) => {
        const entry = {
          timestamp: Date.now(),
          expression: newMetrics.dominantEmotion || 'Composed / Neutral',
          confidence: newMetrics.confidence || 85,
          eyeContact: newMetrics.eyeContact || 92,
          emotionScores: newMetrics.emotionScores
        };
        // Keep maximum 600 live frames in memory
        const updated = [...prev, entry];
        return updated.length > 600 ? updated.slice(updated.length - 600) : updated;
      });
    }
  }, []);

  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionList.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTranscript('');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setTranscript('');
    }
  };

  // Appends real evaluated candidate answer to completedQuestionsLog
  const handleAddAnswerRecord = (record) => {
    setCompletedQuestionsLog((prev) => {
      const filtered = prev.filter((item) => item.questionId !== record.questionId);
      return [...filtered, record];
    });
  };

  // Transition to Analysis Report
  const handleGenerateReport = () => {
    setIsRecording(false);
    setIsPaused(false);
    setActiveTab('report');
  };

  const currentQuestion = questionList[currentQuestionIndex] || DEFAULT_QUESTIONS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRecording={isRecording}
        dominantEmotion={liveMetrics.dominantEmotion}
        hasFace={liveMetrics.has_face || liveMetrics.face_detected}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-[1750px] mx-auto px-4 lg:px-6 py-5">
        {activeTab === 'interview' ? (
          <InterviewRoom
            isRecording={isRecording}
            isPaused={isPaused}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            sessionTime={sessionTime}
            currentQuestion={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questionList.length}
            liveMetrics={liveMetrics}
            onLiveMetricsUpdate={handleLiveMetricsUpdate}
            transcript={transcript}
            onTranscriptUpdate={setTranscript}
            onStart={handleStart}
            onPause={handlePause}
            onNext={handleNextQuestion}
            onPrev={handlePrevQuestion}
            onEndAndAnalyze={handleGenerateReport}
            onAddAnswerRecord={handleAddAnswerRecord}
          />
        ) : (
          <AnalysisReport
            candidateName="Vaishnav Tardekar"
            candidateRole="Full-Stack Engineer"
            sessionTime={sessionTime}
            sessionFacialLog={sessionFacialLog}
            completedQuestionsLog={completedQuestionsLog}
            onBackToPractice={() => setActiveTab('interview')}
          />
        )}
      </main>

    </div>
  );
}
