import React, { useState } from 'react';
import { X, ShieldCheck, Check, ArrowRight, User, Briefcase, GraduationCap, Mail } from 'lucide-react';

export default function OAuthModal({
  isOpen,
  onClose,
  provider = 'Google', // 'Google' | 'GitHub'
  onConfirmOAuth
}) {
  const isGoogle = provider === 'Google';

  const [name, setName] = useState(isGoogle ? 'Alex Vanguard' : 'alex-vanguard-dev');
  const [email, setEmail] = useState(isGoogle ? 'alex.vanguard@gmail.com' : 'alex@github.com');
  const [role, setRole] = useState('Full-Stack');
  const [seniority, setSeniority] = useState('Senior');

  if (!isOpen) return null;

  const roles = [
    { id: 'Frontend', label: 'Frontend Engineer' },
    { id: 'Backend', label: 'Backend Engineer' },
    { id: 'Full-Stack', label: 'Full-Stack Engineer' },
    { id: 'ML/AI', label: 'ML / AI Engineer' },
    { id: 'DevOps', label: 'DevOps / Cloud' },
    { id: 'Product', label: 'Product Manager' },
  ];

  const seniorities = ['Junior', 'Mid', 'Senior', 'Lead'];

  const handleAuthorize = () => {
    const userData = {
      name: name || (isGoogle ? 'Google Candidate' : 'GitHub Developer'),
      email: email || `${provider.toLowerCase()}@talentpulse.ai`,
      role: role || 'Full-Stack',
      seniority: seniority || 'Senior',
      authProvider: provider,
      loginTime: new Date().toISOString(),
      avatarInitials: (name || provider).substring(0, 2).toUpperCase()
    };
    onConfirmOAuth(userData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_60px_rgba(31,38,135,0.18)] p-6 space-y-5 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            {isGoogle ? (
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign in with {provider}</h3>
              <p className="text-[10px] font-mono text-slate-500">Secure OAuth 2.0 Verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Details Confirmation */}
        <div className="space-y-3">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Name</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Target Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Seniority</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {seniorities.map((s) => (
                  <option key={s} value={s}>{s} Level</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Permissions summary */}
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start space-x-2 text-[11px] text-indigo-900">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>TalentPulse AI will securely synchronize your practice telemetry records and skill diagnostics.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAuthorize}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Authorize & Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
