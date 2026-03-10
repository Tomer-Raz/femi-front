
import React from 'react';
import { AdminUsers } from './admin/AdminUsers';
import { AdminRules } from './admin/AdminRules';
import { AdminTables } from './admin/AdminTables';
import { AdminRuns } from './admin/AdminRuns';

interface AdminScreenProps {
  view: 'tables' | 'rules' | 'users' | 'runs';
}

export const AdminManagement: React.FC<AdminScreenProps> = ({ view }) => {
  // Logic has been moved to individual components in /screens/admin/
  // This wrapper ensures cleaner code separation.

  if (view === 'users') {
     return <AdminUsers />;
  }

  if (view === 'rules') {
      return <AdminRules />;
  }

  if (view === 'tables') {
      return <AdminTables />;
  }

  if (view === 'runs') {
     return <AdminRuns />;
  }

  return <div className="p-8">View not found</div>;
};
