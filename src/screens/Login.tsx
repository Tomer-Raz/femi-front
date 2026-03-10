
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/types';
import { MOCK_USERS } from '@/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState(MOCK_USERS[0].id);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.id === selectedUserId);
    if (user) {
      login(user);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center space-y-4">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200">
                <ShieldCheck size={32} />
            </div>
            <div>
                <CardTitle className="text-2xl">ברוכים הבאים ל-FEMI</CardTitle>
                <CardDescription>מערכת בקרת חשבונות רפואיים</CardDescription>
            </div>
        </CardHeader>

        <CardContent>
             <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        בחר משתמש (לדמו)
                    </label>
                    <div className="relative">
                        <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                        {MOCK_USERS.map(u => (
                            <option key={u.id} value={u.id}>
                            {u.name} - {u.role === UserRole.Admin ? 'אדמין' : u.role === UserRole.TeamLead ? 'ראש צוות' : 'בקר'}
                            </option>
                        ))}
                        </select>
                    </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                    התחבר למערכת
                </Button>
            </form>
        </CardContent>
        <CardFooter className="justify-center">
            <p className="text-xs text-slate-400">
                גרסת הדגמה v1.0.0
            </p>
        </CardFooter>
      </Card>
    </div>
  );
};
