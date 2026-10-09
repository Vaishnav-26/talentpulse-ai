import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import OAuthModal from './OAuthModal';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('signup'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('Google');

  // Form State
  const [fullName, setFullName] = useState('Alex Vanguard');
  const [role, setRole] = useState('Full-Stack');
  const [seniority, setSeniority] = useState('Senior');
  const [email, setEmail] = useState('alex.vanguard@example.com');
  const [password, setPassword] = useState('••••••••••••');

  const roles = [
    { id: 'Frontend', label: 'Frontend Engineer' },
    { id: 'Backend', label: 'Backend Engineer' },
    { id: 'Full-Stack', label: 'Full-Stack Engineer' },
    { id: 'ML/AI', label: 'ML / AI Engineer' },
    { id: 'DevOps', label: 'DevOps / Cloud' },
    { id: 'Product', label: 'Product Manager' },
  ];

  const seniorities = ['Junior', 'Mid', 'Senior', 'Lead'];

  // Sync with SQLite backend
  const syncUserWithBackend = async (userData) => {
    try {
      await fetch('http://127.0.0.1:8000/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          target_role: userData.role,
          experience_level: userData.seniority
        })
      });
    } catch (err) {
      console.warn('Backend user sync fallback (offline mode):', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = {
      name: mode === 'signup' ? (fullName || 'Alex Vanguard') : (email.split('@')[0] || 'Candidate'),
      email: email || 'alex@talentpulse.ai',
      role: role || 'Full-Stack',
      seniority: seniority || 'Senior',
      loginTime: new Date().toISOString(),
      avatarInitials: (fullName || email || 'AL').substring(0, 2).toUpperCase()
    };

    localStorage.setItem('talentpulse_user', JSON.stringify(userData));
    syncUserWithBackend(userData);
    onLoginSuccess(userData);
  };

  const handleOpenOAuth = (provider) => {
    setSelectedProvider(provider);
    setOauthModalOpen(true);
  };

  const handleConfirmOAuth = (userData) => {
    setOauthModalOpen(false);
    localStorage.setItem('talentpulse_user', JSON.stringify(userData));
    syncUserWithBackend(userData);
    onLoginSuccess(userData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[#F8FAFC]">
      
      {/* Background Animated Vibrant Light Gradient Mesh Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[550px] h-[550px] bg-gradient-to-br from-[#38BDF8]/30 to-[#818CF8]/25 rounded-full blur-[110px] pointer-events-none -z-10 animate-float" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#FB7185]/20 via-[#818CF8]/25 to-[#34D399]/25 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-delayed" />
      <div className="fixed top-[40%] right-[25%] w-[450px] h-[450px] bg-[#38BDF8]/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Brand Value Proposition (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 text-left p-2 sm:p-4">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 uppercase">
              COGNITIVE LAB v3.5
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Master Your Next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500">
                Technical Interview
              </span>
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Real-time facial demeanor telemetry, voice-reactive AI avatar interviewer, live coding playground, and ATS resume matcher in one cohesive platform.
            </p>
          </div>

          {/* Key Highlights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Lip-Syncing AI Recruiter ("Zara")</p>
                <p className="text-[11px] text-slate-500">Spoken questions with dynamic mouth phonemes & adaptive follow-ups</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">60 FPS PyTorch Facial Telemetry</p>
                <p className="text-[11px] text-slate-500">Gaze lock, eye contact ring, and micro-expression scoring</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">50+ Question Multi-Domain Bank</p>
                <p className="text-[11px] text-slate-500">DSA, System Design, SQL, Frontend & Quantitative Aptitude</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Dual-Card Light Glassmorphic Authentication (7 Cols) */}
        <div className="lg:col-span-7">
          
          <div className="relative rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-6 sm:p-8 shadow-[0_10px_35px_rgba(31,38,135,0.08)] space-y-6">
            
            {/* Top Toggle Switch */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                {mode === 'signup' ? 'Get Started with TalentPulse AI' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'signup'
                  ? 'Configure your target role and start realistic AI simulation interviews.'
                  : 'Enter your credentials to access your telemetry analytics and coding rooms.'}
              </p>
            </div>

            {/* Social Login Glass Pills with OAuth Modal */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOpenOAuth('Google')}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenOAuth('GitHub')}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200/80 w-full" />
              <span className="bg-white/90 px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider absolute">
                or continue with email
              </span>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Vanguard"
                        className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Target Role & Seniority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Target Role</label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 appearance-none cursor-pointer"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Target Level</label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <select
                          value={seniority}
                          onChange={(e) => setSeniority(e.target.value)}
                          className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 appearance-none cursor-pointer"
                        >
                          {seniorities.map((s) => (
                            <option key={s} value={s}>{s} Level</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@talentpulse.ai"
                    className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  {mode === 'signin' && (
                    <button type="button" className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-bold text-sm shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <span>{mode === 'signup' ? 'Launch Practice Dashboard' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-500">
                By continuing, you agree to our{' '}
                <span className="text-indigo-600 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-indigo-600 hover:underline cursor-pointer">Privacy Policy</span>.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* OAuth Simulation Modal */}
      <OAuthModal
        isOpen={oauthModalOpen}
        onClose={() => setOauthModalOpen(false)}
        provider={selectedProvider}
        onConfirmOAuth={handleConfirmOAuth}
      />

    </div>
  );
}
