import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Shield,
  Download,
  X,
} from 'lucide-react';
import { ClinicalEvent } from '../types';

interface EventHistoryViewProps {
  events: ClinicalEvent[];
}

export const EventHistoryView: React.FC<EventHistoryViewProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<ClinicalEvent | null>(null);

  // Extract unique filter lists
  const patients = Array.from(new Set(events.map((e) => e.patientId)));
  const eventTypes = Array.from(new Set(events.map((e) => e.eventType)));
  const authors = Array.from(new Set(events.map((e) => e.authorName)));

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPatient = patientFilter === 'ALL' || e.patientId === patientFilter;
    const matchesType = typeFilter === 'ALL' || e.eventType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesUser = userFilter === 'ALL' || e.authorName === userFilter;
    const matchesDate =
      dateFilter === 'ALL' ||
      (dateFilter === 'TODAY' && e.timestamp.includes('2026-09-19'));

    return matchesSearch && matchesPatient && matchesType && matchesStatus && matchesUser && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Patient ID', 'Patient Name', 'Event Type', 'Timestamp', 'Status', 'Author', 'Hash'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.patientId,
      e.patientName,
      e.eventType,
      e.createdTimeOnly,
      e.status,
      e.authorName,
      e.hash,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carevault-event-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="event-history-container" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              Event History
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {filteredEvents.length} records matching
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Display all clinical events in a tamper-verifiable, searchable ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar: Patient, Event type, Date, Status, User */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Filters & Search</span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="event-history-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Event ID, Patient ID, Name, or Description keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* 5 Filter Dropdowns as requested */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Patient Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Patient</label>
            <select
              id="filter-patient-select"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 font-mono"
            >
              <option value="ALL">All Patients</option>
              {patients.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Event Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event Type</label>
            <select
              id="filter-event-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Event Types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
            <select
              id="filter-date-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today (2026-09-19)</option>
              <option value="PAST7">Past 7 Days</option>
            </select>
          </div>

          {/* 4. Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Verified">✓ Verified</option>
              <option value="Conflict">⚠ Conflict</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* 5. User Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">User / Author</label>
            <select
              id="filter-user-select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Authors</option>
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table matching prompt specifications:
          Event ID | Patient | Event Type | Timestamp | Status
          EVT001   | PAT001  | Consultation | 10:30     | ✓ Verified
          EVT002   | PAT002  | Medication   | 10:42     | ✓ Verified
          EVT003   | PAT001  | Clinical     | 11:05     | ⚠ Conflict
      */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-mono">Event ID</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4 font-mono">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Author / Staff</th>
                <th className="py-3.5 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No clinical events matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    id={`event-row-${evt.id}`}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {evt.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono">{evt.patientId}</div>
                      <div className="text-[11px] text-slate-600">{evt.patientName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {evt.createdTimeOnly}
                    </td>
                    <td className="py-3.5 px-4">
                      {evt.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ✓ Verified
                        </span>
                      ) : evt.status === 'Conflict' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          ⚠ Conflict
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{evt.authorName}</div>
                      <div className="text-[10px] text-slate-600">{evt.authorRole}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(evt);
                        }}
                        className="text-xs text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Shield className="w-3 h-3" />
                        <span>Inspect Hash</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Event Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  {selectedEvent.id}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedEvent.status === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedEvent.status === 'Verified' ? '✓ Verified' : '⚠ Conflict'}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 font-semibold block">Patient</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedEvent.patientId} — {selectedEvent.patientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Event Type</span>
                  <span className="font-semibold text-slate-800">{selectedEvent.eventType}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Clinical Description</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Record Verification ID:</span>
                  <span className="text-emerald-400">VERIFIED ID RECORD</span>
                </div>
                <div className="text-teal-300 break-all">{selectedEvent.hash}</div>
                <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800 flex items-center justify-between">
                  <span>Author: {selectedEvent.authorName} ({selectedEvent.authorId})</span>
                  <span>Time: {selectedEvent.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
