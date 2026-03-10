import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardProviders } from "../service/api";
import type { Hospital } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Calendar, Activity, ChevronLeft, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardProviders();
        // Filter by user's allowed hospitals if applicable
        const filtered =
          !user || user.hospitals.length === 0
            ? data
            : data.filter((h) => user.hospitals.includes(h.code));
        setHospitals(filtered);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "שגיאה בטעינת בתי החולים",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [user]);

  return (
    <div className="p-8 max-w-[1920px] mx-auto">
      {/* Centered Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl space-y-10">
          {/* Header */}
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              דשבורד בתי חולים
            </h1>
            <p className="text-slate-500 mt-2">
              סקירה כללית של סטטוס הרצות לפי בית חולים
            </p>
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
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && hospitals.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500">אין בתי חולים עם הרצות</p>
            </div>
          )}

          {/* Cards Grid */}
          {!isLoading && !error && hospitals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <Card
                key={hospital.code}
                onClick={() => navigate(`/hospitals/${hospital.code}`, { state: { providerId: hospital.id, providerName: hospital.name } })}
                className="group cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-blue-400 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {hospital.name}
                    </CardTitle>
                  </div>

                  <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Activity size={18} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 mt-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14} />
                      <span>חודש אחרון</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {hospital.latestPeriod}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">סטטוס</span>
                    <StatusBadge status={hospital.latestStatus} />
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">
                    {hospital.lastRunTimestamp
                      ? `עודכן: ${hospital.lastRunTimestamp}`
                      : "טרם רץ"}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-blue-600 hover:text-blue-700 p-0 hover:bg-transparent font-medium gap-1 group-hover:gap-2 transition-all"
                  >
                    צפה
                    <ChevronLeft size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
