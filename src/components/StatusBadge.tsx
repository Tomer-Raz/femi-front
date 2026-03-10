import React from 'react';
import { RunStatus } from '@/types';
import { Badge } from './ui/badge';

export const StatusBadge: React.FC<{ status: string | RunStatus }> = ({ status }) => {
  let variant: 'default' | 'success' | 'destructive' | 'warning' | 'info' | 'secondary' = 'secondary';

  switch (status) {
    case RunStatus.Completed:
    case 'עבר':
    case 'מאושר':
    case 'פעיל':
      variant = 'success';
      break;
    case RunStatus.Failed:
    case 'נכשל':
    case 'נדחה':
      variant = 'destructive';
      break;
    case RunStatus.InProgress:
    case 'בתהליך':
      variant = 'info';
      break;
    case 'מצריך בדיקה':
    case 'הצעה':
      variant = 'warning';
      break;
    case 'ארכיון':
      variant = 'secondary';
      break;
  }

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {status}
    </Badge>
  );
};