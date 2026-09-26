import React, { useState } from 'react';
import { Shield, Lock, User as UserIcon, CheckCircle2, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface LoginModalProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ currentUser: _currentUser, onLogin, isOpen }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Doctor');
  const [email, setEmail] = useState('dr.arunkumar@carevault-health.org');
  const [password, setPassword] = useState('••••••••••••');
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'verified' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRolePreset = (user: User) => {
    setSelectedRole(user.role);
    setEmail(user.email);
    setPassword('••••••••••••');
    setErrorMessage('');
    setAuthStatus('idle');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter an email or username.');
      return;
    }

    setAuthStatus('authenticating');
    setErrorMessage('');

    setTimeout(() => {
      // Find matching user or use first with selected role
      const matched = INITIAL_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || u.role === selectedRole
      ) || {
        id: 'USR' + Math.floor(100 + Math.random() * 900),
        name: email.split('@')[0],
        email: email,
        role: selectedRole,
        badgeId: `ID-${selectedRole.substring(0, 3).toUpperCase()}-9011`,
      };

      setAuthStatus('verified');
      setTimeout(() => {
        onLogin(matched);
      }, 500);
    }, 600);
  };

  return (
    <div id="login-overlay" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="login-container" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transition-all">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">CareVault</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-medium border border-teal-500/30">
                  v2.4 SECURE
                </span>
              </div>
              <p className="text-xs text-slate-400">Hospital Staff Access & Authentication Gateway</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Verified Security
          </div>
        </div>

        {/* Quick Demo Persona Switcher */}
        <div className="px-6 pt-5 pb-3 bg-slate-50/80 border-b border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
            <span>Select Staff Persona (Quick Demo Login)</span>
            <span className="text-[11px] text-teal-700 font-normal">Role Identification</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {INITIAL_USERS.filter((u) => u.role === 'Doctor' || u.role === 'Nurse/Staff').map((user) => {
              const isSelected = selectedRole === user.role;
              return (
                <button
                  key={user.id}
                  id={`role-btn-${user.role.toLowerCase().replace(/[^a-z]/g, '')}`}
                  type="button"
                  onClick={() => handleRolePreset(user)}
                  className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-teal-600 shadow-sm ring-2 ring-teal-500/20'
                      : 'bg-slate-100/70 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className={`font-semibold ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                    {user.role === 'Nurse/Staff' ? 'Nurse' : user.role}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5">{user.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              Username / Hospital Email
            </label>
            <input
              id="login-email-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium text-slate-900"
              placeholder="e.g. dr.arunkumar@carevault-health.org"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Password / Badge PIN
            </label>
            <input
              id="login-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium text-slate-900 font-mono"
              placeholder="••••••••••••"
            />
          </div>

          {/* Role confirmation banner */}
          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-teal-950 font-medium">
              <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Assigned Role: <strong className="font-bold text-teal-800">{selectedRole}</strong>
              </span>
            </div>
            <span className="text-[11px] text-teal-700 font-mono">2FA Token Valid</span>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status message */}
          {authStatus === 'authenticating' && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600 py-1">
              <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Authenticating staff credentials & ID badge...</span>
            </div>
          )}

          {authStatus === 'verified' && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Authentication verified. Loading {selectedRole} dashboard...</span>
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={authStatus === 'authenticating' || authStatus === 'verified'}
            className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Authorize & Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[11px] text-slate-600 mt-2">
            Audit protected session • User → Authentication → Role → Dashboard
          </p>
        </form>
      </div>
    </div>
  );
};
