import React, { useState } from 'react';
import {
  X,
  Coins,
  Building2,
  Euro,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Building } from '../types';
import { formatCurrency } from '../utils/exportUtils';

interface AdjustRepairFundModalProps {
  building: Building | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdjustRepairFundModal: React.FC<AdjustRepairFundModalProps> = ({
  building,
  isOpen,
  onClose,
}) => {
  const { adjustBuildingRepairFund } = useApp();

  const [newAmount, setNewAmount] = useState(building ? String(building.repairFund) : '');
  const [reason, setReason] = useState('Recarga periódica de caja chica para reparaciones');
  const [error, setError] = useState('');

  if (!isOpen || !building) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val < 0) {
      setError('Por favor ingresa un importe válido.');
      return;
    }

    adjustBuildingRepairFund(building.id, val, reason.trim() || 'Ajuste de administrador');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-md w-full text-[#16202E] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#191919]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#16202E]">
                Ajustar Incidencias Generales
              </h3>
              <p className="text-xs text-[#5A6B82]">{building.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#E8EFF9] rounded-xl text-[#5A6B82] hover:text-[#16202E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="p-3 bg-[#1B1B1B] rounded-xl border border-[#2B2B2B] text-xs space-y-1">
            <span className="text-[#5A6B82]">Saldo Actual en Caja:</span>
            <p className="text-lg font-bold font-mono text-green-600">
              {formatCurrency(building.repairFund || 0)}
            </p>
            <p className="text-[11px] text-[#5A6B82]">
              Fondo base asignado: {formatCurrency(building.initialRepairFund || 0)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
              Nuevo Saldo de Caja (€) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-[#5A6B82] font-mono">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => {
                  setNewAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full pl-6 pr-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] font-mono focus:ring-2 focus:ring-[#C2A05E] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
              Motivo del Ajuste o Recarga
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Recarga de fondo para contingencias del mes"
              className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-[#5A6B82] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              Actualizar Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
