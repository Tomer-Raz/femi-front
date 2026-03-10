
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RunStatus } from '@/types';
import type { PeriodData } from '@/types';
import { getDashboardProviderPeriods } from '@/service/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowRight, CalendarClock, Lock, AlertTriangle, Loader2 } from 'lucide-react';

interface LocationState {
  providerId: number;
  providerName: string;
}

export const HospitalMonths: React.FC = () => {
  const { hospitalCode } = useParams<{ hospitalCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [providerName, setProviderName] = useState(state?.providerName ?? hospitalCode ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeriods = async () => {
      if (!state?.providerId) {
        setError('חסר מזהה בית חולים. נא לחזור לדשבורד ולנסות שוב.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardProviderPeriods(state.providerId);
        setProviderName(data.provider_name);
        setPeriods(data.periods);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'שגיאה בטעינת החודשים',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeriods();
  }, [state?.providerId]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowRight size={20} />
        <span>חזרה לדשבורד</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
           <div>
             <h1 className="text-2xl font-bold text-slate-900">{providerName} ({hospitalCode})</h1>
             <p className="text-slate-500">חודשים זמינים במערכת</p>
           </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              חזרה לדשבורד
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && periods.length > 0 && (
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="py-4 px-6 font-medium">חודש</th>
                <th className="py-4 px-6 font-medium">סטטוס ריצה</th>
                <th className="py-4 px-6 font-medium">רץ לאחרונה</th>
                <th className="py-4 px-6 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {periods.map((m) => (
                <tr
                  key={m.period}
                  className={`hover:bg-slate-50 transition-colors ${m.status === RunStatus.Completed ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
                  onClick={() => m.status === RunStatus.Completed && navigate(`/hospitals/${hospitalCode}/months/${encodeURIComponent(m.period)}`, { state: { providerId: state?.providerId, providerName, periodId: m.id } })}
                >
                  <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-2">
                     <CalendarClock size={16} className="text-slate-400" />
                     {m.period}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dir-ltr text-right">
                    {m.lastRunTimestamp || '-'}
                  </td>
                  <td className="py-4 px-6">
                     {m.status === RunStatus.Completed ? (
                         <button className="text-blue-600 font-medium text-sm hover:underline hover:text-blue-500">צפה בתוצאות</button>
                     ) : m.status === RunStatus.Failed ? (
                         <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle size={14}/> שגיאה</span>
                     ) : m.status === RunStatus.InProgress ? (
                         <span
                           className="text-slate-300 text-sm font-medium cursor-not-allowed flex items-center gap-1"
                           title="הצפייה בתוצאות תתאפשר לאחר סיום הריצה"
                         >
                           צפה בתוצאות <Lock size={12} />
                         </span>
                     ) : (
                         <span className="text-slate-400 text-sm">--</span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !error && periods.length === 0 && (
            <div className="p-12 text-center text-slate-500">
                לא נמצאו חודשים עבור בית חולים זה.
            </div>
        )}
      </div>
    </div>
  );
};
