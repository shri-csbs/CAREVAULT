import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { NavigationTabs, NavTabId } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { PatientSearchView } from './components/PatientSearchView';
import { ClinicalEventView } from './components/ClinicalEventView';
import { EventHistoryView } from './components/EventHistoryView';
import { SyncStatusView } from './components/SyncStatusView';
import { ReconciliationView } from './components/ReconciliationView';
import { HumanReviewQueueView } from './components/HumanReviewQueueView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { LoginModal } from './components/LoginModal';
import { ClinicianAuthView } from './components/ClinicianAuthView';
import { CareVaultStepWorkflow } from './components/CareVaultStepWorkflow';
import { Lock, ShieldCheck, Stethoscope, Activity } from 'lucide-react';

import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_CLINICAL_EVENTS,
  INITIAL_RECONCILIATIONS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { User, Patient, SystemStatusState, ClinicalEvent, ReconciliationRecord, AuditLogEntry } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default: Dr. Arun Kumar (Doctor)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [workflowMode, setWorkflowMode] = useState<boolean>(true); // One-by-one dashboard showing as given before
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  // Shared state
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [events, setEvents] = useState<ClinicalEvent[]>(INITIAL_CLINICAL_EVENTS);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>(INITIAL_RECONCILIATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Selected patient for event creation shortcut
  const [selectedPatientIdForEvent, setSelectedPatientIdForEvent] = useState('PAT001');
  const [activeReviewRecord, setActiveReviewRecord] = useState<ReconciliationRecord | null>(null);

  // System status state
  const [systemStatus, setSystemStatus] = useState<SystemStatusState>({
    networkOnline: true,
    databaseConnected: true,
    hardwareConnected: true,
    syncActive: true,
    securityActive: true,
    lastSync: '10:42 AM',
    pendingCount: 6,
    syncedCount: 128,
    failedCount: 0,
    localOfflineQueueCount: 2,
  });

  // Toggle network online/offline simulation
  const handleToggleOnline = () => {
    setSystemStatus((prev) => {
      const nextOnline = !prev.networkOnline;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add to audit log
      const auditEntry: AuditLogEntry = {
        id: `AUD${Math.floor(105 + Math.random() * 900)}`,
        time: timeStr,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: nextOnline ? 'Network Restored (Online Mode)' : 'Network Disconnected (Offline Mode)',
        target: 'EDGE-GATEWAY-WAN',
        status: nextOnline ? '✓' : 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
      };
      setAuditLogs((a) => [auditEntry, ...a]);

      return {
        ...prev,
        networkOnline: nextOnline,
        syncActive: nextOnline,
        lastSync: nextOnline ? timeStr : prev.lastSync,
      };
    });
  };

  // Trigger manual sync
  const handleTriggerSync = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSystemStatus((prev) => ({
      ...prev,
      lastSync: timeStr,
      pendingCount: 0,
      syncedCount: prev.syncedCount + (prev.pendingCount || 2),
    }));

    const auditEntry: AuditLogEntry = {
      id: `AUD${Math.floor(105 + Math.random() * 900)}`,
      time: timeStr,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Executed Manual Batch Sync',
      target: 'CENTRAL-HOSPITAL-CORE',
      status: '✓',
      hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    };
    setAuditLogs((a) => [auditEntry, ...a]);
  };

  // Create clinical event handler
  const handleEventCreated = (newEvent: ClinicalEvent) => {
    setEvents((prev) => [newEvent, ...prev]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update pending count if offline
    if (!systemStatus.networkOnline) {
      setSystemStatus((prev) => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
      }));
    }

    // Add audit log entry
    const auditEntry: AuditLogEntry = {
      id: `AUD${Math.floor(105 + Math.random() * 900)}`,
      time: timeStr,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'Created Event',
      target: `${newEvent.id} (${newEvent.eventType} - ${newEvent.patientId})`,
      status: '✓',
      hash: newEvent.hash.slice(0, 12),
    };
    setAuditLogs((a) => [auditEntry, ...a]);
  };

  // Resolve reconciliation item
  const handleResolveRecord = (
    recordId: string,
    action: 'Accepted CareVault' | 'Accepted EHR' | 'Marked Resolved',
    resolutionNote: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setReconciliations((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: 'Resolved',
            actionNeeded: false,
            resolutionAction: action,
            resolvedAt: timeStr,
            resolvedBy: currentUser.name,
          };
        }
        return r;
      })
    );

    const rec = reconciliations.find((r) => r.id === recordId);
    const eventId = rec ? rec.eventId : recordId;

    // Add audit log
    const auditEntry: AuditLogEntry = {
      id: `AUD${Math.floor(105 + Math.random() * 900)}`,
      time: timeStr,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: `Resolved Conflict (${action})`,
      target: `${eventId} - ${resolutionNote}`,
      status: '✓',
      hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    };
    setAuditLogs((a) => [auditEntry, ...a]);
  };

  // Open review item from Reconciliation view
  const handleOpenReviewItem = (rec: ReconciliationRecord) => {
    setActiveReviewRecord(rec);
    setActiveTab('human-review');
  };

  // Select patient from Patient Search to prefill Event Form
  const handleSelectPatientForEvent = (patientId: string) => {
    setSelectedPatientIdForEvent(patientId);
  };

  // User auth actions
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const auditEntry: AuditLogEntry = {
      id: `AUD${Math.floor(105 + Math.random() * 900)}`,
      time: timeStr,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Staff Authenticated & Badge Verified',
      target: user.badgeId,
      status: '✓',
      hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    };
    setAuditLogs((a) => [auditEntry, ...a]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setWorkflowMode(true);
  };

  // If in 9-Step Hardware Workflow mode (matches presentation image & cyber attack drill)
  if (workflowMode) {
    return (
      <CareVaultStepWorkflow
        currentUser={currentUser}
        patients={patients}
        onSwitchUser={(user) => {
          setCurrentUser(user);
        }}
        onCompleteAuth={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        onAddAuditLog={(entry) => setAuditLogs((prev) => [entry, ...prev])}
        onAddClinicalEvent={(newEvent) => {
          handleEventCreated(newEvent);
        }}
        onAddPatient={(newPatient) => {
          setPatients((prev) => [newPatient, ...prev]);
        }}
        onExitToFullDashboard={() => {
          setIsAuthenticated(true);
          setWorkflowMode(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ClinicianAuthView
        initialUser={currentUser}
        onOpenWorkflow={() => setWorkflowMode(true)}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setAuditLogs((a) => [
            {
              id: `AUD${Math.floor(105 + Math.random() * 900)}`,
              time: timeStr,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
              action: `Dual-Factor Authenticated (NFC + Biometrics) -> ${user.role} Dashboard`,
              target: user.badgeId,
              status: '✓',
              hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
            },
            ...a,
          ]);
        }}
        onAddAuditLog={(entry) => setAuditLogs((prev) => [entry, ...prev])}
      />
    );
  }

  const pendingReviewCount = reconciliations.filter(
    (r) => r.status === 'Pending' && r.actionNeeded
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        systemStatus={systemStatus}
        onToggleOnline={handleToggleOnline}
        onTriggerCyberAttack={() => setWorkflowMode(true)}
        onOpenWorkflow={() => setWorkflowMode(true)}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setAuditLogs((a) => [
            {
              id: `AUD${Math.floor(105 + Math.random() * 900)}`,
              time: timeStr,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
              action: `Switched Staff Session to ${user.role}`,
              target: user.badgeId,
              status: '✓',
              hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}`,
            },
            ...a,
          ]);
        }}
        onLogout={handleLogout}
        activeTab={activeTab}
        reviewCount={pendingReviewCount}
      />

      {/* Navigation Sub-Tabs (All 8 Components) */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingReviewCount={pendingReviewCount}
        isOffline={!systemStatus.networkOnline}
        pendingSyncCount={systemStatus.pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Clinician Authentication Status Bar */}
        <div className="mb-4 p-3 bg-slate-900 text-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">Emergency Mode Terminal Active:</span>
              <span className="text-teal-300 font-semibold">{currentUser.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-mono border border-teal-500/40">
                {currentUser.role === 'Nurse/Staff' ? 'Nurse' : currentUser.role}
              </span>
              <span className="hidden md:inline text-slate-400 font-mono">
                • Badge: {currentUser.badgeId} • ID Card + Biometrics Verified
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="emergency-bar-carevault-btn"
              onClick={() => setWorkflowMode(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
              title="Return to CareVault Dashboard"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
              <span>CareVault Dashboard</span>
            </button>
          </div>
        </div>

        {/* Offline Banner alert when offline on any page */}
        {!systemStatus.networkOnline && activeTab !== 'sync-status' && (
          <div
            onClick={() => setActiveTab('sync-status')}
            className="mb-6 p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 cursor-pointer hover:bg-rose-100 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <strong className="font-bold">Offline Mode Active:</strong>
              <span>
                Hospital local edge buffer is safely storing events locally. Click to inspect sync telemetry.
              </span>
            </div>
            <span className="font-semibold underline text-rose-800">View Sync Status →</span>
          </div>
        )}

        {/* 1. Main Dashboard (Screen after login) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            systemStatus={systemStatus}
            events={events}
            reconciliations={reconciliations}
            onNavigate={(tab) => setActiveTab(tab)}
            onToggleOnline={handleToggleOnline}
            currentUser={currentUser}
          />
        )}

        {/* 2. Patient Search */}
        {activeTab === 'patient-search' && (
          <PatientSearchView
            onSelectPatientForEvent={handleSelectPatientForEvent}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 3. Clinical Event Management */}
        {activeTab === 'clinical-events' && (
          <ClinicalEventView
            currentUser={currentUser}
            defaultPatientId={selectedPatientIdForEvent}
            onEventCreated={handleEventCreated}
            onNavigate={(tab) => setActiveTab(tab)}
            recentEvents={events}
          />
        )}

        {/* 4. Event History */}
        {activeTab === 'event-history' && <EventHistoryView events={events} />}

        {/* 5. Synchronization / Offline Status */}
        {activeTab === 'sync-status' && (
          <SyncStatusView
            systemStatus={systemStatus}
            onToggleOnline={handleToggleOnline}
            onTriggerSync={handleTriggerSync}
            events={events}
            onReturnToCareVault={() => setWorkflowMode(true)}
          />
        )}

        {/* 6. Reconciliation Dashboard */}
        {activeTab === 'reconciliation' && (
          <ReconciliationView
            reconciliations={reconciliations}
            onOpenReviewItem={handleOpenReviewItem}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 7. Human Review Queue */}
        {activeTab === 'human-review' && (
          <HumanReviewQueueView
            reconciliations={reconciliations}
            onResolveRecord={handleResolveRecord}
            currentUser={currentUser}
            activeReviewRecord={activeReviewRecord}
          />
        )}

        {/* 8. Security & Audit Page */}
        {activeTab === 'security-audit' && <SecurityAuditView auditLogs={auditLogs} />}
      </main>

      {/* Hospital Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CareVault Health Systems</span>
            <span>•</span>
            <span>Tamper-Resistant Edge Node v2.4</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">SHA-256 Hash-Chain Integrity</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-slate-500 hover:text-slate-700 cursor-pointer underline"
            >
              Legacy Credentials Modal
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">Node: CV-HOSP-01</span>
          </div>
        </div>
      </footer>

      {/* 1. Login & Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onLogin={handleLoginSuccess}
      />
    </div>
  );
}
