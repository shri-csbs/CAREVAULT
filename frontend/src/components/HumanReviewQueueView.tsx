import React, { useState } from 'react';
import {
  UserCheck2,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Check,
  Building,
  HardDrive,
  Info,
  X,
} from 'lucide-react';
import { ReconciliationRecord, User } from '../types';

interface HumanReviewQueueViewProps {
  reconciliations: ReconciliationRecord[];
  onResolveRecord: (
    recordId: string,
    action: 'Accepted CareVault' | 'Accepted EHR' | 'Marked Resolved',
    resolutionNote: string
  ) => void;
  currentUser: User;
  activeReviewRecord?: ReconciliationRecord | null;
}

export const HumanReviewQueueView: React.FC<HumanReviewQueueViewProps> = ({
  reconciliations,
  onResolveRecord,
  currentUser,
  activeReviewRecord: externalActiveRecord,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(
    externalActiveRecord || null
  );
  const [resolutionSuccessMessage, setResolutionSuccessMessage] = useState<string | null>(null);

  // Sync external active record if set
  React.useEffect(() => {
    if (externalActiveRecord) {
      setSelectedRecord(externalActiveRecord);
    }
  }, [externalActiveRecord]);

  // Queue items requiring review
  const pendingReviews = reconciliations.filter((r) => r.status === 'Pending' && r.actionNeeded);

  const handleAction = (
    action: 'Accepted CareVault' | 'Accepted EHR' | 'Marked Resolved'
  ) => {
    if (!selectedRecord) return;

    onResolveRecord(selectedRecord.id, action, `Action: ${action} executed by ${currentUser.name} (${currentUser.role})`);
    setResolutionSuccessMessage(
      `Issue for ${selectedRecord.eventId} resolved via [${action}]. Audit trail updated.`
    );
    setSelectedRecord(null);

    setTimeout(() => {
      setResolutionSuccessMessage(null);
    }, 4000);
  };

  const getPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            Low
          </span>
        );
    }
  };

  return (
    <div id="human-review-queue-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck2 className="w-5 h-5 text-purple-600" />
              Human Review Queue
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
              {pendingReviews.length} Active Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical adjudications when CareVault cryptographic edge logs and hospital EHR records diverge.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Reviewer Role: <strong className="text-slate-900">{currentUser.role}</strong> ({currentUser.name})
        </div>
      </div>

      {/* Success Notification banner */}
      {resolutionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resolutionSuccessMessage}</span>
        </div>
      )}

      {/* Queue Table matching prompt format:
          HUMAN REVIEW QUEUE
          Event   | Issue     | Priority | Action
          EVT002  | Missing   | High     | [Review]
          EVT003  | Duplicate | Medium   | [Review]
          EVT004  | Conflict  | High     | [Review]
      */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              HUMAN REVIEW QUEUE
            </h3>
          </div>
          <span className="text-xs text-slate-400">Requires clinical supervisor sign-off</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-6 font-mono">Event</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Issue</th>
                <th className="py-3.5 px-6">Priority</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {pendingReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    All reconciliation issues are currently resolved. Queue is clear!
                  </td>
                </tr>
              ) : (
                pendingReviews.map((rec) => (
                  <tr
                    key={rec.id}
                    id={`review-queue-row-${rec.eventId}`}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      selectedRecord?.id === rec.id ? 'bg-purple-50/70' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {rec.eventId}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 font-mono">{rec.patientId}</div>
                      <div className="text-[11px] text-slate-500">{rec.patientName}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800">{rec.result}</span>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{rec.differenceNote}</div>
                    </td>
                    <td className="py-4 px-6">{getPriorityBadge(rec.priority)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        id={`queue-review-btn-${rec.eventId}`}
                        onClick={() => setSelectedRecord(rec)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>[Review]</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* When the reviewer clicks Review (Side-by-side comparison modal/view as requested):
          CareVault Record
                 ↕
          EHR Record
                 ↓
          Difference Shown
                 ↓
          [Accept CareVault]
          [Accept EHR]
          [Mark Resolved]
      */}
      {selectedRecord && (
        <div
          id="review-diff-modal"
          className="bg-white rounded-2xl border-2 border-purple-300 shadow-xl p-6 space-y-6 animate-in fade-in"
        >
          {/* Top banner of reviewer view */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-slate-900">
                  Resolving {selectedRecord.eventId}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                  Issue: {selectedRecord.result}
                </span>
                {getPriorityBadge(selectedRecord.priority)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Patient: <strong className="text-slate-800">{selectedRecord.patientName}</strong> ({selectedRecord.patientId}) • Type: {selectedRecord.eventType}
              </p>
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Cards: CareVault Record ↕ EHR Record */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* CareVault Record Card */}
            <div className="p-5 rounded-2xl bg-teal-50/70 border-2 border-teal-300 space-y-3">
              <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-950">
                  <HardDrive className="w-4 h-4 text-teal-700" />
                  <span>CareVault Record</span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded">
                  Status: {selectedRecord.careVaultStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Timestamp</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedRecord.careVaultData.timestamp}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Clinical Details</span>
                  <p className="p-2.5 bg-white rounded-lg border border-teal-200 text-slate-800 leading-relaxed font-medium">
                    {selectedRecord.careVaultData.description}
                  </p>
                </div>

                {selectedRecord.careVaultData.dosage && (
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Recorded Dosage</span>
                    <span className="font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200 inline-block">
                      {selectedRecord.careVaultData.dosage}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Signer & Verification ID</span>
                  <div className="text-[11px] text-teal-900 font-mono break-all bg-white/80 p-2 rounded border border-teal-200">
                    {selectedRecord.careVaultData.provider} • ID: {selectedRecord.careVaultData.hash}
                  </div>
                </div>
              </div>
            </div>

            {/* EHR Record Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Building className="w-4 h-4 text-slate-600" />
                  <span>EHR Record (Epic / Cerner)</span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  Status: {selectedRecord.ehrStatus}
                </span>
              </div>

              {selectedRecord.ehrData ? (
                <div className="space-y-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Timestamp</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedRecord.ehrData.timestamp}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">EHR Registered Details</span>
                    <p className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-medium">
                      {selectedRecord.ehrData.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">EHR Provider / Source</span>
                    <div className="text-[11px] text-slate-700 font-mono bg-white/80 p-2 rounded border border-slate-200">
                      {selectedRecord.ehrData.provider} • {selectedRecord.ehrData.sourceSystem}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No Record Found in EHR</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Event is currently missing from legacy EHR ingestion pipeline.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Difference Shown banner matching prompt:
              Difference Shown
          */}
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <Info className="w-4 h-4 text-purple-700" />
              <span>Difference Shown:</span>
            </div>
            <p className="text-purple-800 font-medium pl-6 leading-relaxed">
              {selectedRecord.differenceNote}
            </p>
          </div>

          {/* Action Buttons matching prompt:
              [Accept CareVault]
              [Accept EHR]
              [Mark Resolved]
          */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              id="action-accept-carevault-btn"
              onClick={() => handleAction('Accepted CareVault')}
              className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>[Accept CareVault]</span>
            </button>

            <button
              id="action-accept-ehr-btn"
              onClick={() => handleAction('Accepted EHR')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Building className="w-4 h-4" />
              <span>[Accept EHR]</span>
            </button>

            <button
              id="action-mark-resolved-btn"
              onClick={() => handleAction('Marked Resolved')}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>[Mark Resolved]</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
