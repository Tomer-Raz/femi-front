import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/select';
import type { User, Team } from '@/types';
import { Crown, Users } from 'lucide-react';

type OperationType = 'assign' | 'remove';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamId?: string) => void;
  operationType: OperationType;
  user: User;
  teams: Team[];
  currentTeam?: Team;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  operationType,
  user,
  teams,
  currentTeam,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  if (!isOpen) return null;

  const getModalContent = () => {
    switch (operationType) {
      case 'assign':
        const currentLeader = selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.leaderId : null;

        return {
          title: 'שיוך משתמש לצוות',
          content: (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  בחר צוות
                </label>
                <Select
                  value={selectedTeamId}
                  onChange={setSelectedTeamId}
                  options={teams.map(t => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  placeholder="בחר צוות..."
                />
              </div>
              {selectedTeamId && currentLeader && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                    <Users size={14} />
                    <span>ראש צוות נוכחי</span>
                  </div>
                  <div className="text-blue-700">
                    הצוות כבר מנוהל על ידי ראש צוות
                  </div>
                </div>
              )}
              <div className="text-sm text-slate-500">
                המשתמש <strong>{user.name}</strong> ישויך לצוות שנבחר.
              </div>
            </div>
          ),
          saveLabel: 'שיוך לצוות',
          isValid: !!selectedTeamId,
        };

      case 'remove':
        const isLeader = currentTeam?.leaderId === user.id;
        return {
          title: 'הסרת משתמש מצוות',
          content: (
            <div className="space-y-4">
              {isLeader && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium mb-1">
                    <Crown size={16} />
                    <span>משתמש הוא ראש צוות</span>
                  </div>
                  <div className="text-sm text-yellow-700">
                    הסרת משתמש זה תסיר אותו גם מתפקיד ראש הצוות.
                  </div>
                </div>
              )}
              <div className="text-sm text-slate-700">
                האם אתה בטוח שברצונך להסיר את <strong>{user.name}</strong> מצוות <strong>{currentTeam?.name}</strong>?
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                לאחר ההסרה, המשתמש יהפוך ללא פעיל עד ששיוך לצוות אחר.
              </div>
            </div>
          ),
          saveLabel: 'הסר מהצוות',
          isValid: true,
        };
    }
  };

  const modalContent = getModalContent();

  const handleConfirm = () => {
    if (operationType === 'assign') {
      onConfirm(selectedTeamId);
    } else {
      onConfirm();
    }
    setSelectedTeamId('');
  };

  const handleClose = () => {
    setSelectedTeamId('');
    onClose();
  };

  return (
    <Modal
      title={modalContent.title}
      onSave={handleConfirm}
      onClose={handleClose}
      isValid={modalContent.isValid}
      saveLabel={modalContent.saveLabel}
      cancelLabel="ביטול"
    >
      {modalContent.content}
    </Modal>
  );
};
