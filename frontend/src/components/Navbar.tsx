import React from 'react';
import { Shield, HardDrive, Wifi, WifiOff, LogOut, ChevronDown, UserCheck, Stethoscope, FileSearch, ShieldCheck, Lock } from 'lucide-react';
import { User, SystemStatusState, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface NavbarProps {
  currentUser: User;
  systemStatus: SystemStatusState;
  onToggleOnline: () => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  activeTab: string;
  reviewCount: number;
  onTriggerCyberAttack?: () => void;
  onOpenWorkflow?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  systemStatus,
  onToggleOnline,
  onSwitchUser,
  onLogout,
  reviewCount,
  onTriggerCyberAttack,
  onOpenWorkflow,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Nurse/Staff':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Reviewer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Admin':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Doctor':
        return <Stethoscope className="w-3.5 h-3.5" />;
      case 'Nurse/Staff':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'Reviewer':
        return <FileSearch className="w-3.5 h-3.5" />;
      case 'Admin':
        return <ShieldCheck className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header id="hospital-navbar" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand logo & Tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm shrink-0">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans leading-none">
                Hospital App
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 font-mono font-bold border border-teal-500/30 tracking-wider leading-none">
                HOSPITAL PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block mt-1 leading-none">
              Clinical Patient Records & Department Management
            </p>
          </div>
        </div>

        {/* Right Area: Unified Clinical Status Cluster + Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Clinical Operational Status Module */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 gap-1.5 shadow-2xs">
            <div className="h-7 px-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-mono">Network: Online</span>
            </div>

            {reviewCount > 0 && (
              <div
                id="pending-reviews-badge"
                className="h-7 px-2.5 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                <span className="text-[11px] font-mono">{reviewCount} in Queue</span>
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

          {/* Session Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Back to CareVault Dashboard Button */}
            {onOpenWorkflow && (
              <button
                id="navbar-carevault-dashboard-btn"
                onClick={onOpenWorkflow}
                className="h-9 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs hover:scale-[1.02]"
                title="Return to CareVault Dashboard"
              >
                <Stethoscope className="w-4 h-4 text-white" />
                <span>CareVault Dashboard</span>
              </button>
            )}

            {/* Clinician Profile Menu */}
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-9 pl-2 pr-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="hidden sm:flex flex-col text-left justify-center">
                  <span className="font-semibold text-white text-xs truncate max-w-[110px] leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-teal-400 font-medium leading-tight">
                    {currentUser.role === 'Nurse/Staff' ? 'Staff Nurse' : currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
              </button>

            {/* Dropdown for role switching */}
            {dropdownOpen && (
              <div
                id="role-switch-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Switch Person (Role Testing)</p>
                  <p className="text-xs text-slate-600 font-mono">{currentUser.badgeId}</p>
                </div>
                {INITIAL_USERS.filter((u) => u.role === 'Doctor' || u.role === 'Nurse/Staff').map((u) => (
                  <button
                    key={u.id}
                    id={`switch-to-user-${u.id}`}
                    onClick={() => {
                      onSwitchUser(u);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      u.id === currentUser.id ? 'bg-teal-50/70 font-semibold text-teal-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                        {getRoleIcon(u.role)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {u.role === 'Nurse/Staff' ? 'Nurse' : u.role}
                        </div>
                      </div>
                    </div>
                    {u.id === currentUser.id ? (
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Switch</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    id="logout-dropdown-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out / Exit Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </header>
  );
};
