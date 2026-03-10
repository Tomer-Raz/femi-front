import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderCog, LogOut, Briefcase , Database, Users} from 'lucide-react';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  hasPendingNotifications?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, hasPendingNotifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user.role === UserRole.Admin;
  const isTeamLead = user.role === UserRole.TeamLead;

  const NavItem = ({ path, label, icon: Icon }: { path: string; label: string; icon: any }) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`w-full justify-start gap-3 mb-1 font-normal text-base ${isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-500'}`}
        onClick={() => navigate(path)}
      >
        <Icon size={20} />
        <span>{label}</span>
        {path === '/admin/runs' && hasPendingNotifications && (
          <span className="relative flex h-2 w-2 mr-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </Button>
    );
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 h-screen flex flex-col sticky top-0 shadow-sm z-20">
      <div className="p-6 border-b border-slate-200 flex flex-col items-center">
        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-blue-200">
          F
        </div>
        <h1 className="font-bold text-slate-900 text-lg tracking-wide">FEMI</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">תפריט ראשי</div>

        <NavItem path="/dashboard" label="דשבורד" icon={LayoutDashboard} />
        {isTeamLead && <NavItem path="/my-team" label="הצוות שלי" icon={Briefcase} />}

        {isAdmin && (
          <>
            <div className="mt-8 mb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">ניהול אדמין</div>
            <NavItem path="/admin/runs" label="ניהול תיקיות" icon={FolderCog} />
            { <NavItem path="/admin/tables" label="טבלאות ייחוס" icon={Database} /> }
            {/* <NavItem path="/admin/rules" label="ניהול חוקים" icon={Scale} /> */}
            { <NavItem path="/admin/users" label="ניהול משתמשים" icon={Users} /> }
          </>
        )} 
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-blue-600 flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.role === UserRole.Admin ? 'אדמין' : user.role === UserRole.TeamLead ? 'ראש צוות' : 'בקר'}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onLogout}>
          <LogOut size={16} />
          <span>התנתק</span>
        </Button>
      </div>
    </div>
  );
};