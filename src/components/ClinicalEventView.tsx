import React, { useState, useEffect } from 'react';
import {
  FilePlus2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  User,
  Hash,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ClinicalEvent, User as CurrentUser } from '../types';
import { NavTabId } from './NavigationTabs';

interface ClinicalEventViewProps {
  currentUser: CurrentUser;
  defaultPatientId?: string;
  onEventCreated: (event: ClinicalEvent) => void;
  onNavigate: (tab: NavTabId) => void;
  recentEvents: ClinicalEvent[];
}

export const ClinicalEventView: React.FC<ClinicalEventViewProps> = ({
  currentUser,
  defaultPatientId = 'PAT001',
  onEventCreated,
  onNavigate,
  recentEvents,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [eventType, setEventType] = useState<
    'Consultation' | 'Medication' | 'Clinical' | 'Vital Check' | 'Lab Order' | 'Surgery Note' | 'Discharge'
  >('Consultation');
  const [description, setDescription] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedEvent, setLastCreatedEvent] = useState<{
    id: string;
    hash: string;
    timestamp: string;
    patientId: string;
    eventType: string;
  } | null>(null);

  // Update live auto-generated timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter an event description.');
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];
      const eventNum = Math.floor(7 + Math.random() * 90);
      const newEventId = `EVT00${eventNum}`;
      const randomHex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const generatedHash = `0x${randomHex}...verified`;

      // Patient Name mapping (all single names appended with Kumar)
      const patientNames: Record<string, string> = {
        PAT001: 'Aarav Kumar',
        PAT002: 'Nithya Kumar',
        PAT003: 'Arun Kumar',
        PAT004: 'Meera Kumar',
        PAT005: 'Pooja Kumar',
        PAT006: 'Vikram Kumar',
        PAT007: 'Rohan Kumar',
        PAT008: 'Karthik Kumar',
        PAT009: 'Rahul Kumar',
        PAT010: 'Ananiya Kumar',
        PAT011: 'Suriya Kumar',
        PAT012: 'Pranav Kumar',
        PAT013: 'Sneha Kumar',
        PAT014: 'Aishwariya Kumar',
        PAT015: 'Kavya Kumar',
        PAT016: 'Vikram Reddy',
      };

      const newEvent: ClinicalEvent = {
        id: newEventId,
        patientId: patientId.toUpperCase().trim(),
        patientName: patientNames[patientId.toUpperCase().trim()] || `Patient ${patientId}`,
        eventType: eventType,
        description: description.trim(),
        timestamp: `${dateStr} ${timeStr}:00`,
        createdTimeOnly: timeStr,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        status: 'Verified',
        securityStatus: 'Protected',
        hash: generatedHash,
        synced: true,
      };

      onEventCreated(newEvent);
      setLastCreatedEvent({
        id: newEventId,
        hash: 'Verified (Audit ID: LOG-4091)',
        timestamp: timeStr,
        patientId: patientId.toUpperCase().trim(),
        eventType: eventType,
      });

      setDescription('');
      setSubmitting(false);
    }, 500);
  };

  return (
    <div id="clinical-event-management-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-teal-600" />
              Clinical Event Management
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Audit Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authorized hospital staff can create verified clinical events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600">
          <User className="w-4 h-4 text-teal-600" />
          <span>
            Signing as: <strong className="text-slate-900 font-semibold">{currentUser.name}</strong> ({currentUser.role})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Event Form (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Clinical Event</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fill out bedside or clinical encounter parameters</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Verified Audit Trail</span>
            </div>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-5">
            {/* Patient ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Patient ID
              </label>
              <div className="flex gap-2">
                <input
                  id="clinical-event-patient-id-input"
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  placeholder="e.g. PAT001"
                  required
                />
                <div className="flex gap-1 flex-wrap">
                  {['PAT001', 'PAT002', 'PAT003', 'PAT004', 'PAT005', 'PAT006', 'PAT007', 'PAT008'].map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setPatientId(pid)}
                      className={`px-2 py-1 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                        patientId === pid
                          ? 'bg-teal-600 text-white border-teal-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {pid}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Event Type
              </label>
              <select
                id="clinical-event-type-select"
                value={eventType}
                onChange={(e) =>
                  setEventType(
                    e.target.value as
                      | 'Consultation'
                      | 'Medication'
                      | 'Clinical'
                      | 'Vital Check'
                      | 'Lab Order'
                      | 'Surgery Note'
                      | 'Discharge'
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Consultation">Consultation</option>
                <option value="Medication">Medication Event</option>
                <option value="Clinical">Clinical Event</option>
                <option value="Vital Check">Vital Check</option>
                <option value="Lab Order">Lab Order</option>
                <option value="Surgery Note">Surgery Note</option>
                <option value="Discharge">Discharge Assessment</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="clinical-event-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter clinical observations, medication dosage, or consult findings..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-slate-50/50 leading-relaxed"
                required
              />
            </div>

            {/* Timestamp (Auto-generated) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="font-semibold">Timestamp:</span>
                <span className="text-slate-500">[ Auto-generated ]</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200">
                {currentTime || '10:30 AM'}
              </span>
            </div>

            {/* Verification and Security Status as specified in prompt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Verification</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />✓ Verified
                </span>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Security Status</span>
                <span className="font-bold text-teal-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />✓ Protected
                </span>
              </div>
            </div>

            {/* Submit Button: [ CREATE EVENT ] */}
            <button
              id="clinical-event-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>{submitting ? 'Signing & Hashing Event...' : 'CREATE EVENT'}</span>
            </button>
          </form>

          {/* After submission confirmation block matching prompt:
              Event Created ✓
              Event ID: EVT005
              Hash: Verified
              Timestamp: 10:30 AM
          */}
          {lastCreatedEvent && (
            <div
              id="event-created-confirmation-card"
              className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-400 text-emerald-950 space-y-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Event Created ✓</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Committed to Ledger
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Event ID</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {lastCreatedEvent.id}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Hash</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {lastCreatedEvent.hash}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Timestamp</span>
                  <span className="font-mono font-bold text-slate-900">{lastCreatedEvent.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-emerald-800 text-[11px]">
                  Ready for EHR sync & verifiable in Event History
                </span>
                <button
                  onClick={() => onNavigate('event-history')}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>View in Event History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Session Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">Recent Created Events</h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">{recentEvents.length} total</span>
            </div>

            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-150 text-xs space-y-1 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{evt.id}</span>
                    <span className="text-emerald-700 font-semibold text-[11px]">✓ Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-slate-800">{evt.patientId}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-semibold">
                      {evt.eventType}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{evt.createdTimeOnly}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2 mt-1">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('event-history')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 w-full cursor-pointer"
            >
              <span>Explore full searchable Event History table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
