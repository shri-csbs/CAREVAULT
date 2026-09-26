export type UserRole = 'Admin' | 'Doctor' | 'Nurse/Staff' | 'Reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  badgeId: string;
}

export interface SystemStatusState {
  networkOnline: boolean;
  databaseConnected: boolean;
  hardwareConnected: boolean;
  syncActive: boolean;
  securityActive: boolean;
  lastSync: string;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  localOfflineQueueCount: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  room: string;
  rfidCardId: string;
  rfidVerified: boolean;
  nfcCardId?: string;
  nfcVerified?: boolean;
  assignedDoctor: string;
  assignedNurse: string;
  admissionDate: string;
  condition: 'Stable' | 'Critical' | 'Post-Op' | 'Observation';
  events: PatientEventSummary[];
}

export interface PatientEventSummary {
  id: string;
  time: string;
  date: string;
  eventType: string;
  description: string;
  verified: boolean;
}

export interface ClinicalEvent {
  id: string;
  patientId: string;
  patientName: string;
  eventType: 'Consultation' | 'Medication' | 'Clinical' | 'Vital Check' | 'Lab Order' | 'Surgery Note' | 'Discharge';
  description: string;
  timestamp: string;
  createdTimeOnly: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  status: 'Verified' | 'Conflict' | 'Pending' | 'Flagged';
  securityStatus: 'Protected' | 'Audited';
  hash: string;
  synced: boolean;
}

export interface ReconciliationRecord {
  id: string;
  eventId: string;
  patientId: string;
  patientName: string;
  eventType: string;
  careVaultStatus: string;
  ehrStatus: string;
  result: 'MATCHED' | 'MISSING' | 'DUPLICATE' | 'CONFLICT';
  actionNeeded: boolean;
  priority: 'High' | 'Medium' | 'Low';
  careVaultData: {
    timestamp: string;
    description: string;
    dosage?: string;
    provider: string;
    hash: string;
  };
  ehrData: {
    timestamp: string;
    description: string;
    dosage?: string;
    provider: string;
    sourceSystem: string;
  } | null;
  differenceNote: string;
  status: 'Pending' | 'Resolved';
  resolutionAction?: 'Accepted CareVault' | 'Accepted EHR' | 'Marked Resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  time: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  status: '✓' | 'Warning' | 'Protected';
  hash?: string;
}
