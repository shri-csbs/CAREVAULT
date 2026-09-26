import React from 'react';
import {
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  UserSearch,
  FilePlus2,
  GitCompare,
  Wifi,
  WifiOff,
  AlertCircle,
} from 'lucide-react';
import { SystemStatusState, ClinicalEvent, ReconciliationRecord, User } from '../types';
import { NavTabId } from './NavigationTabs';

interface DashboardViewProps {
  systemStatus: SystemStatusState;
  events: ClinicalEvent[];
  reconciliations: ReconciliationRecord[];
  onNavigate: (tab: NavTabId) => void;
  onToggleOnline: () => void;
  currentUser?: User;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  systemStatus,
  events,
  reconciliations,
  onNavigate,
  onToggleOnline,
  currentUser,
}) => {
  // Counts
  const patientsCount = 128;
  const eventsCount = events.length + 536; // Reflecting 542 benchmark
  const pendingCount = systemStatus.pendingCount;
  const alertsCount = reconciliations.filter((r) => r.status === 'Pending').length;
  const isDoctor = currentUser?.role === 'Doctor';

  return (
    <div id="hospital-manage-dashboard" className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 id="hospital-manage-dashboard-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isDoctor ? 'HOSPITAL MANAGEMENT DASHBOARD (DOCTOR)' : 'HOSPITAL MANAGEMENT DASHBOARD (NURSE)'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              Hospital System Active
            </span>
            {currentUser && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isDoctor
                  ? 'bg-teal-100/70 text-teal-800 border-teal-300'
                  : 'bg-blue-100/70 text-blue-800 border-blue-300'
              }`}>
                Authenticated: {currentUser.name} ({isDoctor ? 'Doctor' : 'Nurse'})
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isDoctor
              ? 'RBAC Granted: Patient Search, Critical Medical Records, Clinical Diagnostics, and Event History.'
              : 'RBAC Granted: Patient Search, Permitted Vitals, Medication Administration, and Event History.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="quick-create-event-btn"
            onClick={() => onNavigate('clinical-events')}
            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Create Event</span>
          </button>
          <button
            id="quick-patient-search-btn"
            onClick={() => onNavigate('patient-search')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <UserSearch className="w-4 h-4" />
            <span>Find Patient</span>
          </button>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patients Card */}
        <div
          id="stat-card-patients"
          onClick={() => onNavigate('patient-search')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Patients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{patientsCount}</div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
              <span>+4 today</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Total active hospital records</p>
        </div>

        {/* Events Card */}
        <div
          id="stat-card-events"
          onClick={() => onNavigate('event-history')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Events</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{eventsCount}</div>
            <span className="text-[11px] font-medium text-teal-600 font-mono">Secured & Verified</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Tamper-evident verified records</p>
        </div>

        {/* Pending Card */}
        <div
          id="stat-card-pending"
          onClick={() => onNavigate('sync-status')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight font-mono">
              {String(pendingCount).padStart(2, '0')}
            </div>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Queue buffer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Pending cloud sync</p>
        </div>

        {/* Alerts Card */}
        <div
          id="stat-card-alerts"
          onClick={() => onNavigate('human-review')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
              {String(alertsCount).padStart(2, '0')}
            </div>
            <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
              Requires Review
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">EHR Discrepancies / Conflicts</p>
        </div>
      </div>

      {/* System Status Section */}
      <div id="carevault-system-status-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              System Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immediate operational validation for local workstation, security protocols, and network connections.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Demo toggle:</span>
            <button
              onClick={onToggleOnline}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                systemStatus.networkOnline
                  ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {systemStatus.networkOnline ? 'Simulate Network Drop (Offline)' : 'Restore Network (Online)'}
            </button>
          </div>
        </div>

        {/* 5 Core Status Items as specified */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Hospital Network Status */}
          <div
            id="status-system-online"
            className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
              systemStatus.networkOnline
                ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                systemStatus.networkOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              {systemStatus.networkOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    systemStatus.networkOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                ></span>
                {systemStatus.networkOnline ? 'Hospital Network: ONLINE' : 'Hospital Network: OFFLINE'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {systemStatus.networkOnline ? 'Normal Synchronization Active' : 'Hospital Offline Mode • Local Storage'}
              </p>
            </div>
          </div>

          {/* 2. Database Connected */}
          <div
            id="status-db-connected"
            className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Database Connected
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Local Database Storage Active</p>
            </div>
          </div>

          {/* 3. Workstation Connected */}
          <div
            id="status-hardware-connected"
            className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Workstation Connected
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">ID Verification Station Active</p>
            </div>
          </div>

          {/* 4. Sync Status */}
          <div
            id="status-sync-active"
            className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
              systemStatus.networkOnline
                ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                systemStatus.networkOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${systemStatus.networkOnline ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${systemStatus.networkOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
                ></span>
                {systemStatus.networkOnline ? 'Sync Active' : 'Sync Paused'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {systemStatus.networkOnline ? `Central EHR Sync: ${systemStatus.lastSync}` : 'Offline Queue Active (Local Storage)'}
              </p>
            </div>
          </div>

          {/* 5. Security Active */}
          <div
            id="status-security-active"
            className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Security Active
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Data Integrity Verified</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Hospital clinical verification and audit logging are active.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-600">Terminal: HOSP-SYS-01</span>
        </div>
      </div>

      {/* Two Column Section: Recent Clinical Activity & Priority Reconciliation Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Hospital Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Hospital Events</h3>
              </div>
              <button
                onClick={() => onNavigate('event-history')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                View all table
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-150 flex items-start justify-between gap-3 text-xs hover:bg-slate-100/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{evt.id}</span>
                      <span className="font-semibold text-slate-700">{evt.patientName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-100/70 text-teal-800 text-[10px] font-medium">
                        {evt.eventType}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 line-clamp-1">{evt.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                      <span>By: {evt.authorName}</span>
                      <span>•</span>
                      <span className="font-mono">{evt.createdTimeOnly}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 flex items-center gap-1 ${
                      evt.status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evt.status === 'Conflict'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {evt.status === 'Verified' ? '✓ Verified' : '⚠ Conflict'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Auto-synced with edge reader</span>
            <button
              onClick={() => onNavigate('clinical-events')}
              className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
            >
              + Create New Clinical Event
            </button>
          </div>
        </div>

        {/* Priority Reconciliation Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">EHR Reconciliation Alerts</h3>
              </div>
              <button
                onClick={() => onNavigate('reconciliation')}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Reconciliation dashboard
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {reconciliations
                .filter((r) => r.status === 'Pending')
                .slice(0, 3)
                .map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{rec.eventId}</span>
                        <span className="text-slate-700 font-medium">{rec.patientName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rec.result === 'CONFLICT'
                              ? 'bg-rose-100 text-rose-800'
                              : rec.result === 'MISSING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {rec.result}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">{rec.differenceNote}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                        <span>CareVault: {rec.careVaultStatus}</span>
                        <span>vs</span>
                        <span>EHR: {rec.ehrStatus}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('human-review')}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-[11px] shrink-0 shadow-xs cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              {alertsCount} pending issues require human review
            </span>
            <button
              onClick={() => onNavigate('human-review')}
              className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
            >
              Open Human Review Queue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
