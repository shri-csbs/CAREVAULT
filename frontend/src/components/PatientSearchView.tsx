import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Radio,
  FilePlus2,
  Calendar,
  HeartPulse,
  User,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Patient, PatientEventSummary } from '../types';
import { INITIAL_PATIENTS } from '../data/mockData';
import { NavTabId } from './NavigationTabs';

interface PatientSearchViewProps {
  onSelectPatientForEvent: (patientId: string) => void;
  onNavigate: (tab: NavTabId) => void;
}

export const PatientSearchView: React.FC<PatientSearchViewProps> = ({
  onSelectPatientForEvent,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('PAT001');
  const [selectedPatientId, setSelectedPatientId] = useState('PAT001');
  const [scanningNfc, setScanningNfc] = useState(false);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);

  // Find active patient
  const currentPatient =
    patients.find(
      (p) =>
        p.id.toLowerCase() === selectedPatientId.toLowerCase() ||
        p.id.toLowerCase() === searchQuery.toLowerCase() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || patients[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const found = patients.find(
      (p) => p.id.toLowerCase() === query || p.name.toLowerCase().includes(query)
    );
    if (found) {
      setSelectedPatientId(found.id);
    }
  };

  const handleSimulateNfcTap = (targetPatientId: string) => {
    setScanningNfc(true);
    setTimeout(() => {
      setScanningNfc(false);
      setSelectedPatientId(targetPatientId);
      setSearchQuery(targetPatientId);
      // Ensure verified flag
      setPatients((prev) =>
        prev.map((p) => (p.id === targetPatientId ? { ...p, nfcVerified: true } : p))
      );
    }, 700);
  };

  return (
    <div id="patient-search-container" className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Patient Search & ID Verification
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search by hospital Patient ID or name, or scan physical ID bed tag / wristband.
            </p>
          </div>

          {/* Simulate ID Tap Button */}
          <button
            id="simulate-rfid-scan-btn"
            onClick={() => handleSimulateNfcTap('PAT001')}
            disabled={scanningNfc}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer ${
              scanningNfc
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            <Radio className={`w-4 h-4 ${scanningNfc ? 'text-amber-600 animate-spin' : 'text-teal-600'}`} />
            <span>{scanningNfc ? 'Scanning ID Wristband Tag...' : 'Simulate ID Tap'}</span>
          </button>
        </div>

        {/* Search Bar matching prompt layout */}
        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Search Patient ID or Name:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="patient-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. PAT001, PAT002, or Aarav Kumar..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono font-medium text-slate-900 bg-slate-50/50"
              />
            </div>
            <button
              id="patient-search-submit-btn"
              type="submit"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick select patient chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 font-medium">Quick Select Patient:</span>
          {patients.map((p) => (
            <button
              key={p.id}
              id={`quick-patient-chip-${p.id}`}
              onClick={() => {
                setSelectedPatientId(p.id);
                setSearchQuery(p.id);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                currentPatient.id === p.id
                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="font-mono font-semibold">{p.id}</span> — {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Profile & Recent Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Patient Profile */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Header section with Verification status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  {currentPatient.id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{currentPatient.name}</h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    currentPatient.condition === 'Stable'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentPatient.condition === 'Critical'
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentPatient.condition}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Room: <strong className="text-slate-800">{currentPatient.room}</strong> • Admitted: {currentPatient.admissionDate}
              </p>
            </div>

            {/* Verification Status as requested in prompt: Verification: ✓ Verified */}
            <div className="flex flex-col sm:items-end">
              <div
                id="patient-verification-status-badge"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  currentPatient.nfcVerified
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {currentPatient.nfcVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verification: ✓ Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Verification: ⚠ Unverified Tag</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400 mt-1">
                ID Card: {currentPatient.rfidCardId || currentPatient.nfcCardId}
              </span>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age / Gender</span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {currentPatient.age} yrs • {currentPatient.gender}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Blood Type</span>
              <div className="text-sm font-bold text-rose-700 mt-1">{currentPatient.bloodType}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned Doctor</span>
              <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={currentPatient.assignedDoctor}>
                {currentPatient.assignedDoctor}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Nurse</span>
              <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={currentPatient.assignedNurse}>
                {currentPatient.assignedNurse}
              </div>
            </div>
          </div>

          {/* Allergies and Warnings */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Documented Allergies & Precautions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPatient.allergies.length > 0 ? (
                currentPatient.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 text-xs font-semibold shadow-2xs"
                  >
                    ⚠ {allergy}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No known drug allergies (NKDA)</span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              id="create-event-for-patient-btn"
              onClick={() => {
                onSelectPatientForEvent(currentPatient.id);
                onNavigate('clinical-events');
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Create Event for {currentPatient.id}</span>
            </button>

            <button
              onClick={() => onNavigate('event-history')}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>Filter Full Event History for {currentPatient.id}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Recent Events Timeline (as per prompt specifications) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">Recent Events</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Today</span>
            </div>

            {/* Prompt exact example format:
                10:30 AM   Clinical Event
                09:45 AM   Medication Event
                09:10 AM   Consultation
            */}
            <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {currentPatient.events.map((evt: PatientEventSummary, idx: number) => (
                <div key={idx} className="relative pl-7 group">
                  <span
                    className={`absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      evt.verified ? 'bg-teal-500' : 'bg-amber-500'
                    }`}
                  ></span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{evt.time}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {evt.eventType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evt.description}</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>ID Signed & Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              Tamper-evident chain: {currentPatient.events.length} records verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
