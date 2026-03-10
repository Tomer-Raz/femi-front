
import { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldAlert, Gavel, XCircle, Bot, RotateCcw, Scale, FileText, Download, Eye, Loader2 } from 'lucide-react';
import type { ClaimRow } from '@/types';
import { UserRole } from '@/types';
import type { RowDetailResponse } from '@/service/types';
import { StatusBadge } from './StatusBadge';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { getRowDetail } from '@/service/api';

interface ClaimDrawerProps {
  claim: ClaimRow | null;
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onOverride: (id: string, newStatus: string, reason: string, isRevert?: boolean) => void;
  providerCode: string;
  periodId: number;
  workflow: string;
  rowId: number | null;
  refreshKey?: number;
}

type DrawerMode = 'view' | 'override' | 'rule';
type RuleAction = 'approve' | 'reject' | 'review';

export const ClaimDrawer: React.FC<ClaimDrawerProps> = ({
  claim,
  role,
  isOpen,
  onClose,
  onOverride,
  providerCode,
  periodId,
  workflow,
  rowId,
  refreshKey
}) => {
  const [mode, setMode] = useState<DrawerMode>('view');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<any>('מאושר');

  // Rule Proposal State
  const [ruleText, setRuleText] = useState('');
  const [ruleAction, setRuleAction] = useState<RuleAction>('review');

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', sub: '' });

  // Backend data state
  const [rowDetail, setRowDetail] = useState<RowDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const claimId = claim ? `${claim.visitNumber}-${claim.treatmentCode}` : '';

  // Fetch detailed row data when drawer opens or when refreshKey changes
  useEffect(() => {
    const fetchRowDetail = async () => {
      if (!isOpen || !rowId) return;

      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const data = await getRowDetail(providerCode, periodId, workflow, rowId);
        setRowDetail(data);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'שגיאה בטעינת פרטי התביעה');
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchRowDetail();
  }, [isOpen, rowId, providerCode, periodId, workflow, refreshKey]);

  useEffect(() => {
    if (claim) {
        setMode('view');
        setOverrideReason('');
        setOverrideStatus(claim.isOverridden ? claim.finalStatus : '');
        setShowSuccess(false);
        setRuleText('');
        setRuleAction('review');
    }
  }, [claimId, claim?.isOverridden, claim?.finalStatus]); 

  if (!isOpen || !claim) return null;

  const canOverride = (role === UserRole.Auditor || role === UserRole.TeamLead || role === UserRole.Admin);

  const handleSaveOverride = () => {
    setSuccessMessage({
        title: 'השינוי נשמר בהצלחה',
        sub: 'הסטטוס החדש עודכן במערכת עבור תביעה זו.'
    });
    setShowSuccess(true);
    onOverride(claim.visitNumber, overrideStatus || claim.finalStatus, overrideReason);
    setMode('view');
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleSendRuleProposal = () => {
      setSuccessMessage({
          title: 'הצעת החוק נשלחה',
          sub: 'הצעת החוק הועברה לאישור מנהל המערכת.'
      });
      setShowSuccess(true);
      setMode('view');
      setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleRevert = () => {
      onOverride(claim.visitNumber, 'נדחה', 'Revert to System Decision', true);
      setMode('view');
      setShowSuccess(false);
  };

  const renderFileSection = () => {
    const docs = rowDetail?.documents ?? [];
    const hasFiles = docs.length > 0;

    return (
        <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                מסמכים קשורים
            </h3>
            {!hasFiles ? (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <FileText size={24} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">לא נמצאו מסמכים</p>
                    <p className="text-xs text-slate-400">לא שויכו קבצים למקרה זה</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {docs.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                             <div className="flex items-center gap-3 overflow-hidden">
                                 <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                                     <FileText size={16} />
                                 </div>
                                 <div className="min-w-0">
                                     <p className="text-sm font-medium text-slate-800 truncate" title={doc.original_filename}>{doc.original_filename}</p>
                                     <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-500 font-normal border-slate-200">
                                         {doc.label}
                                     </Badge>
                                 </div>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                     <Eye size={16} />
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                     <Download size={16} />
                                 </Button>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 w-[600px] bg-white shadow-2xl z-40 transform transition-transform duration-300 flex flex-col border-r border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {claim.visitNumber}
                    {(rowDetail?.is_overridden ?? claim.isOverridden) && (
                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 gap-1">
                            <Gavel size={12} /> שונה ידנית
                        </Badge>
                    )}
                </h2>
                <div className="text-sm text-slate-500 mt-1 flex flex-col">
                    <span className="font-medium">{claim.firstName} {claim.lastName} | {claim.patientId}</span>
                    <span className="text-slate-400 font-mono text-xs mt-0.5">התחייבות: {claim.referralId} | קוד שירות: {claim.treatmentCode}</span>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {showSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={20} />
                  <div>
                      <h4 className="font-bold text-sm">{successMessage.title}</h4>
                      <p className="text-xs">{successMessage.sub}</p>
                  </div>
              </div>
          )}
          
          {isLoadingDetail ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : detailError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 text-sm">{detailError}</p>
            </div>
          ) : (
            <>
              {/* Documents Section */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-slate-500" />
                  מסמכים קשורים
                </h3>
                {!rowDetail || rowDetail.documents.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <FileText size={24} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">לא נמצאו מסמכים</p>
                    <p className="text-xs text-slate-400">לא שויכו קבצים למקרה זה</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rowDetail.documents.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate" title={doc.original_filename}>
                              {doc.original_filename}
                            </p>
                            <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-500 font-normal border-slate-200">
                              {doc.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                            <Eye size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Validation Steps */}
              {rowDetail && rowDetail.validation_steps.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-purple-600" />
                    תהליך בדיקת המערכת
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {rowDetail.validation_steps.map((step, idx) => (
                      <div key={idx} className="p-4 flex gap-4">
                        {step.passed ? (
                          <CheckCircle size={20} className="text-emerald-500" />
                        ) : step.passed === false ? (
                          <XCircle size={20} className="text-red-500" />
                        ) : (
                          <ShieldAlert size={20} className="text-slate-400" />
                        )}
                        <div>
                          <h4 className={`text-sm font-bold ${step.passed ? 'text-slate-700' : step.passed === false ? 'text-red-700' : 'text-slate-500'}`}>
                            {step.label}
                          </h4>
                          {step.description && (
                            <p className="text-xs text-slate-500">{step.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* AI Summary */}
              {rowDetail && rowDetail.algorithm_summary && (
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Bot size={16} className="text-amber-600" />
                    סיכום החלטת אלגוריתם
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-slate-800 leading-relaxed">
                    <p>{rowDetail.algorithm_summary}</p>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Override Section Display */}
          {(rowDetail?.is_overridden ?? claim.isOverridden) && (
              <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Gavel size={16} className="text-purple-600" />
                      Override
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-sm space-y-3">
                      {/* Override Date */}
                      {rowDetail?.override_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">תאריך:</span>
                          <span className="text-slate-800 font-mono text-xs">
                            {new Date(rowDetail.override_date).toLocaleString('he-IL', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}

                      {/* Override Reason */}
                      {(rowDetail?.override_reason || claim.overrideReason) && (
                        <div>
                          <span className="text-slate-600 font-medium block mb-1">סיבה:</span>
                          <p className="text-slate-800 bg-white/50 p-2 rounded border border-purple-100">
                            "{rowDetail?.override_reason || claim.overrideReason}"
                          </p>
                        </div>
                      )}

                      {/* Original System Status */}
                      {rowDetail?.original_status && (
                        <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                          <span className="text-slate-600 font-medium">סטטוס מקורי של המערכת:</span>
                          <StatusBadge status={rowDetail.original_status} />
                        </div>
                      )}
                  </div>
              </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-200">
            {mode === 'view' && (
                <div className="space-y-4">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        {/* Row Status */}
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">סטטוס שורה:</span>
                            <StatusBadge status={rowDetail?.row_status || claim.finalStatus} />
                        </div>

                        {/* Match Score - only show if not overridden */}
                        {!(rowDetail?.is_overridden ?? claim.isOverridden) && rowDetail && rowDetail.match_score !== null && (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <span className="text-sm text-slate-500">ציון התאמה:</span>
                            <Badge variant="outline" className="bg-white">
                                {rowDetail.match_score}%
                            </Badge>
                          </div>
                        )}
                     </div>

                     <div className="flex gap-3">
                         {canOverride && (
                             <>
                                <Button className="flex-1 gap-2" variant="outline" onClick={() => setMode('override')}>
                                    <Gavel size={16} />
                                    {claim.isOverridden ? 'ערוך החלטה' : 'Override'}
                                </Button>
                                <Button className="flex-1 gap-2" variant="outline" onClick={() => setMode('rule')}>
                                    <Scale size={16} />
                                    הצעת חוק
                                </Button>
                             </>
                         )}
                         {(rowDetail?.is_overridden ?? claim.isOverridden) && (
                             <Button variant="secondary" onClick={handleRevert} title="שחזר">
                                <RotateCcw size={16} />
                             </Button>
                         )}
                     </div>
                </div>
            )}

            {mode === 'override' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><Gavel size={18} className="text-blue-600"/> שינוי החלטה</h3>
                        <Button variant="link" size="sm" onClick={() => setMode('view')}>ביטול</Button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm flex justify-between items-center">
                         <span className="text-slate-500 font-medium">החלטת מערכת מקורית:</span>
                         <StatusBadge status={claim.systemStatus} />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">סטטוס חדש</label>
                            <div className="flex gap-2">
                                {['עבר', 'נדחה', 'מצריך בדיקה'].map(status => (
                                    <Button 
                                        key={status} 
                                        variant={overrideStatus === status ? 'default' : 'outline'} 
                                        onClick={() => setOverrideStatus(status)}
                                        className="flex-1 h-9"
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">סיבת השינוי</label>
                            <Textarea 
                                placeholder="לדוגמה: קיים אישור מנהל..."
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleSaveOverride} disabled={!overrideStatus || !overrideReason}>
                            שמור החלטה
                        </Button>
                    </div>
                </div>
            )}

            {mode === 'rule' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                         <h3 className="font-bold flex items-center gap-2"><Scale size={18} className="text-blue-600"/> הצעת חוק חדש</h3>
                         <Button variant="link" size="sm" onClick={() => setMode('view')}>ביטול</Button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 mb-1.5 block">תוכן החוק (טקסט חופשי)</label>
                             <Textarea 
                                placeholder="לדוגמה: אם סכום התביעה נמוך מ-500 וקיים אישור, אזי..."
                                value={ruleText}
                                onChange={(e) => setRuleText(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div>
                             <label className="text-xs font-bold text-slate-500 mb-1.5 block">פעולה מוצעת (במידה והחוק מתקיים)</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {[
                                     { id: 'approve', label: 'אישור (עבר)', icon: CheckCircle, className: ruleAction === 'approve' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : '' },
                                     { id: 'reject', label: 'דחייה (נדחה)', icon: XCircle, className: ruleAction === 'reject' ? 'bg-red-50 border-red-200 text-red-700' : '' },
                                     { id: 'review', label: 'לבדיקה', icon: ShieldAlert, className: ruleAction === 'review' ? 'bg-amber-50 border-amber-200 text-amber-700' : '' },
                                 ].map((opt) => (
                                     <div 
                                        key={opt.id}
                                        onClick={() => setRuleAction(opt.id as RuleAction)}
                                        className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${opt.className || 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                     >
                                         <opt.icon size={16} />
                                         <span className="text-xs font-bold">{opt.label}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        <Button className="w-full" onClick={handleSendRuleProposal} disabled={!ruleText}>
                            שלח הצעה
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};
