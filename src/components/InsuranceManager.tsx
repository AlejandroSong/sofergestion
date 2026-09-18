import React, { useState } from 'react';
import { Building } from '../types';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Save, X, Edit3, ShieldCheck } from 'lucide-react';

interface InsuranceManagerProps {
  building: Building;
}

export const InsuranceManager: React.FC<InsuranceManagerProps> = ({ building }) => {
  const { updateBuilding, currentUser } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState(building.insurance?.companyName || '');
  const [policyNumber, setPolicyNumber] = useState(building.insurance?.policyNumber || '');
  const [contractNumber, setContractNumber] = useState(building.insurance?.contractNumber || '');
  const [startDate, setStartDate] = useState(building.insurance?.startDate || '');
  const [endDate, setEndDate] = useState(building.insurance?.endDate || '');

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'worker';
  const hasInsurance = !!building.insurance?.companyName;

  const handleSave = () => {
    updateBuilding(building.id, {
      insurance: {
        companyName: companyName.trim(),
        policyNumber: policyNumber.trim(),
        contractNumber: contractNumber.trim(),
        startDate,
        endDate,
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCompanyName(building.insurance?.companyName || '');
    setPolicyNumber(building.insurance?.policyNumber || '');
    setContractNumber(building.insurance?.contractNumber || '');
    setStartDate(building.insurance?.startDate || '');
    setEndDate(building.insurance?.endDate || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0A2E6D]" />
          <h2 className="text-[#16202E] font-bold text-lg">Seguros y contratos</h2>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8EFF9] hover:bg-[#E8EFF9] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#0A2E6D]" />
            Editar Datos
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Compañía Aseguradora
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej. Mapfre, Allianz..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Número de Póliza
              </label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Ej. POL-12345678"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Número de Contrato
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="Ej. CTR-987654"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E] [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E] [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-semibold text-[#5A6B82] hover:text-[#16202E] transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </div>
        </div>
      ) : (
        <div>
          {hasInsurance ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#5A6B82] block mb-1">
                  Compañía
                </span>
                <span className="text-sm font-semibold text-[#16202E]">
                  {building.insurance?.companyName || '-'}
                </span>
              </div>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#5A6B82] block mb-1">
                  Número de Póliza
                </span>
                <span className="text-sm font-semibold text-[#16202E] font-mono">
                  {building.insurance?.policyNumber || '-'}
                </span>
              </div>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#5A6B82] block mb-1">
                  Número de Contrato
                </span>
                <span className="text-sm font-semibold text-[#16202E] font-mono">
                  {building.insurance?.contractNumber || '-'}
                </span>
              </div>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#5A6B82] block mb-1">
                  Fecha Inicial
                </span>
                <span className="text-sm font-semibold text-[#16202E]">
                  {building.insurance?.startDate || '-'}
                </span>
              </div>
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#5A6B82] block mb-1">
                  Vencimiento
                </span>
                <span className="text-sm font-semibold text-[#16202E]">
                  {building.insurance?.endDate || '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-[#FFFFFF] rounded-xl border border-dashed border-[#E2E8F0]">
              <ShieldCheck className="w-10 h-10 mx-auto text-[#444444] mb-2 stroke-1" />
              <p className="text-sm font-medium text-[#D1D5DB]">Sin seguro registrado</p>
              {canEdit && (
                <p className="text-xs mt-1 text-[#5A6B82]">
                  Haz clic en "Editar Datos" para agregar la información de la póliza.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
