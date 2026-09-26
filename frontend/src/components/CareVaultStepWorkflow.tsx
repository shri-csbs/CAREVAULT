import React, { useState, useEffect } from 'react';
import {
  Lock,
  CreditCard,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Radio,
  HardDrive,
  Stethoscope,
  Activity,
  User as UserIcon,
  Search,
  FileText,
  PlusCircle,
  Clock,
  AlertOctagon,
  ChevronRight,
  Volume2,
  VolumeX,
  UserPlus,
  X,
} from 'lucide-react';
import { User, Patient, ClinicalEvent, AuditLogEntry } from '../types';
import { INITIAL_USERS, INITIAL_PATIENTS, formatPatientDisplayName } from '../data/mockData';

export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface CareVaultStepWorkflowProps {
  onCompleteAuth: (user: User) => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
  onAddClinicalEvent: (event: ClinicalEvent) => void;
  patients: Patient[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onExitToFullDashboard: () => void;
  onAddPatient?: (patient: Patient) => void;
}

export const CareVaultStepWorkflow: React.FC<CareVaultStepWorkflowProps> = ({
  onCompleteAuth,
  onAddAuditLog,
  onAddClinicalEvent,
  patients,
  currentUser,
  onSwitchUser,
  onExitToFullDashboard,
  onAddPatient,
}) => {
  // Step state (1 to 9)
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>(1);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [selectedClinician, setSelectedClinician] = useState<User>(INITIAL_USERS[0]); // Default: Dr. Arun Kumar
  const [cyberAttackTriggered, setCyberAttackTriggered] = useState<boolean>(false);
  const [cyberAttackBanner, setCyberAttackBanner] = useState<boolean>(false);
  const [buzzerMuted, setBuzzerMuted] = useState<boolean>(false);
  const [rtcTime, setRtcTime] = useState<string>('');

  // Hardware Authentication Failed Attempts & 30-Second Lockout state
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState<number>(30);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [showAccessDenied, setShowAccessDenied] = useState<boolean>(false);
  const [deniedSecondsRemaining, setDeniedSecondsRemaining] = useState<number>(5);
  const [showLockoutCleared, setShowLockoutCleared] = useState<boolean>(false);

  // 5-Second auto-reset after ACCESS DENIED back to Step 1 (System Locked / Tap ID Card)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAccessDenied && deniedSecondsRemaining > 0) {
      interval = setInterval(() => {
        setDeniedSecondsRemaining((prev) => {
          if (prev <= 1) {
            setShowAccessDenied(false);
            setCurrentStep(1);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAccessDenied, deniedSecondsRemaining]);

  // 30-Second Lockout countdown effect (00:30 down to 00:00)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLockedOut && lockoutSecondsRemaining > 0) {
      interval = setInterval(() => {
        setLockoutSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setShowLockoutCleared(true);
            setFailedAttempts(0);
            playBeep(880, 250);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutSecondsRemaining]);

  // When lockout is cleared, transition back to Step 1 after brief notification
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showLockoutCleared) {
      timer = setTimeout(() => {
        setShowLockoutCleared(false);
        setCurrentStep(1);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showLockoutCleared]);

  // Handle hardware authentication failure (Attempts 1, 2, and 30s Lockout on 3)
  const handleSimulateFailedAuth = () => {
    if (isLockedOut) return;
    const nextFailed = failedAttempts + 1;
    setFailedAttempts(nextFailed);
    playBeep(220, 500);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (nextFailed < 3) {
      setShowAccessDenied(true);
      setDeniedSecondsRemaining(5);
      onAddAuditLog({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        userId: selectedClinician.id,
        userName: selectedClinician.name,
        userRole: selectedClinician.role,
        action: `Clinician Authentication FAILED (Attempt ${nextFailed} of 3)`,
        target: `ID-READER [${selectedClinician.badgeId}]`,
        status: 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    } else {
      setShowAccessDenied(false);
      setIsLockedOut(true);
      setLockoutSecondsRemaining(30);
      playBeep(180, 800);
      onAddAuditLog({
        id: `AUD-LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        userId: 'SECURITY-DAEMON',
        userName: 'CareVault Sentinel',
        userRole: 'Admin',
        action: 'SECURITY ALERT: Maximum 3 authentication attempts exceeded. 30-Second Lockout initiated.',
        target: 'AUTHENTICATION-LOCKOUT',
        status: 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    }
  };

  // Patient List state (includes newly registered patients)
  const [patientList, setPatientList] = useState<Patient[]>(patients);
  useEffect(() => {
    setPatientList(patients);
  }, [patients]);

  // Step 6 & 7: Selected Patient (Default: Aarav Kumar or first patient)
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0] || INITIAL_PATIENTS[0]);
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');

  // Step 5: New Patient from previous hospital registration state
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<number>(45);
  const [newPatientGender, setNewPatientGender] = useState<string>('Female');
  const [newPatientBloodType, setNewPatientBloodType] = useState<string>('B+');
  const [newPatientRoom, setNewPatientRoom] = useState<string>('Ward-202 / Bed 04');
  const [newPatientCondition, setNewPatientCondition] = useState<'Stable' | 'Critical' | 'Post-Op' | 'Observation'>('Stable');
  const [newPatientAllergies, setNewPatientAllergies] = useState<string>('Penicillin');
  const [newPatientPrevHospital, setNewPatientPrevHospital] = useState<string>('St. Jude Metropolitan Hospital');
  const [newPatientPrevNotes, setNewPatientPrevNotes] = useState<string>('Transferred with previous diagnosis of acute cholecystitis; initial ultrasound completed at referring facility.');
  const [newPatientSuccessMsg, setNewPatientSuccessMsg] = useState<string>('');

  // Step 8: Clinical Event Form State & Additional Medication
  const [eventType, setEventType] = useState<'Medication' | 'Vital Check' | 'Clinical'>('Medication');
  const [eventDescription, setEventDescription] = useState<string>('Administered IV Ceftriaxone 1g for infection prophylaxis.');
  const [dosage, setDosage] = useState<string>('1g IV Infusion');
  const [additionalMedication, setAdditionalMedication] = useState<string>('Tab Metformin 500mg BD, Atorvastatin 20mg HS');
  const [lastSavedAdditionalMeds, setLastSavedAdditionalMeds] = useState<string>('');
  const [lastSavedEventHash, setLastSavedEventHash] = useState<string>('0x7f4e9a1b2c3d5e89');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>('');

  // Clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setRtcTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio chirp feedback
  const playBeep = (freq: number, duration: number) => {
    if (buzzerMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Auto-play timer for presentation mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAuto) {
      timer = setTimeout(() => {
        if (currentStep < 9) {
          goToStep((currentStep + 1) as WorkflowStepId);
        } else {
          setIsPlayingAuto(false);
        }
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAuto, currentStep]);

  // Navigate to step with appropriate feedback
  const goToStep = (step: WorkflowStepId) => {
    setCurrentStep(step);
    if (step === 2) {
      playBeep(440, 100);
    } else if (step === 3) {
      playBeep(580, 120);
    } else if (step === 4) {
      playBeep(880, 250);
      onCompleteAuth(selectedClinician);
      onAddAuditLog({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        userId: selectedClinician.id,
        userName: selectedClinician.name,
        userRole: selectedClinician.role,
        action: `Authentication Successful (ID Card + Biometric) -> ${selectedClinician.role} Logged In`,
        target: `ID-READER [${selectedClinician.badgeId}]`,
        status: '✓',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    } else if (step === 9) {
      playBeep(920, 200);
    }
  };

  // Trigger Cyber Attack Simulation
  const handleSimulateCyberAttack = () => {
    setCyberAttackTriggered(true);
    setCyberAttackBanner(true);
    playBeep(260, 500);

    onAddAuditLog({
      id: `AUD-ATTACK-${Math.floor(100 + Math.random() * 899)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: 'SECURITY-DAEMON',
      userName: 'Hospital Firewall Sentinel',
      userRole: 'Admin',
      action: 'CYBER ATTACK IDENTIFIED: Central Cloud Server Offline. CareVault Edge Mode Initiated.',
      target: 'CENTRAL-EHR-GATEWAY',
      status: 'Warning',
      hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
    });

    // Move directly to Step 1: System Locked
    setCurrentStep(1);

    setTimeout(() => {
      setCyberAttackBanner(false);
    }, 6000);
  };

  // Handle registering new patient from previous hospital record
  const handleRegisterNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newId = `PAT-${Math.floor(100 + Math.random() * 900)}`;
    const newIdCard = `IDC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPatient: Patient = {
      id: newId,
      name: formatPatientDisplayName(newPatientName.trim()),
      age: Number(newPatientAge) || 40,
      gender: newPatientGender,
      bloodType: newPatientBloodType,
      allergies: newPatientAllergies.split(',').map((a) => a.trim()).filter(Boolean),
      room: newPatientRoom.trim() || 'Ward-202 / Bed 04',
      rfidCardId: newIdCard,
      rfidVerified: true,
      assignedDoctor: selectedClinician.name,
      assignedNurse: 'Nurse Priya',
      admissionDate: new Date().toISOString().slice(0, 10),
      condition: newPatientCondition,
      events: [
        {
          id: `EVT-INIT-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          eventType: 'Admission',
          description: `Admission via Transfer from ${newPatientPrevHospital || 'Referring Hospital'}. Prior notes: ${newPatientPrevNotes.trim() || 'Patient registered from prior hospital medical record.'}`,
          verified: true,
        },
      ],
    };

    setPatientList((prev) => [newPatient, ...prev]);
    if (onAddPatient) {
      onAddPatient(newPatient);
    }
    setSelectedPatient(newPatient);
    setIsNewPatientModalOpen(false);
    setNewPatientSuccessMsg(`New patient ${newPatient.name} registered successfully from prior hospital record!`);

    onAddAuditLog({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: selectedClinician.id,
      userName: selectedClinician.name,
      userRole: selectedClinician.role,
      action: `New Patient Registered from Previous Hospital Record (${newPatientPrevHospital}): ${newPatient.name}`,
      target: `PATIENT [${newPatient.id}]`,
      status: '✓',
      hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
    });
  };

  // Handle saving clinical event in Step 8
  const handleSaveEvent = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = `${now.toISOString().slice(0, 10)} ${timeStr}`;
    const randomHash = `0x${Math.floor(Math.random() * 0xffffffffffffff).toString(16)}`;
    const additionalMedsNote = additionalMedication.trim()
      ? ` | Additional Meds Taken: ${additionalMedication.trim()}`
      : '';

    const newEvent: ClinicalEvent = {
      id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      eventType: eventType,
      description: `${eventDescription} (Dosage: ${dosage})${additionalMedsNote}`,
      timestamp: fullDateStr,
      createdTimeOnly: timeStr,
      authorId: selectedClinician.id,
      authorName: selectedClinician.name,
      authorRole: selectedClinician.role,
      status: 'Verified',
      securityStatus: 'Protected',
      hash: randomHash,
      synced: false,
    };

    onAddClinicalEvent(newEvent);
    setLastSavedEventHash(randomHash);
    setLastSavedTimestamp(timeStr);
    setLastSavedAdditionalMeds(additionalMedication.trim());

    onAddAuditLog({
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      time: timeStr,
      userId: selectedClinician.id,
      userName: selectedClinician.name,
      userRole: selectedClinician.role,
      action: `Clinical Event Recorded Offline: ${eventType} for ${selectedPatient.name}`,
      target: `PATIENT [${selectedPatient.id}]`,
      status: '✓',
      hash: randomHash,
    });

    // Transition to Step 9
    goToStep(9);
  };

  // Step definitions matching the photo
  const STEP_DETAILS = [
    { num: 1, title: '1. System Locked', oled: 'CAREVAULT\nTAP ID CARD', subtitle: 'Waiting for Authentication' },
    { num: 2, title: '2. Tap ID Card', oled: `CARD DETECTED\n${selectedClinician.name.split(' ')[1] || selectedClinician.name}`, subtitle: 'Card Detected' },
    { num: 3, title: '3. Place Fingerprint', oled: 'CAREVAULT\nPLACE FINGER', subtitle: 'Fingerprint Prompt' },
    { num: 4, title: '4. Authentication Successful', oled: 'ACCESS GRANTED\nCAREVAULT', subtitle: 'Access Granted' },
    { num: 5, title: '5. CareVault Dashboard', oled: 'CAREVAULT\nONLINE', subtitle: 'Dashboard After Login' },
    { num: 6, title: '6. Access Patient Details', oled: 'PATIENT LOOKUP\nACTIVE', subtitle: 'Patient Search Results' },
    { num: 7, title: '7. Patient Information', oled: 'PATIENT DATA\nVERIFIED', subtitle: 'Critical Information (PLR)' },
    { num: 8, title: '8. Record a Clinical Event', oled: 'RECORDING EVENT\nEDGE STORAGE', subtitle: 'Record Event' },
    { num: 9, title: '9. Event Saved (Offline)', oled: 'EVENT SAVED\nSHA-256 HASH', subtitle: 'Event Saved Confirmation' },
  ];

  const currentStepInfo = STEP_DETAILS[currentStep - 1];

  // Filter patients for Step 6
  const filteredPatients = patientList.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.room.toLowerCase().includes(patientSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* TOP HEADER: CareVault Status Bar & Cyber Attack Simulator */}
      <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/20 shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-base sm:text-lg leading-none">
                  CAREVAULT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 font-bold leading-none">
                  OFFLINE CLINICAL CONTINUITY
                </span>
              </div>
            </div>
          </div>

          {/* Clinician Selector, Simulator & Navigation Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Clinician Toggle (Dr. Arun Kumar / Nurse Priya) */}
            <div className="h-9 px-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-2 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Clinician:</span>
              <select
                value={selectedClinician.id}
                onChange={(e) => {
                  const found = INITIAL_USERS.find((u) => u.id === e.target.value);
                  if (found) {
                    setSelectedClinician(found);
                    onSwitchUser(found);
                  }
                }}
                className="bg-transparent text-teal-300 font-semibold cursor-pointer text-xs focus:outline-none pr-1"
              >
                {INITIAL_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* CYBER ATTACK SIMULATION BUTTON */}
            <button
              id="simulate-cyber-attack-btn"
              onClick={handleSimulateCyberAttack}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-2 ${
                cyberAttackTriggered
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80'
              }`}
              title="Click to simulate central hospital cloud ransomware/outage"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Simulate Cyber Attack</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setBuzzerMuted(!buzzerMuted)}
              className="h-9 w-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={buzzerMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {buzzerMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            </button>

            {/* Visual Divider */}
            <div className="h-5 w-px bg-slate-700/80 mx-0.5 hidden sm:block"></div>

            <button
              onClick={onExitToFullDashboard}
              className="h-9 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white border border-teal-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <span>Main Hospital App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CYBER ATTACK ALERT BANNER (Triggers on button click) */}
      {cyberAttackBanner && (
        <div className="bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 border-b border-rose-600 px-4 py-3 text-white text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-rose-950/50">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-300 animate-bounce shrink-0" />
            <div className="flex-1">
              <span className="font-extrabold uppercase tracking-wide text-rose-200">
                🚨 ATTACK IDENTIFIED! Central Hospital EHR Server Compromised:
              </span>{' '}
              Hospital WAN disconnected. CareVault Offline Continuity System activated for clinical resilience. Please tap your ID card to access local records.
            </div>
            <button
              onClick={() => setCyberAttackBanner(false)}
              className="text-xs text-rose-200 hover:text-white underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 9-STEP WORKFLOW CONTROLLER BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Step Pills 1 to 9 */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {STEP_DETAILS.map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  id={`workflow-step-btn-${step.num}`}
                  onClick={() => goToStep(step.num as WorkflowStepId)}
                  className={`h-8 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30 ring-1 ring-teal-300'
                      : isPast
                      ? 'bg-slate-800/90 text-teal-300 border border-teal-500/30 hover:bg-slate-800'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-slate-950 text-teal-300' : isPast ? 'bg-teal-900 text-teal-300' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span>{step.title.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Stepper Controls: Prev / Next / Auto-Play / Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => goToStep(Math.max(1, currentStep - 1) as WorkflowStepId)}
              disabled={currentStep === 1}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => goToStep(Math.min(9, currentStep + 1) as WorkflowStepId)}
              disabled={currentStep === 9}
              className="h-8 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlayingAuto(!isPlayingAuto)}
              className={`h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAuto
                  ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Automatically advance through all 9 presentation stages"
            >
              {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingAuto ? 'Pause Auto' : 'Auto Play'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlayingAuto(false);
                setCurrentStep(1);
              }}
              className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY: Web App Page */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        {/* Step Title Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentStepInfo.title}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              CareVault Online
            </span>
            <span className="text-slate-600">|</span>
            <span>System Clock: {rtcTime || 'Active'}</span>
          </div>
        </div>

        {/* ========================================================== */}
        {/* WEB APPLICATION SCREEN (MATCHING EACH STEP - FULL WIDTH)   */}
        {/* ========================================================== */}
        <div className="w-full max-w-5xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Blue CareVault Header Bar */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-5 py-3.5 border-b border-blue-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
                <Stethoscope className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">CAREVAULT</h3>
                <p className="text-[10px] text-blue-200">Clinical Continuity When It Matters Most</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentStep >= 4 ? (
                <div className="text-right">
                  <div className="text-xs font-bold text-white">Welcome, {selectedClinician.name}</div>
                  <div className="text-[10px] text-teal-300 font-mono">Role: {selectedClinician.role}</div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-blue-200 font-mono bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-700/60">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>System Locked</span>
                </div>
              )}
            </div>
          </div>

          {/* System Terminal Status Banner on the Website - TOP LEFT ONLY */}
          <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">System Status:</span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-cyan-300 border border-teal-500/30 font-bold text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                {currentStep === 1 && 'AWAITING ID CARD • TAP ID CARD'}
                {currentStep === 2 && `CARD IDENTIFIED: ${selectedClinician.name} (${selectedClinician.badgeId})`}
                {currentStep === 3 && 'PLACE FINGERPRINT • SCANNING FINGERPRINT'}
                {currentStep === 4 && `ACCESS GRANTED • ${selectedClinician.role.toUpperCase()} UNLOCKED`}
                {currentStep === 5 && 'DASHBOARD ONLINE • LOCAL DATABASE READY'}
                {currentStep === 6 && `PATIENT LOOKUP • ${selectedPatient.name} (${selectedPatient.id})`}
                {currentStep === 7 && `PATIENT DOSSIER VERIFIED • ${selectedPatient.name}`}
                {currentStep === 8 && `RECORDING CLINICAL EVENT • ${eventType}`}
                {currentStep === 9 && 'EVENT SECURELY SAVED • LOCAL ENCRYPTED LOG'}
              </span>
            </div>
          </div>

          {/* SCREEN CONTENT AREA FOR CURRENT STEP (1 to 9) */}
          <div className="p-6 flex-1 flex flex-col justify-center">

              {/* ---------------------------------------------------- */}
              {/* LOCKOUT DISPLAY OVERRIDE: SYSTEM DENIED TRY AFTER 30 SECS */}
              {/* ---------------------------------------------------- */}
              {isLockedOut && (
                <div className="max-w-md mx-auto w-full text-center space-y-5 p-7 rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 border-2 border-red-600 shadow-2xl animate-fadeIn">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/60">
                    <Lock className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">SYSTEM DENIED</h3>
                    <p className="text-sm font-extrabold text-red-400 uppercase tracking-wider mt-1">TRY AFTER 30 SECS</p>
                    <p className="text-xs text-slate-300 mt-2 font-medium">
                      Maximum 3 authentication attempts exceeded.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/70 border border-red-800 text-center">
                    <div className="text-[11px] font-mono text-red-400 font-bold tracking-wider">LOCKED</div>
                    <div className="text-4xl font-mono font-black text-red-500 tracking-wider">
                      {`00:${lockoutSecondsRemaining.toString().padStart(2, '0')}`}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* LOCKOUT CLEARED NOTIFICATION                         */}
              {/* ---------------------------------------------------- */}
              {!isLockedOut && showLockoutCleared && (
                <div className="max-w-md mx-auto w-full text-center space-y-4 p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border-2 border-emerald-500 shadow-xl animate-fadeIn">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">✓ LOCKOUT CLEARED</h3>
                    <p className="text-xs text-emerald-300 font-semibold mt-1">"Authentication system ready."</p>
                    <div className="text-xs font-mono text-teal-300 font-bold mt-1">Attempts: 0 / 3</div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowLockoutCleared(false);
                        setCurrentStep(1);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>[ Start From Beginning — Tap ID Card ]</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* ACCESS DENIED STATE (ATTEMPTS 1 AND 2) — 5s AUTO RESET */}
              {/* ---------------------------------------------------- */}
              {!isLockedOut && !showLockoutCleared && showAccessDenied && (
                <div className="max-w-md mx-auto w-full text-center space-y-4 p-6 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-2 border-rose-600 shadow-xl animate-fadeIn">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
                    <AlertOctagon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">⚠ ACCESS DENIED</h3>
                    <p className="text-xs text-rose-300 font-semibold mt-1">Authentication failed.</p>
                    <div className="text-xs font-mono text-amber-300 font-bold mt-1">
                      Attempt: {failedAttempts} of 3
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      "Authentication failed. Please verify your ID card and fingerprint."
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="py-2.5 px-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-300 font-mono text-xs flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400 animate-spin" />
                      <span>Returning to System Lock in {deniedSecondsRemaining}s...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 1: SYSTEM LOCKED - WAITING FOR AUTHENTICATION  */}
              {/* ---------------------------------------------------- */}
              {!isLockedOut && !showLockoutCleared && !showAccessDenied && currentStep === 1 && (
                <div className="max-w-md mx-auto w-full text-center space-y-5 animate-fadeIn">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-950/60 border border-blue-700/60 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-950/50">
                    <Lock className="w-10 h-10 text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">SYSTEM LOCKED</h3>
                    <p className="text-xs text-slate-400 mt-1">Waiting for Authentication...</p>
                  </div>

                  <div className="pt-2">
                    <button
                      id="step1-tap-card-action"
                      onClick={() => goToStep(2)}
                      className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>[ Tap Clinician ID Card ]</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 2: TAP ID CARD -> CARD DETECTED                */}
              {/* ---------------------------------------------------- */}
              {!isLockedOut && !showLockoutCleared && !showAccessDenied && currentStep === 2 && (
                <div className="max-w-md mx-auto w-full text-center space-y-5 animate-fadeIn">
                  <div className="p-5 rounded-2xl bg-slate-800/80 border border-teal-500/50 shadow-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-teal-400 font-mono border-b border-slate-700 pb-2">
                      <span>✓ CARD DETECTED / IDENTIFIED</span>
                    </div>

                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
                        <Stethoscope className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-white">{selectedClinician.name}</div>
                        <div className="text-xs text-teal-300 font-semibold">{selectedClinician.role}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Badge ID: <strong className="text-slate-200">{selectedClinician.badgeId}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/80 flex items-center justify-center gap-2 text-xs text-yellow-300 font-bold animate-pulse">
                      <Fingerprint className="w-4 h-4" />
                      <span>Please place your finger on the biometric scanner</span>
                    </div>
                  </div>

                  <div>
                    <button
                      id="step2-place-finger-action"
                      onClick={() => goToStep(3)}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>[ Place Fingerprint on Biometric Scanner ]</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 3: PLACE FINGERPRINT                           */}
              {/* ---------------------------------------------------- */}
              {!isLockedOut && !showLockoutCleared && !showAccessDenied && currentStep === 3 && (
                <div className="max-w-md mx-auto w-full text-center space-y-5 animate-fadeIn">
                  <div className="relative w-24 h-24 mx-auto rounded-3xl bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-2xl shadow-cyan-500/30 ring-4 ring-cyan-500/20">
                    <Fingerprint className="w-14 h-14 animate-pulse" />
                    {/* Animated Scanning Beam */}
                    <div className="absolute inset-x-2 top-2 h-1 bg-cyan-300 shadow-[0_0_12px_#22d3ee] rounded-full animate-bounce" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">BIOMETRIC VERIFICATION</h3>
                    <p className="text-xs text-cyan-300 font-semibold mt-1">Verifying Clinician Fingerprint...</p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      id="step3-verify-action"
                      onClick={() => {
                        setFailedAttempts(0);
                        setShowAccessDenied(false);
                        goToStep(4);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>[ Verify Fingerprint ➔ Grant Access ]</span>
                    </button>

                    <button
                      id="step3-failed-auth-action"
                      onClick={handleSimulateFailedAuth}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700 hover:border-rose-600 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      title="Simulates failed biometric match to test 3-attempt lockout security behavior"
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>[ Test Failed Authentication / Mismatch ]</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 4: AUTHENTICATION SUCCESSFUL                   */}
              {/* ---------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="max-w-md mx-auto w-full text-center space-y-5 animate-fadeIn">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">ACCESS GRANTED</h3>
                    <p className="text-sm font-semibold text-emerald-300 mt-1">
                      Welcome, {selectedClinician.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Role-Based Access: <strong>{selectedClinician.role}</strong> • Offline Edge Node Unlocked
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      id="step4-proceed-dashboard-action"
                      onClick={() => goToStep(5)}
                      className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <span>Enter CareVault Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 5: CAREVAULT DASHBOARD (AFTER LOGIN)           */}
              {/* ---------------------------------------------------- */}
              {currentStep === 5 && (
                <div className="w-full space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        CareVault Clinical Continuity Dashboard
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Logged in as: <strong className="text-teal-300">{selectedClinician.name}</strong> ({selectedClinician.role})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setIsNewPatientModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ New Patient Entry</span>
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-mono font-bold">
                        ● Offline Mode
                      </span>
                    </div>
                  </div>

                  {/* New Patient Registration Success Notification */}
                  {newPatientSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{newPatientSuccessMsg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goToStep(7)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          View PLR ➔
                        </button>
                        <button
                          onClick={() => setNewPatientSuccessMsg('')}
                          className="text-emerald-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5 Dashboard Action Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* New Patient Registration Card */}
                    <div
                      onClick={() => setIsNewPatientModalOpen(true)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-800 to-slate-900 border border-teal-500/40 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-teal-300">
                            New Patient Entry
                          </div>
                          <div className="text-xs text-slate-400">Transfer from other hospital</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-teal-400 flex items-center gap-1 font-semibold">
                        <span>Register Patient</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Patient Lookup Card */}
                    <div
                      onClick={() => goToStep(6)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Search className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-teal-300">
                            Patient Lookup
                          </div>
                          <div className="text-xs text-slate-400">Search patient bed tags & PLR</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-teal-400 flex items-center gap-1 font-semibold">
                        <span>Access Records</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Record Event Card */}
                    <div
                      onClick={() => goToStep(8)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-cyan-500 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-cyan-300">
                            Record Clinical Event
                          </div>
                          <div className="text-xs text-slate-400">Log vitals, meds & consultations</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-cyan-400 flex items-center gap-1 font-semibold">
                        <span>New Clinical Entry</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Offline Storage Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 sm:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Local Edge Storage</div>
                          <div className="text-xs text-slate-400">MicroSD secure SQLite partition • Offline clinical continuity</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Available Space: 28.4 GB • Encrypted
                      </div>
                    </div>

                  </div>

                  {/* Modal: New Patient Entry from Previous Hospital */}
                  {isNewPatientModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                      <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-5 max-w-xl w-full shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                              <UserPlus className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-white text-sm">New Patient Entry</h4>
                              <p className="text-[11px] text-slate-400">Create patient profile from another hospital's record</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsNewPatientModalOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleRegisterNewPatient} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Patient Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                placeholder="e.g. Aarav Kumar"
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Age & Gender
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={newPatientAge}
                                  onChange={(e) => setNewPatientAge(Number(e.target.value))}
                                  className="w-20 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                                />
                                <select
                                  value={newPatientGender}
                                  onChange={(e) => setNewPatientGender(e.target.value)}
                                  className="flex-1 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Blood Group
                              </label>
                              <select
                                value={newPatientBloodType}
                                onChange={(e) => setNewPatientBloodType(e.target.value)}
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Ward / Bed
                              </label>
                              <input
                                type="text"
                                value={newPatientRoom}
                                onChange={(e) => setNewPatientRoom(e.target.value)}
                                placeholder="Ward-102 / Bed 04"
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Triage Condition
                              </label>
                              <select
                                value={newPatientCondition}
                                onChange={(e) => setNewPatientCondition(e.target.value as any)}
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              >
                                <option value="Stable">Stable</option>
                                <option value="Observation">Observation</option>
                                <option value="Post-Op">Post-Op</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Known Allergies
                              </label>
                              <input
                                type="text"
                                value={newPatientAllergies}
                                onChange={(e) => setNewPatientAllergies(e.target.value)}
                                placeholder="Penicillin, Sulfa, None"
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                                Previous Hospital Name
                              </label>
                              <input
                                type="text"
                                value={newPatientPrevHospital}
                                onChange={(e) => setNewPatientPrevHospital(e.target.value)}
                                placeholder="City General Hospital"
                                className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                              Previous Record Summary / Diagnosis Notes
                            </label>
                            <textarea
                              rows={2}
                              value={newPatientPrevNotes}
                              onChange={(e) => setNewPatientPrevNotes(e.target.value)}
                              placeholder="Clinical diagnosis, surgical notes, past treatment records from prior facility..."
                              className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 resize-none"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setIsNewPatientModalOpen(false)}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Save & Register Patient</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      id="step5-next-btn"
                      onClick={() => goToStep(6)}
                      className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <span>Next: Access Patient Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 6: ACCESS PATIENT DETAILS (SEARCH RESULTS)     */}
              {/* ---------------------------------------------------- */}
              {currentStep === 6 && (
                <div className="w-full space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Patient Search Results</h3>
                      <p className="text-xs text-slate-400">
                        Select a patient to access their Patient Liaison Record (PLR)
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, bed, ID..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Patient List (Featuring all patients) */}
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {filteredPatients.map((patient) => {
                      const isSelected = selectedPatient.id === patient.id;

                      return (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40 shadow-md'
                              : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{patient.name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-teal-300">
                                  {patient.id}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {patient.age} yrs • {patient.gender} • Room: <strong>{patient.room}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 font-mono text-[11px]">
                              Blood: {patient.bloodType}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(patient);
                                goToStep(7);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span>View PLR</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400">
                      Selected: <strong className="text-white">{selectedPatient.name}</strong>
                    </span>
                    <button
                      id="step6-proceed-info-btn"
                      onClick={() => goToStep(7)}
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Next: Patient Information (PLR)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 7: PATIENT INFORMATION (PLR / CRITICAL INFO)   */}
              {/* ---------------------------------------------------- */}
              {currentStep === 7 && (
                <div className="w-full space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Patient Liaison Record (PLR) • Critical Information
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cryptographically certified offline medical dossier
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-mono">
                      ✓ ID Card: {selectedPatient.rfidCardId || selectedPatient.nfcCardId}
                    </span>
                  </div>

                  {/* Patient Info Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Patient</span>
                      <div className="text-sm font-bold text-white mt-0.5">{selectedPatient.name}</div>
                      <div className="text-xs text-slate-400">{selectedPatient.age} yrs • {selectedPatient.gender}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Clinical Location</span>
                      <div className="text-sm font-bold text-white mt-0.5">{selectedPatient.room}</div>
                      <div className="text-xs text-teal-400 font-semibold">{selectedPatient.condition}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Blood & Allergies</span>
                      <div className="text-sm font-bold text-white mt-0.5">Blood Type: {selectedPatient.bloodType}</div>
                      <div className="text-xs text-rose-300 font-semibold">
                        Allergies: {selectedPatient.allergies.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>

                  {/* Bedside Vitals (Matching PLR format) */}
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Recorded Bedside Vitals (Last Checked Today)
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">BLOOD PRESSURE</span>
                        <strong className="text-white text-sm">120/80</strong>
                        <span className="text-[10px] text-slate-400 block">mmHg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">HEART RATE</span>
                        <strong className="text-teal-300 text-sm">74</strong>
                        <span className="text-[10px] text-slate-400 block">bpm (Normal)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">OXYGEN (SpO2)</span>
                        <strong className="text-cyan-300 text-sm">99%</strong>
                        <span className="text-[10px] text-slate-400 block">Room air</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-mono">TEMPERATURE</span>
                        <strong className="text-white text-sm">98.6°F</strong>
                        <span className="text-[10px] text-slate-400 block">Oral</span>
                      </div>
                    </div>
                  </div>

                  {/* Action to Record Event */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => goToStep(6)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                    >
                      ← Back to Search
                    </button>

                    <button
                      id="step7-record-event-btn"
                      onClick={() => goToStep(8)}
                      className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Record a Clinical Event</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 8: RECORD A CLINICAL EVENT                     */}
              {/* ---------------------------------------------------- */}
              {currentStep === 8 && (
                <div className="w-full space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Record Clinical Event</h3>
                      <p className="text-xs text-slate-400">
                        Patient: <strong className="text-teal-300">{selectedPatient.name}</strong> ({selectedPatient.id})
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      Edge Buffer: Ready
                    </span>
                  </div>

                  {/* Event Form */}
                  <div className="space-y-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                          Event Classification
                        </label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'Medication' | 'Vital Check' | 'Clinical')}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="Medication">Medication Administration</option>
                          <option value="Vital Check">Bedside Vital Check</option>
                          <option value="Clinical">Attending Doctor Assessment</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                          Dosage / Value
                        </label>
                        <input
                          type="text"
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          placeholder="e.g. 1g IV Infusion"
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                        Clinical Observation / Procedure Details
                      </label>
                      <textarea
                        rows={2}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                        Additional Medication Taken by Patient
                      </label>
                      <input
                        type="text"
                        value={additionalMedication}
                        onChange={(e) => setAdditionalMedication(e.target.value)}
                        placeholder="e.g. Prior home medications, oral antibiotics, antihypertensives, insulin, etc."
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Certified by: <strong className="text-teal-300">{selectedClinician.name}</strong></span>
                      <span>Target: {selectedPatient.room}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => goToStep(7)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                    >
                      ← Back to PLR
                    </button>

                    <button
                      id="step8-save-event-btn"
                      onClick={handleSaveEvent}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>Save Event to Offline Edge Node</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* STEP 9: EVENT SAVED (OFFLINE)                       */}
              {/* ---------------------------------------------------- */}
              {currentStep === 9 && (
                <div className="max-w-md mx-auto w-full text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-950/70 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">EVENT RECORDED</h3>
                    <p className="text-xs font-semibold text-emerald-300 mt-0.5">
                      Event Saved (Offline) • CareVault Local Database
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-emerald-500/40 text-left text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patient:</span>
                      <strong className="text-white">{selectedPatient.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Event Type:</span>
                      <strong className="text-teal-300">{eventType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clinician:</span>
                      <strong className="text-slate-200">{selectedClinician.name}</strong>
                    </div>
                    {lastSavedAdditionalMeds && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Additional Meds:</span>
                        <strong className="text-emerald-300">{lastSavedAdditionalMeds}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Local Timestamp:</span>
                      <strong className="text-slate-200">{lastSavedTimestamp || 'Recorded Just Now'}</strong>
                    </div>
                    <div className="pt-1 border-t border-slate-700/80 flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400">SHA-256 Event Hash:</span>
                      <span className="text-[10px] text-teal-400 break-all">{lastSavedEventHash}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      id="step9-record-another-btn"
                      onClick={() => goToStep(8)}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      + Record Another Event
                    </button>

                    <button
                      id="step9-enter-full-app-btn"
                      onClick={onExitToFullDashboard}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Sync with hospital app</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          {/* CareVault Footer Bar */}
          <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800/80 flex items-center text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span>Terminal Status:</span>
              <span className="text-cyan-400 font-bold">"{currentStepInfo.oled.replace('\n', ' ')}"</span>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            CareVault Offline Continuity Web System • Hospital Resilience Portal
          </div>
          <div className="font-mono text-slate-400">
            System Terminal: CV-WEB-01 • Zero Cloud Dependency
          </div>
        </div>
      </footer>

    </div>
  );
};
