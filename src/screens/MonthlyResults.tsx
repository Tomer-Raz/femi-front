import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { ClaimRow, AuditSummary } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardWorkflowResults, updateRowDetail } from '@/service/api';
import type { WorkflowResultsResponse } from '@/service/types';
import { ClaimDrawer } from '@/components/ClaimDrawer';
import { StatusBadge } from '@/components/StatusBadge';
import { AuditOverview } from '@/components/claims/AuditOverview';
import { ClaimsTable } from '@/components/claims/ClaimsTable';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

// Icons
import { ArrowRight, Search, FileWarning, Loader2 } from 'lucide-react';

interface LocationState {
  providerId: number;
  providerName: string;
  periodId: number;
}

const TAB_TO_WORKFLOW: Record<string, string> = {
  'אשפוז': 'HSP',
  'אמבולטורי': 'AMB',
};

/** Map Hebrew status labels to backend status codes */
const STATUS_LABEL_TO_CODE: Record<string, string> = {
  'עבר': 'approved',
  'נדחה': 'rejected',
  'ממתין': 'pending',
  'מצריך בדיקה': 'needs_review',
  'בבדיקה': 'needs_review',
};

/** Convert YYYY-MM-DD to DD/MM/YYYY */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return '-';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Map backend source_files array to the AuditSummary.files shape */
function mapSourceFiles(sourceFiles: WorkflowResultsResponse['source_files']): AuditSummary['files'] {
  const lookup: Record<string, boolean> = {};
  for (const sf of sourceFiles) {
    lookup[sf.file_type] = sf.received;
  }
  return {
    invoice: lookup['invoice'] ?? false,
    mediaFinancial: lookup['billing'] ?? false,
    mediaDemographic: lookup['demographics'] ?? false,
    mediaMovements: lookup['transfers'] ?? false,
    mediaDiagnoses: lookup['diagnoses'] ?? false,
  };
}

/** Map backend matching_checks to AuditSummary.checks */
function mapMatchingChecks(checks: WorkflowResultsResponse['matching_checks']): AuditSummary['checks'] {
  const totalMatch = checks.find(c => c.check_name === 'total_amount_match');
  return {
    priceMatchInvoiceVsFinancial: totalMatch?.passed ?? false,
  };
}

/** Map backend HospitalizationRowEntry[] to ClaimRow[] with row IDs */
function mapRowsToClaims(rows: WorkflowResultsResponse['rows']): Array<ClaimRow & { rowId: number }> {
  return rows.map(row => {
    let firstName = '';
    let lastName = '';
    if (row.patient_name) {
      const parts = row.patient_name.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ');
    }

    return {
      id: row.id,
      rowId: row.id,
      visitNumber: row.hospitalization_number,
      referralId: row.referral_number ?? '',
      patientId: row.id_number,
      firstName,
      lastName,
      treatmentCode: row.service_code ?? '',
      amount: row.amount ?? 0,
      finalStatus: row.row_status as ClaimRow['finalStatus'],
      systemStatus: row.row_status as ClaimRow['systemStatus'],
      missingDocs: row.missing_documents,
      isOverridden: row.is_overridden,
      confidence: 0,
      startDate: formatDate(row.admission_date),
      endDate: formatDate(row.discharge_date),
    };
  });
}

export const MonthlyResults: React.FC = () => {
  const { hospitalCode, month } = useParams<{ hospitalCode: string; month: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('אשפוז');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<ClaimRow | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  // API data state
  const [resultsData, setResultsData] = useState<WorkflowResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async (workflow: string) => {
    if (!hospitalCode || !state?.periodId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardWorkflowResults(hospitalCode, state.periodId, workflow);
      setResultsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת התוצאות');
    } finally {
      setIsLoading(false);
    }
  }, [hospitalCode, state?.periodId]);

  // Fetch on mount and when tab changes
  useEffect(() => {
    const workflow = TAB_TO_WORKFLOW[activeTab] ?? 'HSP';
    fetchResults(workflow);
  }, [activeTab, fetchResults]);

  // Map API data to component props
  const currentAuditSummary: AuditSummary = useMemo(() => {
    if (!resultsData) {
      return {
        files: { invoice: false, mediaFinancial: false, mediaDemographic: false, mediaMovements: false, mediaDiagnoses: false },
        checks: { priceMatchInvoiceVsFinancial: false },
      };
    }
    return {
      files: mapSourceFiles(resultsData.source_files),
      checks: mapMatchingChecks(resultsData.matching_checks),
    };
  }, [resultsData]);

  const claims = useMemo(() => {
    if (!resultsData) return [];
    return mapRowsToClaims(resultsData.rows);
  }, [resultsData]);

  const hasFinancialData = currentAuditSummary.files.mediaFinancial;

  const handleOverride = async (_visitNum: string, newStatus: any, reason: string, isRevert: boolean = false) => {
    if (!selectedClaim || !currentUser || !hospitalCode || !state?.periodId || selectedRowId === null) return;

    try {
      const workflow = TAB_TO_WORKFLOW[activeTab] ?? 'HSP';

      // Convert Hebrew status label to backend status code
      const statusCode = isRevert ? null : (STATUS_LABEL_TO_CODE[newStatus] || newStatus);

      // Call backend API to update the row - this returns the updated row data
      const updatedRowData = await updateRowDetail(
        hospitalCode,
        state.periodId,
        workflow,
        selectedRowId,
        {
          status: statusCode,
          override_reason: isRevert ? null : reason,
        }
      );

      // Refresh the results list to show updated data in the table
      await fetchResults(workflow);

      // Update the selected claim with fresh backend data
      let firstName = '';
      let lastName = '';
      if (updatedRowData.patient_name) {
        const parts = updatedRowData.patient_name.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ');
      }

      const updatedClaim: ClaimRow = {
        id: updatedRowData.id,
        visitNumber: updatedRowData.hospitalization_number,
        referralId: updatedRowData.referral_number ?? '',
        patientId: updatedRowData.id_number,
        firstName,
        lastName,
        treatmentCode: updatedRowData.service_code ?? '',
        amount: updatedRowData.amount ?? 0,
        finalStatus: updatedRowData.row_status as ClaimRow['finalStatus'],
        // Use original_status from backend if available, otherwise keep systemStatus
        systemStatus: (updatedRowData.original_status || selectedClaim.systemStatus) as ClaimRow['systemStatus'],
        missingDocs: updatedRowData.missing_documents,
        isOverridden: updatedRowData.is_overridden,
        // Override info now comes from backend, but keep for backward compatibility
        overrideReason: updatedRowData.override_reason || undefined,
        overrideBy: undefined, // We don't need this in claim, it's in rowDetail
        overrideDate: updatedRowData.override_date || undefined,
        confidence: updatedRowData.match_score ?? 0,
        startDate: formatDate(updatedRowData.admission_date),
        endDate: formatDate(updatedRowData.discharge_date),
      };

      setSelectedClaim(updatedClaim);

      // Trigger refetch of detail data in drawer
      setDetailRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update override:', err);
      // TODO: Show error toast/notification
    }
  };

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch =
        c.visitNumber.includes(searchQuery) ||
        c.firstName.includes(searchQuery) ||
        c.lastName.includes(searchQuery) ||
        c.patientId.includes(searchQuery) ||
        c.referralId.includes(searchQuery);

      let matchesStatus = true;
      if (statusFilter === 'passed') matchesStatus = c.finalStatus === 'עבר';
      else if (statusFilter === 'not_passed') matchesStatus = c.finalStatus !== 'עבר';

      return matchesSearch && matchesStatus;
    });
  }, [claims, searchQuery, statusFilter]);

  // Missing periodId state — redirect back
  if (!state?.periodId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50" dir="rtl">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">חסר מזהה תקופה</h1>
          <p className="text-slate-600 mb-6">נא לחזור לדשבורד ולנסות שוב.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-6 py-5 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/hospitals/${hospitalCode}`, { state: { providerId: state.providerId, providerName: state.providerName } })} className="hover:bg-slate-100 text-slate-500">
              <ArrowRight className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                {resultsData?.provider_name ?? state.providerName}
                <span className="text-slate-300 font-light text-xl">|</span>
                <span className="font-mono text-xl">{resultsData?.period ?? month}</span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <StatusBadge status={resultsData?.run_status ?? 'הסתיים'} />
                {resultsData?.last_updated && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>עודכן: {resultsData.last_updated}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 flex">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-auto bg-transparent p-0 gap-8 justify-start">
              <TabsTrigger
                value="אשפוז"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 font-bold text-base text-slate-500 hover:text-slate-700"
              >
                אשפוז
              </TabsTrigger>
              <TabsTrigger
                value="אמבולטורי"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 font-bold text-base text-slate-500 hover:text-slate-700"
              >
                אמבולטורי
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => fetchResults(TAB_TO_WORKFLOW[activeTab] ?? 'HSP')}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                נסה שוב
              </button>
            </div>
          )}

          {/* Data loaded */}
          {!isLoading && !error && resultsData && (
            <>
              {/* Summary Section */}
              <AuditOverview auditSummary={currentAuditSummary} activeTab={activeTab as any} />

              {/* Warning when billing file is missing */}
              {!hasFinancialData && (
                <Card className="border-dashed flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 mb-4">
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <FileWarning className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">קובץ המדיה הכספי חסר</h3>
                  <p className="text-slate-500 text-sm">נתוני חיוב עשויים להיות חלקיים. המערכת אינה יכולה לבצע בקרה מלאה.</p>
                </Card>
              )}

              {/* Claims table or empty state */}
              {claims.length > 0 ? (
                <div className="space-y-4">
                  {/* Filter Bar */}
                  <div className="flex justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="חיפוש לפי ת.ז, שם, ביקור או הפנייה..."
                        className="pr-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">סינון:</span>
                      <div className="relative">
                        <select
                          className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">הצג הכל</option>
                          <option value="passed">עבר בלבד</option>
                          <option value="not_passed">לא עבר (נדחה/בדיקה)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Claims Table */}
                  <ClaimsTable
                    claims={filteredClaims}
                    onRowClick={(c) => {
                      setSelectedClaim(c);
                      setSelectedRowId((c as any).rowId);
                      setIsDrawerOpen(true);
                    }}
                  />
                </div>
              ) : (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                  <p className="text-slate-500">לא נמצאו נתוני תביעות לתקופה זו.</p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {currentUser && hospitalCode && state?.periodId && (
        <ClaimDrawer
          claim={selectedClaim}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          role={currentUser.role}
          onOverride={handleOverride}
          providerCode={hospitalCode}
          periodId={state.periodId}
          workflow={TAB_TO_WORKFLOW[activeTab] ?? 'HSP'}
          rowId={selectedRowId}
          refreshKey={detailRefreshKey}
        />
      )}
    </div>
  );
};
