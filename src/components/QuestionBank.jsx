import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Play, 
  Filter, 
  Tag,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  Database,
  Code2,
  Server,
  Globe,
  Calculator
} from 'lucide-react';

export default function QuestionBank({
  questionBank = [],
  onSelectQuestion
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const domains = [
    { id: 'All', label: 'All Domains', icon: Layers },
    { id: 'DSA & Algorithms', label: 'DSA & Algorithms', icon: Code2 },
    { id: 'Database Systems & SQL', label: 'Database & SQL', icon: Database },
    { id: 'Backend & Core CS', label: 'Backend & Core CS', icon: Server },
    { id: 'Web & Frontend', label: 'Web & Frontend', icon: Globe },
    { id: 'Quantitative & Logical Aptitude', label: 'Quant & Aptitude', icon: Calculator },
  ];

  const roles = ['All', 'Full-Stack', 'Backend', 'Frontend', 'DevOps', 'General'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Filtered Questions
  const filteredQuestions = questionBank.filter((q) => {
    const matchesSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.skillsAssessed || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = selectedDomain === 'All' || q.domain === selectedDomain;
    const matchesRole = selectedRole === 'All' || q.role === selectedRole;
    const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;

    return matchesSearch && matchesDomain && matchesRole && matchesDifficulty;
  });

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDomainColor = (dom) => {
    switch (dom) {
      case 'DSA & Algorithms':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Database Systems & SQL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Backend & Core CS':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Web & Frontend':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Quantitative & Logical Aptitude':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1750px] mx-auto w-full space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.05)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl shadow-2xs">
              MULTI-DOMAIN REPOSITORY
            </span>
            <span className="px-3 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-2xs">
              {filteredQuestions.length} MODULES READY
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Comprehensive Technical Question Bank
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            50+ curated interview prompts across 5 key disciplines: DSA, Database & SQL, Backend & Core CS, Web & Frontend, and Quantitative Aptitude.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/90 px-5 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">TOTAL MODULES</p>
            <p className="text-2xl font-black text-indigo-700">{questionBank.length}</p>
          </div>
        </div>
      </div>

      {/* Domain Selection Tabs Bar */}
      <div className="glass-panel p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase font-bold">SELECT TECHNICAL DOMAIN:</span>
          <span className="text-xs font-mono text-indigo-600 font-bold">{selectedDomain}</span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {domains.map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDomain === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-5 rounded-3xl shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions by keyword, topic, or assessed skills..."
              className="w-full bg-white/90 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Difficulty Filter Pills */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase hidden sm:inline">Difficulty:</span>
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredQuestions.map((q) => {
          const diffColor = getDifficultyColor(q.difficulty);
          const domainColor = getDomainColor(q.domain);

          return (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-3xl space-y-4 hover:shadow-[0_12px_30px_rgba(31,38,135,0.08)] transition-all flex flex-col justify-between group border border-slate-200/80 relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Domain & Difficulty Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg border ${domainColor}`}>
                    {q.domain || 'DSA & Algorithms'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg border ${diffColor}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {q.estimatedDuration || '2 mins'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase block">{q.category}</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mt-0.5">
                    {q.title}
                  </h3>
                </div>

                {/* Prompt */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {q.prompt}
                </p>

                {/* Assessed Skills Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(q.skillsAssessed || []).slice(0, 4).map((skill, sIdx) => (
                    <span key={sIdx} className="px-2 py-0.5 text-[10px] font-mono bg-slate-100/80 text-slate-600 rounded-md border border-slate-200">
                      {skill}
                    </span>
                  ))}
                  {(q.skillsAssessed || []).length > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      +{q.skillsAssessed.length - 4} more
                    </span>
                  )}
                </div>

              </div>

              {/* Action Button: Practice This Question */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">ID #{q.id}</span>
                
                <button
                  onClick={() => onSelectQuestion(q)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Practice Question</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keyword, domain filter, or difficulty settings to discover more questions.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDomain('All');
              setSelectedDifficulty('All');
              setSelectedRole('All');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

    </div>
  );
}
