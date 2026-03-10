import React from 'react';
import type { ClaimRow } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { Check, AlertCircle } from 'lucide-react';

interface ClaimsTableProps {
    claims: ClaimRow[];
    onRowClick: (claim: ClaimRow) => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({ claims, onRowClick }) => {
    
    // Logic to group claims (Copied from original)
    // Group claims by Visit Number, but ensure order is by Patient ID then Start Date
    const groupedClaims = React.useMemo(() => {
        const sortedClaims = [...claims].sort((a, b) => {
            const idCompare = a.patientId.localeCompare(b.patientId);
            if (idCompare !== 0) return idCompare;
            
            const dateA = a.startDate.split('/').reverse().join('');
            const dateB = b.startDate.split('/').reverse().join('');
            return dateA.localeCompare(dateB);
        });

        const groups: ClaimRow[][] = [];
        let currentGroup: ClaimRow[] = [];
        
        sortedClaims.forEach((claim, index) => {
            if (index === 0) {
                currentGroup.push(claim);
                return;
            }
            const prevClaim = sortedClaims[index - 1];
            if (claim.visitNumber === prevClaim.visitNumber) {
                currentGroup.push(claim);
            } else {
                groups.push(currentGroup);
                currentGroup = [claim];
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
    }, [claims]);

    return (
        <div className="rounded-md border border-slate-200 bg-white">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[15%]">פרטי ביקור ומטופל</TableHead>
                        <TableHead>מס' הפנייה</TableHead>
                        <TableHead>תאריך התחלה</TableHead>
                        <TableHead>תאריך סיום</TableHead>
                        <TableHead>קוד שירות</TableHead>
                        <TableHead>סכום</TableHead>
                        <TableHead>מסמכים חסרים</TableHead>
                        <TableHead>סטטוס שורה</TableHead>
                        <TableHead>Override</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedClaims.map((group) => {
                        const firstRow = group[0];
                        const isMultiLine = group.length > 1;

                        return (
                            <React.Fragment key={firstRow.visitNumber}>
                                {group.map((row, rowIdx) => {
                                    const isFirstInGroup = rowIdx === 0;
                                    const isLastInGroup = rowIdx === group.length - 1;
                                    
                                    return (
                                        <TableRow 
                                            key={`${row.visitNumber}-${row.treatmentCode}-${rowIdx}`}
                                            onClick={() => onRowClick(row)}
                                            className={`cursor-pointer ${isMultiLine ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-blue-50/50'} ${isLastInGroup ? 'border-b-4 border-slate-100' : ''}`}
                                        >
                                            {isFirstInGroup && (
                                                <TableCell 
                                                    className={`align-top border-l border-slate-200 font-medium`}
                                                    rowSpan={group.length}
                                                >
                                                    <div className="flex flex-col gap-1 sticky top-20">
                                                        <span className="font-bold text-blue-600 flex items-center gap-2">
                                                            {row.visitNumber}
                                                            {isMultiLine && <Badge variant="secondary" className="text-[10px] px-1 py-0">{group.length} שורות</Badge>}
                                                        </span>
                                                        <div className="text-sm">
                                                            {row.firstName} {row.lastName}
                                                        </div>
                                                        <span className="text-slate-500 text-xs font-mono">{row.patientId}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            
                                            <TableCell className="font-mono text-xs">{row.referralId}</TableCell>
                                            <TableCell>{row.startDate}</TableCell>
                                            <TableCell>{row.endDate}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono bg-white">
                                                        {row.treatmentCode}
                                                    </Badge>
                                                    {row.amount < 5000 && isMultiLine && rowIdx > 0 && (
                                                        <span className="text-[10px] text-slate-400 italic">נלווה</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">₪{row.amount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {row.missingDocs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {row.missingDocs.map((doc, i) => (
                                                            <React.Fragment key={i}>
                                                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-5 gap-1">
                                                                    <AlertCircle size={10} />
                                                                    {doc}
                                                                </Badge>
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1"><Check size={12}/> תקין</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={row.finalStatus} />
                                            </TableCell>
                                            <TableCell>
                                                {row.isOverridden ? (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                                        בוצע Override
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};