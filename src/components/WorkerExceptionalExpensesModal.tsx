import React from 'react';
import { Building } from '../types';
import { ExceptionalExpensesManager } from './ExceptionalExpensesManager';
import { X } from 'lucide-react';

interface WorkerExceptionalExpensesModalProps {
  building: Building | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerExceptionalExpensesModal: React.FC<WorkerExceptionalExpensesModalProps> = ({
  building,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !building) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-2xl w-full max-w-5xl border border-[#E2E8F0] flex flex-col my-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-[#FFFFFF] rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-[#16202E]">
              Gastos Excepcionales
            </h2>
            <p className="text-sm text-[#5A6B82]">
              Edificio: {building.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5A6B82] hover:text-[#16202E] transition-colors rounded-lg hover:bg-[#E8EFF9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[75vh]">
          <ExceptionalExpensesManager building={building} />
        </div>
      </div>
    </div>
  );
};
