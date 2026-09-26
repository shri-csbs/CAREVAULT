import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Radio,
  Volume2,
  VolumeX,
  Stethoscope,
  Activity,
  RotateCcw,
  Lock,
  ChevronRight,
  BellRing,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { User, AuditLogEntry } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface ClinicianAuthViewProps {
  onAuthenticated: (user: User) => void;
  onAddAuditLog: (entry: AuditLogEntry) => void;
  initialUser?: User;
  onOpenWorkflow?: () => void;
}

export type AuthUiState =
  | 'state1_waiting'          // STATE 1: SYSTEM LOCKED / WAITING FOR AUTHENTICATION
  | 'state2_tap_card'         // STATE 2: TAP ID CARD
  | 'state3_nfc_verified'     // STATE 3: NFC VERIFIED
  | 'state4_fingerprint'      // STATE 4: PLACE FINGERPRINT
  | 'state5_fingerprint_ok'   // STATE 5: FINGERPRINT VERIFIED
  | 'state6_rbac_granted'     // STATE 6: RBAC ACCESS GRANTED
  | 'state7_access_denied'    // STATE 7: ACCESS DENIED (Attempts 1 and 2)
  | 'state8_locked_out'       // STATE 8: CAREVAULT LOCKED — 30 SECOND LOCKOUT (Attempt 3)
  | 'state9_lockout_cleared'; // STATE 9: LOCKOUT CLEARED — START AGAIN

interface ClinicianCardOption {
  user: User;
  cardUid: string;
  cardType: string;
  department: string;
  title: string;
  avatarColor: string;
}

const CLINICIAN_CARDS: ClinicianCardOption[] = [
  {
    user: INITIAL_USERS[0], // Dr. Arun Kumar (Doctor)
    cardUid: '04:A2:8B:1A:E4:6D',
    cardType: 'Smart ID Card (13.56 MHz)',
    department: 'Critical Care / Emergency Med',
    title: 'Attending Physician (Doctor)',
    avatarColor: 'from-teal-600 to-emerald-700',
  },
  {
    user: INITIAL_USERS[1], // Nurse Priya (Nurse)
    cardUid: '04:7F:3C:9E:21:4B',
    cardType: 'Smart ID Card (13.56 MHz)',
    department: 'ICU / Acute Patient Care',
    title: 'Lead Registered Nurse (Nurse)',
    avatarColor: 'from-blue-600 to-indigo-700',
  },
];

export const ClinicianAuthView: React.FC<ClinicianAuthViewProps> = ({
  onAuthenticated,
  onAddAuditLog,
  onOpenWorkflow,
}) => {
  // Authentication 9-state machine
  const [authState, setAuthState] = useState<AuthUiState>('state1_waiting');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState<number>(30);
  const [deniedSecondsRemaining, setDeniedSecondsRemaining] = useState<number>(5);
  const [selectedCard, setSelectedCard] = useState<ClinicianCardOption | null>(null);
  const [denialReason, setDenialReason] = useState<string>('');
  
  // Hardware status simulation
  const [buzzerActive, setBuzzerActive] = useState<boolean>(false);
  const [buzzerMuted, setBuzzerMuted] = useState<boolean>(false);
  const [networkOnline, setNetworkOnline] = useState<boolean>(true);
  const [currentRtcTime, setCurrentRtcTime] = useState<string>('');
  const [isSimulatingSequence, setIsSimulatingSequence] = useState<boolean>(false);

  // Physical Enclosure Tamper Switch state
  const [enclosureTampered, setEnclosureTampered] = useState<boolean>(false);
  const [tamperEventLog, setTamperEventLog] = useState<{ id: string; time: string; status: string } | null>(null);

  // Live RTC clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentRtcTime(
        now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 30-Second Lockout Timer effect (decreases: 00:30, 00:29, ... 00:01, 00:00)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authState === 'state8_locked_out' && lockoutSecondsRemaining > 0) {
      interval = setInterval(() => {
        setLockoutSecondsRemaining((prev) => {
          if (prev <= 1) {
            // When 30 seconds finishes -> State 9: LOCKOUT CLEARED
            setAuthState('state9_lockout_cleared');
            playChirpSound(880, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authState, lockoutSecondsRemaining]);

  // When in State 9 (LOCKOUT CLEARED), automatically return to STEP 1 after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authState === 'state9_lockout_cleared') {
      timer = setTimeout(() => {
        // Reset the authentication process completely
        setFailedAttempts(0);
        setAuthState('state1_waiting');
        setSelectedCard(null);
        setDenialReason('');
        setBuzzerActive(false);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [authState]);

  // When in State 7 (ACCESS DENIED), automatically return to STEP 1 after 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authState === 'state7_access_denied') {
      setDeniedSecondsRemaining(5);
      interval = setInterval(() => {
        setDeniedSecondsRemaining((prev) => {
          if (prev <= 1) {
            setAuthState('state1_waiting');
            setSelectedCard(null);
            setDenialReason('');
            setBuzzerActive(false);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authState]);

  // Handle buzzer timeout during non-lockout states
  useEffect(() => {
    if (buzzerActive && authState !== 'state8_locked_out') {
      const timer = setTimeout(() => {
        setBuzzerActive(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [buzzerActive, authState]);

  // Format seconds to mm:ss countdown display
  const formatCountdown = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tone generator for audio feedback
  const playChirpSound = (frequency: number, durationMs: number) => {
    if (buzzerMuted) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio context may require interaction
    }
  };

  // Transition from State 1 to State 2
  const handleBeginTapCard = () => {
    if (authState === 'state8_locked_out') return;
    setAuthState('state2_tap_card');
    playChirpSound(440, 80);
  };

  // Step 1: Tap NFC / RFID ID Card
  const handleTapCard = (card: ClinicianCardOption) => {
    if (authState === 'state8_locked_out') return; // Disabled during lockout

    setSelectedCard(card);
    setDenialReason('');
    playChirpSound(520, 100);

    // State 3: NFC VERIFIED
    setAuthState('state3_nfc_verified');

    // Automatically transition to State 4: PLACE FINGERPRINT after brief prompt
    setTimeout(() => {
      setAuthState('state4_fingerprint');
      playChirpSound(620, 100);
    }, 700);
  };

  // Step 2: Fingerprint Biometric Placement
  const handleScanFingerprint = (shouldMatch: boolean) => {
    if (authState === 'state8_locked_out') return; // Disabled during lockout
    if (!selectedCard) return;

    playChirpSound(600, 100);

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (shouldMatch) {
        // SUCCESSFUL AUTHENTICATION
        // NFC VERIFIED -> FINGERPRINT VERIFIED -> RBAC VERIFIED -> ACCESS GRANTED
        setAuthState('state5_fingerprint_ok');
        playChirpSound(784, 150);

        setTimeout(() => {
          setAuthState('state6_rbac_granted');
          setFailedAttempts(0); // Reset failed attempts upon success
          setIsSimulatingSequence(false);
          playChirpSound(880, 250);

          onAddAuditLog({
            id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
            time: timeStr,
            userId: selectedCard.user.id,
            userName: selectedCard.user.name,
            userRole: selectedCard.user.role,
            action: `Dual-Factor Clinician Authentication Succeeded (ID Card + Biometric) -> RBAC ${selectedCard.user.role} Granted`,
            target: `ID-CARD [UID: ${selectedCard.cardUid}]`,
            status: '✓',
            hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
          });
        }, 600);
      } else {
        // FAILED AUTHENTICATION
        triggerFailedAttempt('Biometric Minutiae Mismatch: Fingerprint does not match registered clinician ID card');
      }
    }, 700);
  };

  // Trigger a failed attempt following the 3-attempt rule
  const triggerFailedAttempt = (reasonDetail?: string) => {
    if (authState === 'state8_locked_out') return;

    const nextFailed = failedAttempts + 1;
    setFailedAttempts(nextFailed);
    setIsSimulatingSequence(false);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (nextFailed < 3) {
      // ACCESS DENIED — ATTEMPTS 1 AND 2
      // Remain on authentication page. Show [ TRY AGAIN ]. Do NOT grant dashboard access.
      setAuthState('state7_access_denied');
      setBuzzerActive(true);
      playChirpSound(220, 500);
      setDenialReason(reasonDetail || 'Authentication failed. Please verify your ID card and fingerprint.');

      onAddAuditLog({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        userId: selectedCard?.user.id || 'ANONYMOUS',
        userName: selectedCard?.user.name || 'Unknown Clinician',
        userRole: selectedCard?.user.role || 'Doctor',
        action: `Clinician Authentication FAILED (Attempt ${nextFailed} of 3)`,
        target: `ID-CARD-READER [Attempt ${nextFailed}/3]`,
        status: 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    } else {
      // THIRD FAILED ATTEMPT: CAREVAULT LOCKED — 30 SECOND LOCKOUT
      setAuthState('state8_locked_out');
      setLockoutSecondsRemaining(30);
      setBuzzerActive(true);
      playChirpSound(180, 800);
      setDenialReason('Maximum authentication attempts exceeded. CareVault has been temporarily locked for security.');

      onAddAuditLog({
        id: `AUD-LOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        userId: 'SECURITY-DAEMON',
        userName: 'CareVault Edge Sentinel',
        userRole: 'Admin',
        action: 'SECURITY ALERT: Maximum authentication attempts exceeded (3/3). 30-Second Security Lockout Triggered.',
        target: 'AUTHENTICATION-LOCKOUT',
        status: 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    }
  };

  // User clicks [ TRY AGAIN ] after Attempt 1 or 2
  const handleTryAgain = () => {
    // Remain on authentication page, return to Step 1 / Step 2 (Tap ID Card)
    // failedAttempts remains preserved at 1 or 2!
    setAuthState('state2_tap_card');
    setSelectedCard(null);
    setDenialReason('');
    setBuzzerActive(false);
  };

  // Immediate fast-forward for testing convenience (sets remaining seconds to 1)
  const handleFastForwardLockout = () => {
    if (authState === 'state8_locked_out') {
      setLockoutSecondsRemaining(1);
    }
  };

  // Proceed to Dashboard
  const handleProceedToDashboard = () => {
    if (selectedCard && authState === 'state6_rbac_granted') {
      onAuthenticated(selectedCard.user);
    }
  };

  // Toggle Tamper Switch
  const handleToggleTamperSwitch = () => {
    const nextState = !enclosureTampered;
    setEnclosureTampered(nextState);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (nextState) {
      const tamperEvt = {
        id: `T000${Math.floor(1 + Math.random() * 9)}`,
        time: timeStr,
        status: 'ENCLOSURE OPENED',
      };
      setTamperEventLog(tamperEvt);
      setBuzzerActive(true);
      playChirpSound(260, 600);

      onAddAuditLog({
        id: `AUD-TAMP-${Math.floor(100 + Math.random() * 899)}`,
        time: timeStr,
        userId: 'HARDWARE-MONITOR',
        userName: 'Tamper Microswitch',
        userRole: 'Admin',
        action: 'PHYSICAL TAMPER DETECTED: Enclosure microswitch triggered',
        target: 'TAMPER-SWITCH-GPIO27',
        status: 'Warning',
        hash: `0x${Math.floor(Math.random() * 0xffffffffffff).toString(16)}`,
      });
    } else {
      setBuzzerActive(false);
    }
  };

  // Complete Reset back to beginning
  const handleResetAuth = () => {
    if (authState === 'state8_locked_out') return; // Cannot reset during lockout
    setAuthState('state1_waiting');
    setSelectedCard(null);
    setDenialReason('');
    setBuzzerActive(false);
    setIsSimulatingSequence(false);
  };

  // DEMO SIMULATION: Successful Auth
  const handleSimulateSuccessfulAuth = (cardIndex: number) => {
    if (authState === 'state8_locked_out') return;
    setIsSimulatingSequence(true);
    const targetCard = CLINICIAN_CARDS[cardIndex];

    setSelectedCard(targetCard);
    setAuthState('state2_tap_card');
    setDenialReason('');
    playChirpSound(440, 80);

    setTimeout(() => {
      setAuthState('state3_nfc_verified');
      playChirpSound(550, 100);

      setTimeout(() => {
        setAuthState('state4_fingerprint');
        playChirpSound(660, 100);

        setTimeout(() => {
          setAuthState('state5_fingerprint_ok');
          playChirpSound(770, 150);

          setTimeout(() => {
            setAuthState('state6_rbac_granted');
            setFailedAttempts(0);
            setIsSimulatingSequence(false);
            playChirpSound(880, 250);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Helper text and color for state pill
  const getStateInfo = () => {
    switch (authState) {
      case 'state1_waiting':
        return {
          title: 'STATE 1: SYSTEM LOCKED / WAITING FOR AUTHENTICATION',
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          dotColor: 'bg-slate-400',
        };
      case 'state2_tap_card':
        return {
          title: 'STATE 2: TAP ID CARD',
          badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
          dotColor: 'bg-cyan-400 animate-pulse',
        };
      case 'state3_nfc_verified':
        return {
          title: 'STATE 3: NFC VERIFIED',
          badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
        };
      case 'state4_fingerprint':
        return {
          title: 'STATE 4: PLACE FINGERPRINT',
          badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
          dotColor: 'bg-cyan-400 animate-pulse',
        };
      case 'state5_fingerprint_ok':
        return {
          title: 'STATE 5: FINGERPRINT VERIFIED',
          badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
        };
      case 'state6_rbac_granted':
        return {
          title: 'STATE 6: RBAC ACCESS GRANTED',
          badgeColor: 'bg-emerald-900/90 text-emerald-200 border-emerald-400',
          dotColor: 'bg-emerald-400 shadow-sm shadow-emerald-400',
        };
      case 'state7_access_denied':
        return {
          title: `STATE 7: ACCESS DENIED (ATTEMPT ${failedAttempts} OF 3)`,
          badgeColor: 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse',
          dotColor: 'bg-rose-500',
        };
      case 'state8_locked_out':
        return {
          title: 'STATE 8: CAREVAULT LOCKED — 30 SECOND LOCKOUT',
          badgeColor: 'bg-red-950 text-red-200 border-red-500 ring-2 ring-red-500/40 animate-pulse',
          dotColor: 'bg-red-500',
        };
      case 'state9_lockout_cleared':
        return {
          title: 'STATE 9: LOCKOUT CLEARED — START AGAIN',
          badgeColor: 'bg-teal-950/90 text-teal-300 border-teal-500/50',
          dotColor: 'bg-teal-400',
        };
    }
  };

  const stateInfo = getStateInfo();
  const isLockoutActive = authState === 'state8_locked_out';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white font-sans">
      
      {/* HEADER: CAREVAULT SECURE CLINICAL ACCESS */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold tracking-tight text-white text-lg sm:text-xl">
                  CAREVAULT
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 font-bold">
                  DUAL-FACTOR HARDWARE AUTH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Offline Clinical Continuity Gateway • NFC ID + Biometric Verification
              </p>
            </div>
          </div>

          {/* Right Header: Workflow toggle & RTC Clock */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenWorkflow && (
              <button
                onClick={onOpenWorkflow}
                className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Open 9-Step Hardware & Workflow Demonstration"
              >
                <span>9-Step Workflow</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            <div
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 font-mono ${
                networkOnline
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-600/60 text-rose-300'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  networkOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span>{networkOnline ? 'CareVault: ONLINE' : 'CareVault: OFFLINE EDGE'}</span>
            </div>

            <button
              onClick={() => setNetworkOnline(!networkOnline)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
              title="Toggle Network Simulation"
            >
              Toggle Net
            </button>
          </div>
        </div>
      </header>

      {/* STATE INDICATOR BAR (1 of 9 UI States) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">State:</span>
            <div className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-2 ${stateInfo.badgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${stateInfo.dotColor}`} />
              <span>{stateInfo.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Attempt Counter Display */}
            <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              failedAttempts === 0
                ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                : failedAttempts < 3
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
            }`}>
              <span>Attempts:</span>
              <strong className={failedAttempts >= 3 ? 'text-red-400' : failedAttempts > 0 ? 'text-amber-300' : 'text-teal-300'}>
                {failedAttempts} / 3
              </strong>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentRtcTime || 'Syncing...'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center space-y-6">

        {/* 2-Column Balanced Layout: OLED & Hardware Sensors on Left, Authentication Steps on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ======================================================== */}
          {/* LEFT: OLED Simulation Screen & Hardware Device Status   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl shadow-black/50 space-y-4">
            
            {/* 0.96" OLED Simulation Screen */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLockoutActive ? 'bg-rose-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                  TERMINAL DISPLAY
                </span>
                <span className="text-[10px] text-slate-500">CareVault Display</span>
              </div>

              <div className="bg-black rounded-xl p-4 border-2 border-slate-700 shadow-inner relative overflow-hidden font-mono text-cyan-300 text-xs sm:text-sm tracking-wider leading-relaxed select-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />

                {/* OLED Header */}
                <div className="flex items-center justify-between border-b border-cyan-800/60 pb-1 mb-2 text-[11px] text-cyan-400/80">
                  <span>CAREVAULT</span>
                  <span>
                    {isLockoutActive
                      ? '! LOCKED !'
                      : authState === 'state6_rbac_granted'
                      ? 'ONLINE'
                      : 'AUTH'}
                  </span>
                </div>

                {/* OLED Content per State */}
                <div className="min-h-[110px] flex flex-col justify-center">
                  
                  {/* Physical Enclosure Tamper Alert */}
                  {enclosureTampered ? (
                    <div className="text-center py-1 space-y-1">
                      <div className="text-rose-400 font-bold text-sm tracking-widest animate-pulse">
                        ! TAMPER DETECTED !
                      </div>
                      <div className="text-[11px] text-rose-200">ENCLOSURE OPENED</div>
                      <div className="text-[10px] text-rose-300 font-mono">
                        TIME: {tamperEventLog?.time || 'LOGGED'}
                      </div>
                    </div>
                  ) : isLockoutActive ? (
                    /* STATE 8: OLED LOCKOUT DISPLAY */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-rose-400 font-extrabold text-sm tracking-widest animate-pulse uppercase">
                        SYSTEM DENIED
                      </div>
                      <div className="text-[11px] text-rose-300 font-bold uppercase">
                        TRY AFTER 30 SECS
                      </div>
                      <div className="text-xl font-black text-rose-200 tracking-widest pt-1">
                        {formatCountdown(lockoutSecondsRemaining)}
                      </div>
                      <div className="text-[10px] text-rose-400/80 uppercase">
                        TERMINAL LOCKED
                      </div>
                    </div>
                  ) : authState === 'state9_lockout_cleared' ? (
                    /* STATE 9: OLED LOCKOUT CLEARED DISPLAY */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-emerald-400 font-bold text-sm tracking-widest">
                        ✓ LOCKOUT CLEARED
                      </div>
                      <div className="text-xs text-cyan-100">SYSTEM READY</div>
                      <div className="text-[11px] text-emerald-300 pt-1">ATTEMPTS: 0 / 3</div>
                      <div className="text-[10px] text-cyan-400/80">PLEASE TAP ID CARD</div>
                    </div>
                  ) : authState === 'state7_access_denied' ? (
                    /* STATE 7: OLED ACCESS DENIED DISPLAY */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-rose-400 font-bold text-sm tracking-widest animate-pulse">
                        ⚠ ACCESS DENIED
                      </div>
                      <div className="text-xs text-rose-200">AUTH FAILED</div>
                      <div className="text-[11px] text-amber-300 font-bold">
                        ATTEMPT {failedAttempts} OF 3
                      </div>
                      <div className="text-[10px] text-rose-300/80">
                        VERIFY CARD & FINGER
                      </div>
                    </div>
                  ) : authState === 'state1_waiting' ? (
                    /* STATE 1: OLED WAITING DISPLAY */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-cyan-200 font-bold text-sm tracking-widest">
                        SYSTEM LOCKED
                      </div>
                      <div className="text-[11px] text-cyan-400/70">Waiting for Auth...</div>
                      <div className="text-[10px] text-yellow-300 font-bold tracking-wider pt-1 animate-pulse">
                        [ TAP ID CARD ]
                      </div>
                    </div>
                  ) : authState === 'state2_tap_card' ? (
                    /* STATE 2: OLED TAP CARD DISPLAY */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-cyan-200 font-bold text-sm tracking-widest animate-pulse">
                        [ TAP ID CARD ]
                      </div>
                      <div className="text-[11px] text-cyan-400/70">Smart Card Reader</div>
                      <div className="text-[10px] text-cyan-500/50">AWAITING BADGE...</div>
                    </div>
                  ) : authState === 'state3_nfc_verified' && selectedCard ? (
                    /* STATE 3: OLED NFC VERIFIED */
                    <div className="space-y-1 py-1">
                      <div className="text-xs text-emerald-400 font-bold">✓ CARD DETECTED</div>
                      <div className="text-[11px] text-cyan-200 truncate">UID: {selectedCard.cardUid}</div>
                      <div className="text-[11px] text-cyan-300 truncate">NAME: {selectedCard.user.name}</div>
                      <div className="text-[10px] text-emerald-300 font-bold pt-0.5">CARD VERIFIED</div>
                    </div>
                  ) : authState === 'state4_fingerprint' ? (
                    /* STATE 4: OLED PLACE FINGERPRINT */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-xs text-cyan-300 font-bold">CARD: {selectedCard?.user.name.split(' ')[1] || selectedCard?.user.name}</div>
                      <div className="text-sm font-bold text-yellow-300 tracking-wider animate-pulse pt-1">
                        &gt;&gt; PLACE FINGER &lt;&lt;
                      </div>
                      <div className="text-[10px] text-cyan-400/70">Optical Sensor</div>
                    </div>
                  ) : authState === 'state5_fingerprint_ok' ? (
                    /* STATE 5: OLED FINGERPRINT VERIFIED */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-emerald-400 font-bold text-sm tracking-widest">
                        ✓ FINGER MATCH
                      </div>
                      <div className="text-xs text-cyan-100">MINUTIAE MATCHED</div>
                      <div className="text-[10px] text-emerald-300">RBAC CHECK IN PROGRESS</div>
                    </div>
                  ) : authState === 'state6_rbac_granted' && selectedCard ? (
                    /* STATE 6: OLED RBAC ACCESS GRANTED */
                    <div className="text-center py-1 space-y-1">
                      <div className="text-emerald-400 font-bold text-sm tracking-widest">
                        *** ACCESS GRANTED ***
                      </div>
                      <div className="text-xs text-cyan-100 font-semibold">{selectedCard.user.name}</div>
                      <div className="text-[11px] text-emerald-300 font-bold">
                        ROLE: {selectedCard.user.role.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-cyan-400/80">CAREVAULT UNLOCKED</div>
                    </div>
                  ) : null}
                </div>

                {/* OLED Footer */}
                <div className="border-t border-cyan-800/60 pt-1 mt-2 flex items-center justify-between text-[10px] text-cyan-500/70">
                  <span>STATUS: {isLockoutActive ? 'LOCKOUT' : 'SECURE'}</span>
                  <span>ATTEMPTS: {failedAttempts}/3</span>
                </div>
              </div>
            </div>

            {/* SECURITY STATUS SECTION */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>CareVault Security Units</span>
                <span className="text-[10px] text-slate-500">Secure Node CV-01</span>
              </div>

              {/* Security Units Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                
                {/* ID Card Reader */}
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  isLockoutActive
                    ? 'bg-rose-950/70 border-rose-600/80 text-rose-200'
                    : authState === 'state3_nfc_verified' || authState === 'state5_fingerprint_ok' || authState === 'state6_rbac_granted'
                    ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                    : authState === 'state7_access_denied'
                    ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">ID Card Reader</span>
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 font-bold text-xs">
                    {isLockoutActive ? (
                      <span className="text-red-400 font-extrabold animate-pulse">LOCKED</span>
                    ) : authState === 'state3_nfc_verified' ? (
                      <span className="text-emerald-400">✓ VERIFIED</span>
                    ) : authState === 'state2_tap_card' ? (
                      <span className="text-cyan-400 animate-pulse">SCANNING</span>
                    ) : (
                      <span className="text-slate-400">READY</span>
                    )}
                  </div>
                </div>

                {/* Biometric Fingerprint Scanner */}
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  isLockoutActive
                    ? 'bg-rose-950/70 border-rose-600/80 text-rose-200'
                    : authState === 'state5_fingerprint_ok' || authState === 'state6_rbac_granted'
                    ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                    : authState === 'state4_fingerprint'
                    ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                    : authState === 'state7_access_denied'
                    ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">Fingerprint Scanner</span>
                    <Fingerprint className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 font-bold text-xs">
                    {isLockoutActive ? (
                      <span className="text-red-400 font-extrabold animate-pulse">LOCKED</span>
                    ) : authState === 'state5_fingerprint_ok' ? (
                      <span className="text-emerald-400">✓ VERIFIED</span>
                    ) : authState === 'state4_fingerprint' ? (
                      <span className="text-cyan-400 animate-pulse">READY (TOUCH)</span>
                    ) : (
                      <span className="text-slate-400">STANDBY</span>
                    )}
                  </div>
                </div>

                {/* Controller Core */}
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  isLockoutActive
                    ? 'bg-red-950/80 border-red-600 text-red-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">Security Core</span>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-1 font-bold text-xs">
                    {isLockoutActive ? (
                      <span className="text-red-400 font-extrabold animate-pulse">SECURITY LOCKOUT</span>
                    ) : (
                      <span className="text-teal-400">SECURE ACTIVE</span>
                    )}
                  </div>
                </div>

                {/* Buzzer / Alert Indicator */}
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  buzzerActive || isLockoutActive
                    ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">Buzzer / Alert</span>
                    {buzzerActive || isLockoutActive ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <div className="mt-1 font-bold text-xs">
                    {buzzerActive || isLockoutActive ? (
                      <span className="text-rose-400 font-extrabold animate-bounce">ACTIVE</span>
                    ) : (
                      <span className="text-slate-400">IDLE</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* LEDs, Buzzer Mute & Tamper Switch Control */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        authState === 'state6_rbac_granted' || authState === 'state9_lockout_cleared'
                          ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-950 border border-emerald-800'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-400">LED_OK</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLockoutActive || authState === 'state7_access_denied' || buzzerActive || enclosureTampered
                          ? 'bg-rose-500 shadow-lg shadow-rose-500/80 ring-2 ring-rose-500/40 animate-pulse'
                          : 'bg-rose-950 border border-rose-900'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-400">LED_ALERT</span>
                  </div>
                </div>

                <button
                  onClick={() => setBuzzerMuted(!buzzerMuted)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer underline"
                >
                  {buzzerMuted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
              </div>

              {/* Physical Tamper Switch */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <BellRing className={`w-3.5 h-3.5 ${enclosureTampered ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span className={enclosureTampered ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {enclosureTampered ? '⚠ Physical Tamper Detected' : 'Physical Tamper Switch: Secure'}
                  </span>
                </div>
                <button
                  onClick={handleToggleTamperSwitch}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  {enclosureTampered ? 'Reset' : 'Test Tamper'}
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT: Active Authentication Step / Access Flow Panels  */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-4">

            {/* ------------------------------------------------------------------ */}
            {/* STATE 8: SYSTEM DENIED — TRY AFTER 30 SECS (THIRD FAILED ATTEMPT) */}
            {/* ------------------------------------------------------------------ */}
            {isLockoutActive && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 border-2 border-red-600 shadow-2xl shadow-red-950/80 space-y-5 animate-fadeIn">
                
                <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/50 animate-bounce">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight uppercase">
                        SYSTEM DENIED
                      </h2>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider">
                        TRY AFTER 30 SECS
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-red-950 border border-red-500/80 text-red-200 font-mono text-xs font-bold">
                    Attempts: 3 / 3
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-red-800/80 text-center space-y-2">
                  <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-widest">
                    SYSTEM LOCKED FOR SECURITY
                  </div>
                  
                  {/* Countdown Display: 00:30, 00:29, ... 00:00 */}
                  <div className="text-4xl sm:text-5xl font-mono font-black text-red-500 tracking-wider drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    {formatCountdown(lockoutSecondsRemaining)}
                  </div>
                  
                  <p className="text-xs text-slate-300 pt-1 max-w-md mx-auto font-medium">
                    Maximum 3 authentication attempts exceeded.
                  </p>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STATE 9: LOCKOUT CLEARED — START AGAIN                           */}
            {/* ------------------------------------------------------------------ */}
            {authState === 'state9_lockout_cleared' && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border-2 border-emerald-500 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      ✓ LOCKOUT CLEARED
                    </h2>
                    <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                      "Authentication system ready."
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Security Status:</span>
                    <span className="text-emerald-400 font-bold">READY FOR RE-AUTHENTICATION</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Attempt Counter:</span>
                    <span className="text-teal-300 font-bold">Attempts: 0 / 3 (RESET)</span>
                  </div>
                  <p className="text-xs text-slate-400 pt-1">
                    Returning to <strong>STEP 1 — TAP ID CARD</strong>. Please start the dual-factor authentication sequence from the beginning.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    id="start-again-btn"
                    onClick={() => {
                      setFailedAttempts(0);
                      setAuthState('state1_waiting');
                      setSelectedCard(null);
                      setDenialReason('');
                      setBuzzerActive(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-500/20"
                  >
                    <span>[ Start From Beginning — Tap ID Card ]</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STATE 7: ACCESS DENIED (ATTEMPTS 1 AND 2) — 5s AUTO RESET         */}
            {/* ------------------------------------------------------------------ */}
            {authState === 'state7_access_denied' && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-2 border-rose-600 shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        ⚠ ACCESS DENIED
                      </h2>
                      <p className="text-xs text-rose-300 font-semibold mt-0.5">
                        Authentication failed.
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-600 text-rose-200 font-mono text-xs font-bold">
                    Attempt: {failedAttempts} of 3
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-900/60 space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-rose-200">
                    "Authentication failed. Please verify your ID card and fingerprint."
                  </p>
                  <p className="text-[11px] text-slate-400">
                    CareVault security policy: Maximum of 3 attempts before a 30-second hardware lockout is initiated.
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

            {/* ------------------------------------------------------------------ */}
            {/* STATE 1: SYSTEM LOCKED / WAITING FOR AUTHENTICATION                */}
            {/* ------------------------------------------------------------------ */}
            {authState === 'state1_waiting' && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-md">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      SYSTEM LOCKED
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Waiting for Authentication...
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  CareVault is secured in offline clinical continuity mode. To access patient records and record clinical events, clinicians must authenticate via dual-factor NFC ID badge and biometric fingerprint.
                </p>

                <div className="pt-2">
                  <button
                    id="begin-auth-btn"
                    onClick={handleBeginTapCard}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>[ Tap Clinician ID Card to Begin ]</span>
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STATE 2: TAP ID CARD (SELECTION / TAPPING)                          */}
            {/* ------------------------------------------------------------------ */}
            {(authState === 'state2_tap_card' || authState === 'state3_nfc_verified') && (
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-400" />
                      STEP 1 — TAP ID CARD
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select or tap clinician NFC ID card on the reader
                    </p>
                  </div>

                  <button
                    onClick={handleResetAuth}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Clinician Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CLINICIAN_CARDS.map((card) => {
                    const isSelected = selectedCard?.user.id === card.user.id;
                    const isDoctor = card.user.role === 'Doctor';

                    return (
                      <button
                        key={card.user.id}
                        id={`tap-card-${card.user.id.toLowerCase()}`}
                        disabled={isLockoutActive}
                        onClick={() => handleTapCard(card)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/60 border-teal-500 ring-2 ring-teal-500/30 shadow-lg shadow-teal-500/10'
                            : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.avatarColor} flex items-center justify-center text-white shadow-md shrink-0`}
                          >
                            {isDoctor ? <Stethoscope className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate group-hover:text-teal-300">
                              {card.user.name}
                            </div>
                            <div className="text-[11px] text-teal-400 font-semibold truncate">{card.user.role}</div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="truncate">UID: {card.cardUid.slice(0, 8)}...</span>
                          {isSelected && <span className="text-emerald-400 font-bold">Tapped ✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* NFC Verified Confirmation Pill in State 3 */}
                {authState === 'state3_nfc_verified' && selectedCard && (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span><strong>✓ NFC VERIFIED:</strong> {selectedCard.user.name} ({selectedCard.cardUid})</span>
                    </div>
                    <span className="text-[11px] text-cyan-300 animate-pulse">Advancing to Fingerprint...</span>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STATE 4 & 5: PLACE FINGERPRINT / FINGERPRINT VERIFIED              */}
            {/* ------------------------------------------------------------------ */}
            {(authState === 'state4_fingerprint' || authState === 'state5_fingerprint_ok') && selectedCard && (
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-cyan-400" />
                      STEP 2 — PLACE FINGERPRINT
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Place registered clinician finger on optical sensor
                    </p>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
                    NFC: ✓ OK
                  </span>
                </div>

                {/* Fingerprint Interactive Pad */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        authState === 'state5_fingerprint_ok'
                          ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300'
                          : 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-500/20 animate-pulse'
                      }`}
                    >
                      <Fingerprint className="w-8 h-8" />
                      <div className="absolute inset-x-2 top-2 h-0.5 bg-cyan-300 shadow-[0_0_8px_#22d3ee] rounded-full animate-bounce" />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">
                        {authState === 'state5_fingerprint_ok' ? '✓ FINGERPRINT VERIFIED' : 'Awaiting Biometric Placement'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Clinician: <strong className="text-white">{selectedCard.user.name}</strong> ({selectedCard.user.role})
                      </div>
                    </div>
                  </div>

                  {/* Actions for testing: Matching finger vs Mismatched finger */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="place-matching-finger-btn"
                      disabled={isLockoutActive}
                      onClick={() => handleScanFingerprint(true)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Place Matching Finger</span>
                    </button>

                    <button
                      id="simulate-failed-attempt-btn"
                      disabled={isLockoutActive}
                      onClick={() => handleScanFingerprint(false)}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-slate-700 hover:border-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="Triggers failed attempt (1 of 3, 2 of 3, or lockout on 3 of 3)"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Test Failed Attempt</span>
                    </button>
                  </div>

                </div>

                {/* State 5 Confirmation */}
                {authState === 'state5_fingerprint_ok' && (
                  <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span><strong>✓ FINGERPRINT VERIFIED:</strong> Minutiae matched with ID badge. Evaluating RBAC credentials...</span>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STATE 6: RBAC ACCESS GRANTED (SUCCESSFUL AUTHENTICATION)            */}
            {/* ------------------------------------------------------------------ */}
            {authState === 'state6_rbac_granted' && selectedCard && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl space-y-4 animate-fadeIn">
                
                {/* 4 Verification Badges as specified in the prompt */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ✓ NFC VERIFIED
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ✓ FINGERPRINT VERIFIED
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ✓ RBAC VERIFIED
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    ✓ ACCESS GRANTED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-200 font-mono text-xs pt-2 border-t border-emerald-900/60">
                  <div>
                    <span className="text-slate-400 text-[10px]">Clinician:</span>
                    <strong className="block text-white text-xs truncate">{selectedCard.user.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Role:</span>
                    <strong className="block text-teal-300 text-xs">{selectedCard.user.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Badge UID:</span>
                    <strong className="block text-slate-300 text-xs font-mono">{selectedCard.cardUid}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Security Integrity:</span>
                    <strong className="block text-emerald-400 text-xs">SHA-256 HASH CHAIN</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="enter-carevault-dashboard-btn"
                    onClick={handleProceedToDashboard}
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>Enter CareVault Clinical Continuity Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* DEMO CONTROLS: FOR TESTING ALL AUTHENTICATION FLOWS */}
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-400 tracking-wider">
                    DEMO SIMULATOR
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Test Security Features
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Click to test state flows
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                
                {/* 1. Simulate Doctor Auth Success */}
                <button
                  id="demo-simulate-doctor-success-btn"
                  disabled={isLockoutActive || isSimulatingSequence}
                  onClick={() => handleSimulateSuccessfulAuth(0)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-teal-950/80 hover:text-teal-300 border border-slate-700 hover:border-teal-600 transition-all flex items-center gap-2 text-left cursor-pointer text-slate-200"
                >
                  <Stethoscope className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-white text-xs truncate">Simulate Success (Doctor)</div>
                    <div className="text-[10px] text-slate-400">Pass NFC + Biometric</div>
                  </div>
                </button>

                {/* 2. Simulate 1 Failed Attempt */}
                <button
                  id="demo-simulate-failed-attempt-btn"
                  disabled={isLockoutActive}
                  onClick={() => triggerFailedAttempt()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700 hover:border-rose-600 transition-all flex items-center gap-2 text-left cursor-pointer text-slate-200"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-white text-xs truncate">Trigger Failed Attempt</div>
                    <div className="text-[10px] text-slate-400">Advance 1 of 3, 2 of 3</div>
                  </div>
                </button>

                {/* 3. Direct 3rd Failed Attempt (30s Lockout) */}
                <button
                  id="demo-trigger-lockout-direct-btn"
                  disabled={isLockoutActive}
                  onClick={() => {
                    setFailedAttempts(2);
                    triggerFailedAttempt();
                  }}
                  className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 transition-all flex items-center gap-2 text-left cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-white text-xs truncate">Trigger 30s Lockout</div>
                    <div className="text-[10px] text-rose-300">Test 3/3 Lockout State</div>
                  </div>
                </button>

              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            CareVault Secure Clinician Authentication Gateway • 3 Failed Attempts ➔ 30-Second Lockout Security Flow
          </div>
          <div className="font-mono text-slate-400">
            Security: ID Card • Biometric Fingerprint • Secure Controller • Tamper Detection
          </div>
        </div>
      </footer>

    </div>
  );
};
