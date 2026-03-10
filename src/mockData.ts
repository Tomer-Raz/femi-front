
import type { ClaimRow, Hospital, PeriodData, ReferenceTable, Rule, UnassignedDoc, User, AuditSummary, Team } from "./types";
import { RunStatus, UserRole } from "./types";

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'צוות אשפוז מרכז', leaderId: '2', memberIds: ['1', '5'], hospitals: ['IC', 'SZ'] },
  { id: 't2', name: 'צוות אמבולטורי צפון', leaderId: null, memberIds: ['8'], hospitals: ['HY'] },
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'ישראל ישראלי', role: UserRole.Auditor, hospitals: ['IC', 'SZ'], teamId: 't1' },
  { id: '2', name: 'שרה כהן', role: UserRole.TeamLead, hospitals: ['IC', 'SZ', 'HY', 'SH'], teamId: 't1' }, // Is leader of t1
  { id: '3', name: 'דני מנהל', role: UserRole.Admin, hospitals: [] },
  { id: '4', name: 'יוסי לוי', role: UserRole.Auditor, hospitals: [], teamId: undefined }, // Inactive - No Team
  { id: '5', name: 'מיכל אברהם', role: UserRole.Auditor, hospitals: ['IC'], teamId: 't1' }, // Active - In Team t1
  { id: '6', name: 'חיים משה', role: UserRole.Auditor, hospitals: [], teamId: undefined }, // Inactive
  { id: '7', name: 'נועה לביא', role: UserRole.TeamLead, hospitals: [], teamId: undefined }, // Inactive Team Lead (Available)
  { id: '8', name: 'רוני סופר', role: UserRole.Auditor, hospitals: ['HY'], teamId: 't2' }, // Active - In Team t2
  { id: '9', name: 'גלית ינאי', role: UserRole.Auditor, hospitals: [], teamId: undefined }, // Inactive
  { id: '10', name: 'אביב גפן', role: UserRole.Auditor, hospitals: [], teamId: undefined }, // Inactive
];

export const MOCK_HOSPITALS: Hospital[] = [
  { id: 1, name: 'איכילוב', code: 'IC', latestPeriod: '06/2025', latestStatus: RunStatus.Completed, lastRunTimestamp: '2025-07-01 10:30', hasPendingUploads: false },
  { id: 2, name: 'שערי צדק', code: 'SZ', latestPeriod: '06/2025', latestStatus: RunStatus.InProgress, lastRunTimestamp: '2025-07-01 09:15', hasPendingUploads: false },
  { id: 3, name: 'הלל יפה', code: 'HY', latestPeriod: '05/2025', latestStatus: RunStatus.Failed, lastRunTimestamp: '2025-06-02 14:00', hasPendingUploads: false },
  { id: 4, name: 'שמיר', code: 'SH', latestPeriod: '04/2025', latestStatus: RunStatus.NotRun, hasPendingUploads: true }, // Marked as pending for demo
];

export const MOCK_MONTHS: PeriodData[] = [
  { period: '06/2025', status: RunStatus.Completed, lastRunTimestamp: '01/07/2025 10:00', hasPendingUploads: false },
  { period: '05/2025', status: RunStatus.Completed, lastRunTimestamp: '01/06/2025 09:30', hasPendingUploads: true }, // Marked as pending for demo
  { period: '04/2025', status: RunStatus.InProgress, lastRunTimestamp: '01/05/2025 16:45', hasPendingUploads: false },
];

export const MOCK_UNASSIGNED: UnassignedDoc[] = [
  { id: 'd1', filename: 'discharge_summary_unknown.pdf', detectedType: 'סיכום שחרור', extractedId: '012345678' },
  { id: 'd2', filename: 'lab_results_1.pdf', detectedType: 'תוצאות מעבדה', extractedVisit: 'V-99999' },
  { id: 'd3', filename: 'invoice_scan_404.pdf', detectedType: 'חשבונית' },
];

export const MOCK_AUDIT_SUMMARY: AuditSummary = {
  files: {
    invoice: true,
    mediaFinancial: true,
    mediaDemographic: true,
    mediaMovements: true,
    mediaDiagnoses: false, // Intentionally missing for demo
  },
  checks: {
    priceMatchInvoiceVsFinancial: true,
  }
};

export const MOCK_CLAIMS: ClaimRow[] = [
  // Row 1: Rejected due to missing commitment (Form 17)
  // Original: Tommy Stern, C0889/5416, Rejected
  { 
    visitNumber: 'V-8801', 
    referralId: 'REF-100199',
    patientId: '034142476', 
    firstName: 'תומר', 
    lastName: 'סלע', 
    treatmentCode: '5416', // תיקון מנח עפעף
    amount: 5416, 
    finalStatus: 'נדחה', 
    systemStatus: 'נדחה',
    missingDocs: ['התחייבות'], // Reason for rejection
    relatedFiles: [
      { id: 'f1', name: 'סיכום_ביקור_מיון.pdf', type: 'pdf', category: 'סיכום רפואי' },
    ],
    isOverridden: false, 
    confidence: 100, 
    startDate: '21/05/2025', 
    endDate: '21/05/2025' 
  },
  
  // Row 2: Paid
  // Original: Vered Lidor Mary, G00M6, Paid
  { 
    visitNumber: 'V-8802', 
    referralId: 'REF-100200',
    patientId: '051632321', 
    firstName: 'ורד', 
    lastName: 'לוי', 
    treatmentCode: 'G00M6', // יום אשפוז מחלקה פנימית
    amount: 3084, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    relatedFiles: [
      { id: 'f2', name: 'טופס_17_מאושר.pdf', type: 'pdf', category: 'התחייבות' },
      { id: 'f3', name: 'מכתב_שחרור.pdf', type: 'pdf', category: 'סיכום רפואי' }
    ],
    isOverridden: false, 
    confidence: 98, 
    startDate: '13/05/2025', 
    endDate: '14/05/2025' 
  },

  // Row 3: Paid
  // Original: Benjamin Bapa, G00H2, Paid. Dates shifted to current view (2025)
  { 
    visitNumber: 'V-8803', 
    referralId: 'REF-100201',
    patientId: '011317720', 
    firstName: 'בנימין', 
    lastName: 'כהן', 
    treatmentCode: 'G00H2', // יום אשפוז כירורגית
    amount: 7726, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    relatedFiles: [], // Empty for demo
    isOverridden: false, 
    confidence: 95, 
    startDate: '26/06/2025', 
    endDate: '28/06/2025' 
  },

  // Row 4: Waiting / Check Required
  // Original: Shumai Twalda, 20767, Waiting. Dates shifted to current view
  { 
    visitNumber: 'V-8804', 
    referralId: 'REF-100202',
    patientId: '046281199', 
    firstName: 'שמעון', 
    lastName: 'טל', 
    treatmentCode: '20767', // כריתת זגוגית העין (Vitrectomy)
    amount: 20767, 
    finalStatus: 'מצריך בדיקה', 
    systemStatus: 'מצריך בדיקה',
    missingDocs: ['דוח ניתוח'], 
    relatedFiles: [
      { id: 'f4', name: 'הפניה_רופא.jpg', type: 'image', category: 'הפניה' }
    ],
    isOverridden: false, 
    confidence: 60, 
    startDate: '03/06/2025', 
    endDate: '08/06/2025' 
  },

  // Row 5-8: Grouped Visit (The Complex Patient)
  // Original: Gingoon Casso (EJ8234974). Dates sequential.
  // Grouped under V-8805
  { 
    visitNumber: 'V-8805', 
    referralId: 'REF-100205',
    patientId: '082349740', 
    firstName: 'גיל', 
    lastName: 'קסוס', 
    treatmentCode: 'G00N9', // תוספת עבור שהייה בטיפול נמרץ
    amount: 6848, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    relatedFiles: [
       { id: 'f5', name: 'תיק_רפואי_מלא.pdf', type: 'pdf', category: 'תיק רפואי' }
    ],
    isOverridden: false, 
    confidence: 99, 
    startDate: '26/06/2025', 
    endDate: '26/06/2025' 
  },
  { 
    visitNumber: 'V-8805', 
    referralId: 'REF-100205',
    patientId: '082349740', 
    firstName: 'גיל', 
    lastName: 'קסוס', 
    treatmentCode: 'G00N1', // יום אשפוז טיפול נמרץ
    amount: 3823, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    isOverridden: false, 
    confidence: 99, 
    startDate: '26/06/2025', 
    endDate: '27/06/2025' 
  },
  { 
    visitNumber: 'V-8805', 
    referralId: 'REF-100205',
    patientId: '082349740', 
    firstName: 'גיל', 
    lastName: 'קסוס', 
    treatmentCode: 'G00H2', // יום אשפוז כללי
    amount: 11802, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    isOverridden: false, 
    confidence: 99, 
    startDate: '27/06/2025', 
    endDate: '30/06/2025' 
  },
  { 
    visitNumber: 'V-8805', 
    referralId: 'REF-100205',
    patientId: '082349740', 
    firstName: 'גיל', 
    lastName: 'קסוס', 
    treatmentCode: 'G00H4', // יום אשפוז כללי (המשך)
    amount: 3421, 
    finalStatus: 'עבר', 
    systemStatus: 'עבר',
    missingDocs: [], 
    isOverridden: false, 
    confidence: 99, 
    startDate: '30/06/2025', 
    endDate: '31/06/2025' 
  },
];

export const MOCK_REF_TABLES: ReferenceTable[] = [
  { id: '1', name: 'מחירון משרד הבריאות', lastUpdated: '01/01/2025', effectiveFrom: '01/2025' },
  { id: '2', name: 'הנחות קופות חולים', lastUpdated: '15/03/2025', effectiveFrom: '04/2025' },
  { id: '3', name: 'טבלת מבוטחים', lastUpdated: '30/06/2025', effectiveFrom: '07/2025' },
  { id: '4', name: 'טבלת התחייבויות קופת חולים', lastUpdated: '01/06/2025', effectiveFrom: '06/2025' },
];

export const MOCK_RULES: Rule[] = [
  { id: 'R-101', text: 'אם קוד אבחנה הוא E10, חובה לצרף בדיקת A1C עדכנית משלושת החודשים האחרונים.', status: 'active', action: 'reject', domain: 'אשפוז', createdBy: 'מערכת', validity: [{ from: '01/2024' }] },
  { id: 'R-102', text: 'ביטול חיוב על חדר מיון אם המטופל אושפז תוך 4 שעות.', status: 'suggestion', action: 'approve', domain: 'מיון', createdBy: 'ישראל ישראלי', validity: [{ from: '06/2025' }] },
  { id: 'R-103', text: 'בדיקת MRI דורשת אישור מנהל מחלקה.', status: 'archived', action: 'review', domain: 'אמבולטורי', createdBy: 'דני מנהל', validity: [{ from: '01/2023', to: '12/2023' }] },
];
