

export const UserRole = {
  Auditor: 'Auditor',
  TeamLead: 'TeamLead',
  Admin: 'Admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  name: string;
  role: UserRole;
  hospitals: string[]; // Codes of hospitals they can see
  teamId?: string; // Optional link to a team
}

export interface Team {
  id: string;
  name: string;
  leaderId: string | null; // Must be a TeamLead
  memberIds: string[]; // List of Auditors
  hospitals: string[]; // List of Hospital codes assigned to this team
}

export const RunStatus = {
  NotRun: 'לא רץ',
  InProgress: 'בתהליך',
  Completed: 'הסתיים',
  Failed: 'נכשל',
} as const;

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

export interface Hospital {
  id: number;
  name: string;
  code: string;
  latestPeriod: string;
  latestStatus: RunStatus;
  lastRunTimestamp?: string;
  hasPendingUploads?: boolean; // New flag for UI indication
}

export interface PeriodData {
  id: number;
  period: string; // MM/YYYY
  status: RunStatus;
  lastRunTimestamp?: string;
  hasPendingUploads?: boolean; // New flag for UI indication
}

export interface UnassignedDoc {
  id: string;
  filename: string;
  detectedType: string;
  extractedId?: string;
  extractedVisit?: string;
}

export interface ClaimFile {
  id: string;
  name: string;
  type: string; // e.g., 'pdf', 'jpg'
  category: string; // e.g., 'Release Letter', 'Lab Result'
}

export interface ClaimRow {
  id: number; // hospitalization PK — used to call the detail endpoint
  visitNumber: string;
  referralId: string; // מספר הפנייה
  patientId: string;
  firstName: string;
  lastName: string;
  treatmentCode: string;
  amount: number;
  finalStatus: 'עבר' | 'נדחה' | 'מצריך בדיקה';
  systemStatus: 'עבר' | 'נדחה' | 'מצריך בדיקה'; // Original algorithm decision
  missingDocs: string[]; // Empty if none
  relatedFiles?: ClaimFile[]; // Files associated with this specific claim
  isOverridden: boolean;
  overrideReason?: string; // Reason for manual override
  overrideBy?: string; // Name of the auditor who overrode
  overrideDate?: string; // ISO string timestamp of override
  confidence: number;
  startDate: string; // DD/MM/YYYY
  endDate: string;   // DD/MM/YYYY
}

export interface ReferenceTable {
  id: string;
  name: string;
  lastUpdated: string;
  effectiveFrom: string;
}

export interface Rule {
  id: string;
  text: string;
  status: 'active' | 'suggestion' | 'archived' | 'rejected';
  action: 'approve' | 'reject' | 'review'; // New: What to do if rule is met
  domain: string;
  createdBy: string;
  validity: { from: string; to?: string }[];
}

export interface AuditSummary {
  files: {
    invoice: boolean;
    mediaFinancial: boolean;
    mediaDemographic: boolean;
    mediaMovements: boolean;
    mediaDiagnoses: boolean;
  };
  checks: {
    priceMatchInvoiceVsFinancial: boolean; // התאמת מחיר בין חשבונית לבין קובץ מדיה כספי
  };
}
