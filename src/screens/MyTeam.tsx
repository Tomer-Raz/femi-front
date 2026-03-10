
import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_TEAMS, MOCK_USERS, MOCK_HOSPITALS } from '@/mockData';
import { Users, Building2, Mail, UserCircle, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const MyTeam: React.FC = () => {
  const { user: currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }
  // Find the team managed by the current user
  const myTeam = useMemo(() => {
    return MOCK_TEAMS.find(t => t.leaderId === currentUser.id);
  }, [currentUser.id]);

  // Find members of that team
  const teamMembers = useMemo(() => {
    if (!myTeam) return [];
    return MOCK_USERS.filter(u => myTeam.memberIds.includes(u.id));
  }, [myTeam]);

  // Resolve hospital names
  const teamHospitals = useMemo(() => {
    if (!myTeam) return [];
    return MOCK_HOSPITALS.filter(h => myTeam.hospitals.includes(h.code));
  }, [myTeam]);

  if (!myTeam) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center h-full">
         <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Users size={48} className="text-slate-300" />
         </div>
         <h2 className="text-xl font-bold text-slate-900">לא נמצא צוות בניהולך</h2>
         <p className="text-slate-500 mt-2 max-w-md">
            נראה כי המשתמש שלך מוגדר כראש צוות, אך לא שויך אליו צוות פעיל במערכת. אנא פנה לאדמין.
         </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users size={28} className="text-blue-600" />
            הצוות שלי
        </h1>
        <p className="text-slate-500 mt-1">צפייה בפרטי הצוות וחבריו</p>
      </div>

      {/* Team Details Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
         <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {myTeam.name}
                    <Badge variant="outline" className="font-normal text-slate-500 bg-white">ID: {myTeam.id}</Badge>
                </h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-500" />
                    בניהולך: {currentUser.name}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-700 text-sm py-1 px-3">
                    {teamMembers.length} חברים פעילים
                </Badge>
            </div>
         </div>
         <CardContent className="p-6">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Building2 size={16} className="text-slate-400" />
                 בתי חולים באחריות הצוות
             </h3>
             <div className="flex flex-wrap gap-3">
                 {teamHospitals.length > 0 ? teamHospitals.map(h => (
                     <div key={h.code} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm min-w-[200px]">
                         <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center font-bold text-xs">
                             {h.code}
                         </div>
                         <div className="flex flex-col">
                             <span className="font-bold text-slate-800 text-sm">{h.name}</span>
                             <span className="text-[10px] text-slate-400">גישה מלאה</span>
                         </div>
                     </div>
                 )) : (
                     <span className="text-slate-400 text-sm italic">לא הוגדרו בתי חולים לצוות זה</span>
                 )}
             </div>
         </CardContent>
      </Card>

      {/* Members Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserCircle size={20} className="text-slate-500" />
            חברי הצוות
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map(member => (
                <Card key={member.id} className="hover:border-blue-300 transition-colors group">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-slate-900 truncate">{member.name}</h4>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                                    {member.role === 'Auditor' ? 'בקר' : member.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-400 truncate" title={`employee.${member.id}@femi.co.il`}>
                                <Mail size={14} className="shrink-0" />
                                <span className="truncate">employee.{member.id}@femi.co.il</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            
            {teamMembers.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-slate-500">לא נמצאו חברים בצוות זה.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
