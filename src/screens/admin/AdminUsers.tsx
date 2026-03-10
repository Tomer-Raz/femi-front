
import { useState, useEffect, useRef } from 'react';
import { getUsers, getTeams, addTeam, updateUserTeam, deleteTeam } from '@/services/dataStore';
import { getHospitalsFromApi } from '@/service/api';
import type { Hospital, Team, User } from '@/types';
import { UserRole } from '@/types';
import { Plus, MoreVertical, Building2, Check, Users, Crown, Briefcase, Search, UserX, UserCheck, Shield, UserPlus, UserMinus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/Modal';
import { UserManagementModal } from '@/components/admin/UserManagementModal';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [userTab, setUserTab] = useState<'users' | 'teams'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'team' | null>(null);

  // Search state for hospitals in team modal
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [newTeam, setNewTeam] = useState<{name: string, leaderId: string, hospitals: string[]}>({ name: '', leaderId: '', hospitals: [] });

  // User management state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userManagementModal, setUserManagementModal] = useState<{
    isOpen: boolean;
    operationType: 'assign' | 'remove' | null;
    user: User | null;
  }>({ isOpen: false, operationType: null, user: null });
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);

  // Team management state
  const [openTeamMenuId, setOpenTeamMenuId] = useState<string | null>(null);
  const [deleteTeamModal, setDeleteTeamModal] = useState<{
    isOpen: boolean;
    team: Team | null;
  }>({ isOpen: false, team: null });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchData = async () => {
          setUsers(getUsers());
          setTeams(getTeams());

          try {
              const hospitalsData = await getHospitalsFromApi();
              setHospitals(hospitalsData);
          } catch (error) {
              console.error('Failed to fetch hospitals:', error);
          }
      };

      fetchData();
  }, [isModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setOpenTeamMenuId(null);
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  // Reset search when modal opens/closes
  useEffect(() => {
      if (!isModalOpen) setHospitalSearch('');
  }, [isModalOpen]);

  const handleCreateTeam = () => {
      addTeam({ ...newTeam, memberIds: [] });
      setIsModalOpen(false);
      setNewTeam({ name: '', leaderId: '', hospitals: [] });
  };

  const toggleHospitalSelection = (code: string, currentList: string[], setter: any) => {
      if (currentList.includes(code)) {
          setter((prev: any) => ({ ...prev, hospitals: currentList.filter((c: string) => c !== code) }));
      } else {
          setter((prev: any) => ({ ...prev, hospitals: [...currentList, code] }));
      }
  };

  const filteredHospitals = hospitals.filter(h => 
      h.name.includes(hospitalSearch) || h.code.includes(hospitalSearch.toUpperCase())
  );

  const handleSelectAllFiltered = () => {
      const allFilteredCodes = filteredHospitals.map(h => h.code);
      setNewTeam(prev => ({
          ...prev,
          hospitals: Array.from(new Set([...prev.hospitals, ...allFilteredCodes]))
      }));
  };

  const handleClearAll = () => {
      setNewTeam(prev => ({ ...prev, hospitals: [] }));
  };

  const isUserActive = (user: User) => {
      return user.role === UserRole.Admin || !!user.teamId;
  };

  const filteredUsers = users.filter(u => {
    // Filter by name
    const matchesName = u.name.includes(userSearch);

    // Filter by team
    const matchesTeam = teamFilter === 'all' ||
                       (teamFilter === 'no-team' && !u.teamId) ||
                       u.teamId === teamFilter;

    // Filter by role
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesName && matchesTeam && matchesRole;
  });

  // Helper function to get hospital name from code
  const getHospitalName = (code: string): string => {
    const hospital = hospitals.find(h => h.code === code);
    return hospital ? hospital.name : code;
  };

  // Team management handlers
  const handleDeleteTeam = (team: Team) => {
      setDeleteTeamModal({ isOpen: true, team });
      setOpenTeamMenuId(null);
  };

  const confirmDeleteTeam = () => {
      if (!deleteTeamModal.team) return;

      try {
          deleteTeam(deleteTeamModal.team.id);
          setOperationSuccess(`הצוות "${deleteTeamModal.team.name}" נמחק בהצלחה. כל החברים הוסרו מהצוות.`);

          // Refresh data
          setUsers(getUsers());
          setTeams(getTeams());
          setDeleteTeamModal({ isOpen: false, team: null });

          // Clear success message after 3 seconds
          setTimeout(() => setOperationSuccess(null), 3000);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה במחיקת הצוות';
          setOperationError(errorMessage);
          setTimeout(() => setOperationError(null), 3000);
      }
  };

  // User management handlers
  const openUserManagementModal = (operationType: 'assign' | 'remove', user: User) => {
      setUserManagementModal({ isOpen: true, operationType, user });
  };

  const closeUserManagementModal = () => {
      setUserManagementModal({ isOpen: false, operationType: null, user: null });
      setOperationError(null);
  };

  const handleUserManagementConfirm = (teamId?: string) => {
      if (!userManagementModal.user || !userManagementModal.operationType) return;

      try {
          const user = userManagementModal.user;
          const operationType = userManagementModal.operationType;

          switch (operationType) {
              case 'assign':
                  if (!teamId) {
                      setOperationError('נא לבחור צוות');
                      return;
                  }
                  updateUserTeam(user.id, teamId);
                  setOperationSuccess(`המשתמש ${user.name} שויך בהצלחה לצוות`);
                  break;

              case 'remove':
                  updateUserTeam(user.id, undefined);
                  setOperationSuccess(`${user.name} הוסר בהצלחה מהצוות`);
                  break;
          }

          // Refresh data
          setUsers(getUsers());
          setTeams(getTeams());
          closeUserManagementModal();

          // Clear success message after 3 seconds
          setTimeout(() => setOperationSuccess(null), 3000);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה';
          setOperationError(errorMessage);
          setTimeout(() => setOperationError(null), 3000);
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
       <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">ניהול משתמשים וצוותים</h1>
              <p className="text-slate-500">ניהול הרשאות, צוותי עבודה וסטטוס משתמשים</p>
          </div>
          {userTab === 'teams' && (
            <Button className="gap-2" onClick={() => { setModalType('team'); setIsModalOpen(true); }}>
                <Plus size={16} /> צוות חדש
            </Button>
          )}
       </div>
       
       <div className="flex gap-2 border-b border-slate-200 w-full mb-4">
           <button 
               className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${userTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
               onClick={() => setUserTab('users')}
           >
               <Users size={16} />
               מאגר משתמשים
           </button>
           <button 
               className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${userTab === 'teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
               onClick={() => setUserTab('teams')}
           >
               <Briefcase size={16} />
               ניהול צוותים
           </button>
       </div>
       
       {userTab === 'users' ? (
           <div className="space-y-4">
               <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <span>משתמשים נשאבים באופן אוטומטי משרת הארגון (AD). משתמש נחשב <strong>פעיל</strong> רק אם הוא משויך לצוות או מוגדר כאדמין.</span>
                    </div>
               </div>

               <div className="flex items-center gap-4 flex-wrap">
                   <div className="relative max-w-sm w-full">
                       <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <Input
                            placeholder="חיפוש לפי שם..."
                            className="pr-9"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                   </div>

                   <div className="flex items-center gap-2">
                       <label className="text-sm font-medium text-slate-600">צוות:</label>
                       <select
                           className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 min-w-[180px]"
                           value={teamFilter}
                           onChange={(e) => setTeamFilter(e.target.value)}
                       >
                           <option value="all">כל הצוותים</option>
                           <option value="no-team">ללא צוות</option>
                           {teams.map(team => (
                               <option key={team.id} value={team.id}>{team.name}</option>
                           ))}
                       </select>
                   </div>

                   <div className="flex items-center gap-2">
                       <label className="text-sm font-medium text-slate-600">תפקיד:</label>
                       <select
                           className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 min-w-[150px]"
                           value={roleFilter}
                           onChange={(e) => setRoleFilter(e.target.value)}
                       >
                           <option value="all">כל התפקידים</option>
                           <option value={UserRole.Admin}>{UserRole.Admin}</option>
                           <option value={UserRole.TeamLead}>{UserRole.TeamLead}</option>
                           <option value={UserRole.Auditor}>{UserRole.Auditor}</option>
                       </select>
                   </div>
               </div>

               <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                  <Table>
                     <TableHeader className="bg-slate-50">
                        <TableRow>
                           <TableHead>שם מלא</TableHead>
                           <TableHead>סטטוס פעילות</TableHead>
                           <TableHead>תפקיד מוגדר</TableHead>
                           <TableHead>שיוך לצוות</TableHead>
                           <TableHead>בתי חולים מורשים</TableHead>
                           <TableHead className="w-20">פעולות</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {filteredUsers.map(u => {
                            const active = isUserActive(u);
                            const isSelected = selectedUserId === u.id;
                            const userTeam = teams.find(t => t.id === u.teamId);
                            const isTeamLead = userTeam?.leaderId === u.id;

                            return (
                                <>
                                    <TableRow
                                        key={u.id}
                                        className={`cursor-pointer transition-colors ${!active ? 'bg-slate-50/50' : ''} ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                                    >
                                        <TableCell className="font-medium flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${active ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={active ? 'text-slate-900' : 'text-slate-500'}>{u.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {active ? (
                                                <Badge variant="success" className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    <UserCheck size={12} /> פעיל
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1.5 bg-slate-100 text-slate-500 border-slate-200">
                                                    <UserX size={12} /> לא פעיל
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {active ? (
                                                <Badge variant="outline" className={`font-normal ${u.role === UserRole.Admin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-600'}`}>
                                                    {u.role}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {u.teamId ? (
                                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    <Users size={14} className="text-blue-500" />
                                                    {userTeam?.name || u.teamId}
                                                    {isTeamLead && <Crown size={12} className="text-yellow-600" />}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">ללא צוות</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {u.hospitals.length > 0 ? u.hospitals.map(h => (
                                                    <Badge key={h} variant="secondary" className={`text-[10px] h-5 ${!active ? 'opacity-50' : ''}`}>{getHospitalName(h)}</Badge>
                                                )) : <span className="text-slate-400 text-xs">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                {isSelected ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {isSelected && (
                                        <TableRow key={`${u.id}-actions`} className="bg-blue-50/50 border-t-0">
                                            <TableCell colSpan={6} className="py-4">
                                                <div className="flex flex-col gap-3 px-4">
                                                    <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                                        <Shield size={16} className="text-blue-600" />
                                                        פעולות ניהול למשתמש
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* Show actions based on user state */}
                                                        {u.role === UserRole.Admin ? (
                                                            <div className="text-sm text-slate-500 italic">משתמש Admin לא דורש שיוך לצוות</div>
                                                        ) : !u.teamId ? (
                                                            // User not in team - show "Assign to Team"
                                                            <Button
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openUserManagementModal('assign', u);
                                                                }}
                                                            >
                                                                <UserPlus size={16} />
                                                                שיוך לצוות
                                                            </Button>
                                                        ) : (
                                                            // User in team - show "Remove from Team"
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="gap-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openUserManagementModal('remove', u);
                                                                }}
                                                            >
                                                                <UserMinus size={16} />
                                                                הסרה מהצוות
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                     </TableBody>
                  </Table>
               </div>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {teams.map(team => (
                   <Card key={team.id} className="relative group hover:border-blue-400 transition-all">
                       <CardContent className="p-6">
                           <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shadow-sm"><Briefcase size={20} /></div>
                                <div className="relative">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenTeamMenuId(openTeamMenuId === team.id ? null : team.id);
                                        }}
                                    >
                                        <MoreVertical size={16}/>
                                    </Button>
                                    {openTeamMenuId === team.id && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2"
                                        >
                                            <button
                                                className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTeam(team);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                                מחיקת צוות
                                            </button>
                                        </div>
                                    )}
                                </div>
                           </div>
                           <h3 className="font-bold text-lg mb-1">{team.name}</h3>
                           <p className="text-xs text-slate-400 font-mono mb-4">ID: {team.id}</p>

                           <div className="space-y-3 pt-4 border-t border-slate-100">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 flex items-center gap-2"><Crown size={14}/> ראש צוות</span>
                                   <span className="font-medium">{users.find(u => u.id === team.leaderId)?.name || 'לא הוגדר'}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 flex items-center gap-2"><Users size={14}/> חברים</span>
                                   <Badge variant="secondary">{team.memberIds.length}</Badge>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 flex items-center gap-2"><Building2 size={14}/> בתי חולים</span>
                                   <span className="text-xs">{team.hospitals.map(code => getHospitalName(code)).join(', ')}</span>
                               </div>
                           </div>
                       </CardContent>
                   </Card>
               ))}
           </div>
       )}

       {isModalOpen && modalType === 'team' && (
           <Modal 
            title="הקמת צוות חדש" 
            onSave={handleCreateTeam} 
            onClose={() => setIsModalOpen(false)}
            isValid={newTeam.name.length > 2 && newTeam.leaderId !== ''}
           >
               <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">שם הצוות</label>
                       <Input value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} placeholder="לדוגמה: צוות אשפוז דרום" />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">ראש צוות</label>
                       <select 
                           className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                           value={newTeam.leaderId}
                           onChange={(e) => setNewTeam({...newTeam, leaderId: e.target.value})}
                       >
                           <option value="">בחר ראש צוות...</option>
                           {users.filter(u => u.role === UserRole.TeamLead).map(u => (
                               <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                       </select>
                   </div>
                   
                   {/* Improved Hospital Selection */}
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">בתי חולים באחריות הצוות</label>
                       
                       <div className="flex gap-2 mb-2">
                           <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                   placeholder="חיפוש לפי שם או קוד..." 
                                   className="pr-9 h-9" 
                                   value={hospitalSearch}
                                   onChange={e => setHospitalSearch(e.target.value)}
                               />
                           </div>
                           <Button 
                               variant="outline" 
                               size="sm" 
                               className="h-9 px-3 text-xs"
                               onClick={handleClearAll}
                               disabled={newTeam.hospitals.length === 0}
                           >
                               נקה הכל
                           </Button>
                       </div>

                       <div className="border border-slate-200 rounded-lg overflow-hidden">
                           <div className="bg-slate-50 p-2 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
                                <span className="font-medium">נבחרו {newTeam.hospitals.length} בתי חולים</span>
                                <Button 
                                    variant="link" 
                                    className="h-auto p-0 text-xs" 
                                    onClick={handleSelectAllFiltered}
                                    disabled={filteredHospitals.length === 0}
                                >
                                    בחר הכל ({filteredHospitals.length})
                                </Button>
                           </div>
                           <div className="max-h-[200px] overflow-y-auto p-2 custom-scrollbar bg-slate-50/30">
                               {filteredHospitals.length > 0 ? (
                                   <div className="grid grid-cols-2 gap-2">
                                       {filteredHospitals.map(h => (
                                           <div 
                                              key={h.code} 
                                              onClick={() => toggleHospitalSelection(h.code, newTeam.hospitals, setNewTeam)}
                                              className={`
                                                  cursor-pointer text-sm p-2 rounded border flex items-center gap-2 transition-all select-none
                                                  ${newTeam.hospitals.includes(h.code) 
                                                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'}
                                              `}
                                          >
                                              <div className={`
                                                  w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                                                  ${newTeam.hospitals.includes(h.code) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}
                                              `}>
                                                   {newTeam.hospitals.includes(h.code) && <Check size={10} className="text-white" />}
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                  <span className="truncate font-medium text-xs md:text-sm" title={h.name}>{h.name}</span>
                                                  <span className="text-[10px] text-slate-400 font-mono leading-none">{h.code}</span>
                                              </div>
                                          </div>
                                       ))}
                                   </div>
                               ) : (
                                   <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                                       <Search size={24} className="opacity-20" />
                                       לא נמצאו בתי חולים תואמים
                                   </div>
                               )}
                           </div>
                       </div>
                       <p className="text-[10px] text-slate-400 mt-1.5">
                           ניתן לבחור מספר בתי חולים. השתמש בחיפוש כדי למצוא בתי חולים ספציפיים.
                       </p>
                   </div>
               </div>
           </Modal>
       )}

       {/* User Management Modal */}
       {userManagementModal.isOpen && userManagementModal.user && userManagementModal.operationType && (
           <UserManagementModal
               isOpen={userManagementModal.isOpen}
               onClose={closeUserManagementModal}
               onConfirm={handleUserManagementConfirm}
               operationType={userManagementModal.operationType}
               user={userManagementModal.user}
               teams={teams}
               currentTeam={teams.find(t => t.id === userManagementModal.user?.teamId)}
           />
       )}

       {/* Delete Team Confirmation Modal */}
       {deleteTeamModal.isOpen && deleteTeamModal.team && (
           <Modal
               title="מחיקת צוות"
               onSave={confirmDeleteTeam}
               onClose={() => setDeleteTeamModal({ isOpen: false, team: null })}
               isValid={true}
               saveLabel="מחק צוות"
               cancelLabel="ביטול"
           >
               <div className="space-y-4">
                   <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                       <div className="flex items-start gap-3">
                           <Trash2 size={20} className="text-red-600 mt-0.5 shrink-0" />
                           <div>
                               <p className="font-medium text-red-900 mb-1">פעולה זו תמחק את הצוות לצמיתות</p>
                               <p className="text-sm text-red-700">
                                   כל חברי הצוות יוסרו מהצוות ויהפכו ללא פעילים. לא ניתן לבטל פעולה זו.
                               </p>
                           </div>
                       </div>
                   </div>

                   <div className="text-sm text-slate-700">
                       <p className="mb-2">פרטי הצוות שיימחק:</p>
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                           <div className="flex justify-between">
                               <span className="text-slate-500">שם הצוות:</span>
                               <span className="font-medium">{deleteTeamModal.team.name}</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="text-slate-500">מספר חברים:</span>
                               <span className="font-medium">{deleteTeamModal.team.memberIds.length}</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="text-slate-500">ראש צוות:</span>
                               <span className="font-medium">
                                   {users.find(u => u.id === deleteTeamModal.team?.leaderId)?.name || 'לא הוגדר'}
                               </span>
                           </div>
                       </div>
                   </div>

                   <p className="text-sm text-slate-600">
                       האם אתה בטוח שברצונך למחוק את הצוות <strong className="text-slate-900">{deleteTeamModal.team.name}</strong>?
                   </p>
               </div>
           </Modal>
       )}

       {/* Success Message */}
       {operationSuccess && (
           <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
               <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                   <UserCheck size={18} />
                   <span className="font-medium">{operationSuccess}</span>
               </div>
           </div>
       )}

       {/* Error Message */}
       {operationError && (
           <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
               <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                   <UserX size={18} />
                   <span className="font-medium">{operationError}</span>
               </div>
           </div>
       )}
    </div>
 );
};
