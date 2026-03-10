
import React, { useState } from 'react';
import { Check, X, FolderOpen, Scale, BadgeCent, FileText, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AuditSummary } from '@/types';

interface AuditOverviewProps {
    auditSummary: AuditSummary;
    activeTab: 'אשפוז' | 'אמבולטורי';
}

const FileRow = ({ label, exists }: { label: string, exists: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b last:border-0 border-slate-100 hover:bg-slate-50/50 px-2 rounded transition-colors">
        <span className="text-slate-700 font-medium text-sm flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            {label}
        </span>
        <div>
            {exists ? (
                <Badge variant="success" className="gap-1">
                    <Check size={12} />
                    התקבל
                </Badge>
            ) : (
                <Badge variant="destructive" className="gap-1">
                    <X size={12} />
                    חסר
                </Badge>
            )}
        </div>
    </div>
);

export const AuditOverview: React.FC<AuditOverviewProps> = ({ auditSummary, activeTab }) => {
    // Single state for the unified card
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Card className="mb-6 transition-all duration-200 border-slate-200 shadow-sm">
            <CardHeader 
                className="py-4 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-xl select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                             <Activity size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">
                                סטטוס קליטה ובקרות מערכת
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-normal mt-0.5">
                                סיכום קבצי מקור, סטטוסים ובדיקות לוגיות לרמת החודש
                            </p>
                        </div>
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </CardHeader>
            
            {isOpen && (
                <CardContent className="animate-in slide-in-from-top-2 duration-200 pt-2 pb-6 px-6 border-t border-slate-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left Column: Files */}
                        <div>
                            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                <FolderOpen size={18} className="text-slate-500" />
                                קבצי מקור
                            </h4>
                            <div className="bg-slate-50/30 rounded-lg border border-slate-100 p-1">
                                <FileRow label="חשבונית מרכזת" exists={auditSummary.files.invoice} />
                                <FileRow label="קובץ מדיה כספי" exists={auditSummary.files.mediaFinancial} />
                                {activeTab === 'אשפוז' && (
                                    <>
                                        <FileRow label="קובץ מדיה דמוגרפי" exists={auditSummary.files.mediaDemographic} />
                                        <FileRow label="קובץ מדיה העברות" exists={auditSummary.files.mediaMovements} />
                                        <FileRow label="קובץ מדיה אבחונים" exists={auditSummary.files.mediaDiagnoses} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Checks */}
                        <div>
                             <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                                <Scale size={18} className="text-purple-600" />
                                בדיקות התאמה
                            </h4>
                            <div className="bg-slate-50/30 rounded-lg border border-slate-100 p-1">
                                <div className="flex justify-between items-center py-2.5 border-b last:border-0 border-slate-100 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 shadow-sm">
                                            <BadgeCent size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 font-medium text-sm">התאמת סכום כולל</span>
                                            <span className="text-[10px] text-slate-400">חשבונית מול קובץ מדיה כספי</span>
                                        </div>
                                    </div>
                                    <div>
                                        {auditSummary.checks.priceMatchInvoiceVsFinancial ? (
                                            <Badge variant="success" className="gap-1">
                                                <Check size={12} />
                                                תואם
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="gap-1">
                                                <X size={12} />
                                                שגיאה
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
