import React, { useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Shield,
  Layers,
  AlertCircle,
  PlusCircle,
  Stethoscope,
} from 'lucide-react';
import { SystemStatusState, ClinicalEvent } from '../types';

interface SyncStatusViewProps {
  systemStatus: SystemStatusState;
  onToggleOnline: () => void;
  onTriggerSync: () => void;
  events: ClinicalEvent[];
  onReturnToCareVault?: () => void;
}

export const SyncStatusView: React.FC<SyncStatusViewProps> = ({
  systemStatus,
  onToggleOnline,
  onTriggerSync,
  onReturnToCareVault,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [simulatedOfflineEvents, setSimulatedOfflineEvents] = useState<
    Array<{ id: string; time: string; patient: string; type: string; summary: string }>
  >([
    {
      id: 'OFF-EVT-901',
      time: '10:38 AM',
      patient: 'PAT001 (Aarav Kumar)',
      type: 'Medication',
      summary: 'Administered IV Saline flush & Heparin lock at ICU bed 2',
    },
    {
      id: 'OFF-EVT-902',
      time: '10:41 AM',
      patient: 'PAT002 (Nithya Kumar)',
      type: 'Vital Check',
      summary: 'Automated telemetry sync from Welch Allyn monitor: HR 76, BP 122/80',
    },
  ]);

  const handleManualSync = () => {
    if (!systemStatus.networkOnline) {
      alert('Cannot sync while network is OFFLINE. Toggle network to ONLINE first or reconnect.');
      return;
    }

    setSyncing(true);
    setSyncFeedback(null);

    setTimeout(() => {
      setSyncing(false);
      const count = simulatedOfflineEvents.length || systemStatus.pendingCount || 2;
      setSyncFeedback(`${count} pending events synchronized ✓`);
      setSimulatedOfflineEvents([]);
      onTriggerSync();
    }, 1200);
  };

  const handleAddOfflineEvent = () => {
    const num = Math.floor(100 + Math.random() * 899);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSim = {
      id: `OFF-EVT-${num}`,
      time: timeStr,
      patient: 'PAT003 (Arun Kumar)',
      type: 'Clinical Event',
      summary: 'Bedside vital assessment recorded offline to local clinical records',
    };
    setSimulatedOfflineEvents((prev) => [newSim, ...prev]);
  };

  const currentPendingCount = simulatedOfflineEvents.length;

  return (
    <div id="sync-status-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 text-teal-600 ${syncing ? 'animate-spin' : ''}`} />
              Synchronization & Offline Status
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Offline Buffer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Offline-first resilience: patient records are preserved locally in a secure ledger and seamlessly synced upon network restoration.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Back to CareVault Dashboard Button */}
          {onReturnToCareVault && (
            <button
              id="sync-return-carevault-btn"
              onClick={onReturnToCareVault}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
              title="Return to CareVault Dashboard"
            >
              <Stethoscope className="w-4 h-4" />
              <span>CareVault Dashboard</span>
            </button>
          )}

          {/* Main Demo Toggle */}
          <button
            id="sync-network-toggle-btn"
            onClick={onToggleOnline}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              systemStatus.networkOnline
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {systemStatus.networkOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Simulate Network Drop (Go OFFLINE)</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>Simulate Network Restore (Go ONLINE)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Sync Status Panel matching prompt specification */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">SYNC STATUS</h3>
            <p className="text-xs text-slate-500">Live clinical synchronization telemetry</p>
          </div>
          <div className="text-xs font-mono text-slate-400">Station ID: CV-STATION-77A</div>
        </div>

        {/* Live Status Indicators (Network, Workstation, Last Sync) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Network */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              systemStatus.networkOnline
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  systemStatus.networkOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {systemStatus.networkOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Hospital Network:</span>
                <span className="font-bold text-sm">
                  {systemStatus.networkOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                systemStatus.networkOnline ? 'bg-emerald-200/70 text-emerald-900' : 'bg-rose-200/70 text-rose-900'
              }`}
            >
              {systemStatus.networkOnline ? 'Sync Active' : 'Offline Queue Active'}
            </span>
          </div>

          {/* Workstation */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Workstation:</span>
                <span className="font-bold text-sm">🟢 CONNECTED</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
              Station Active
            </span>
          </div>

          {/* Last Sync */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Last Sync:</span>
                <span className="font-mono font-bold text-sm">{systemStatus.lastSync || '10:42 AM'}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Auto-sync</span>
          </div>
        </div>

        {/* Counter Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Pending Events
            </span>
            <div className="text-3xl font-extrabold text-amber-900 font-mono mt-2">
              {currentPendingCount}
            </div>
            <p className="text-xs text-amber-700 mt-1">Stored in local secure buffer</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Synced Events
            </span>
            <div className="text-3xl font-extrabold text-emerald-900 font-mono mt-2">128</div>
            <p className="text-xs text-emerald-700 mt-1">Confirmed in central hospital repository</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Failed Events
            </span>
            <div className="text-3xl font-extrabold text-slate-700 font-mono mt-2">0</div>
            <p className="text-xs text-slate-500 mt-1">Zero data errors</p>
          </div>
        </div>

        {/* Action Button: [ SYNC NOW ] */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <button
            id="sync-now-btn"
            onClick={handleManualSync}
            disabled={syncing || !systemStatus.networkOnline}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing Records...' : '[ SYNC NOW ]'}</span>
          </button>

          <button
            onClick={handleAddOfflineEvent}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Simulate Logging Bedside Event (Adds to Local Buffer)</span>
          </button>
        </div>

        {/* Dynamic Offline / Online State Banners */}
        {!systemStatus.networkOnline && (
          <div
            id="offline-status-banner"
            className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2 animate-in fade-in"
          >
            <div className="flex items-center gap-2 font-extrabold text-sm text-rose-900">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
              <span>🔴 OFFLINE</span>
            </div>
            <p className="font-semibold text-sm text-rose-900">
              {currentPendingCount} events stored locally.
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">
              Events will synchronize automatically when connectivity is restored.
            </p>
            <div className="text-[11px] font-mono text-rose-600 pt-1">
              Local Ledger: Active (All records secured in local storage)
            </div>
          </div>
        )}

        {/* Reconnection notification */}
        {systemStatus.networkOnline && syncFeedback && (
          <div
            id="online-synced-banner"
            className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-2 animate-in fade-in"
          >
            <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-900">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>🟢 ONLINE</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{syncFeedback}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-emerald-700">
                Ledger verified against central hospital database and EHR queues.
              </p>
              {onReturnToCareVault && (
                <button
                  id="sync-success-return-btn"
                  onClick={onReturnToCareVault}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:scale-[1.02] shrink-0"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Return to CareVault Dashboard →</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Local Offline Events Buffer Table */}
        {currentPendingCount > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Local Buffer ({currentPendingCount} Events Awaiting Central Synchronization)</span>
              </div>
              <span className="text-[11px] text-amber-700 font-mono">Storage: Local Offline Storage</span>
            </div>

            <div className="space-y-2">
              {simulatedOfflineEvents.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{item.id}</span>
                      <span className="font-semibold text-slate-800">{item.patient}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 shrink-0">
                    <span>{item.time}</span>
                    <span className="text-amber-700 font-semibold">• Queued Locally</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
