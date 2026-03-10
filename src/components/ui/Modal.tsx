
import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
  isValid?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  title, 
  children, 
  onSave, 
  onClose, 
  isValid = true, 
  saveLabel = 'שמור וצור', 
  cancelLabel = 'ביטול' 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
            </div>
            <div className="p-6 space-y-4">
                {children}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
                <Button onClick={onSave} disabled={!isValid}>{saveLabel}</Button>
            </div>
        </div>
    </div>
  );
};
