import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { addPeriodToIso, formatIsoDateEs, nextMonthFifthIso, todayIso } from '../utils/dates';
import { User } from '../types';
import { 
  X, 
  Receipt, 
  Calendar, 
  Check, 
  CreditCard, 
  Building2, 
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

interface NeighborAccountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  neighbor: User | null;
  onSaved?: () => void;
}

export const NeighborAccountEditModal: React.FC<NeighborAccountEditModalProps> = ({
  isOpen,
  onClose,
  neighbor,
  onSaved,
}) => {
  const { updateUser, currentUser, showToast } = useApp();

  const [feeBalance, setFeeBalance] = useState<number>(0);
  const [balanceAdjustment, setBalanceAdjustment] = useState<string>('');
  const [lastPaymentAmount, setLastPaymentAmount] = useState<number>(0);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');
  const [lastPaymentConcept, setLastPaymentConcept] = useState<string>('');
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [feeFrequency, setFeeFrequency] = useState<'mensual' | 'anual'>('mensual');
  const [quotaAmount, setQuotaAmount] = useState<number>(85);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load neighbor data when modal opens or neighbor changes
  useEffect(() => {
    if (neighbor) {
      setFeeBalance(neighbor.feeBalance ?? 0);
      setBalanceAdjustment('');
      setLastPaymentAmount(neighbor.lastPaymentAmount ?? neighbor.monthlyFee ?? 85);
      setLastPaymentDate(neighbor.lastPaymentDate ?? todayIso());
      setLastPaymentConcept(neighbor.lastPaymentConcept ?? 'Cuota de comunidad');
      setNextDueDate(neighbor.nextDueDate ?? nextMonthFifthIso());

      setFeeFrequency(neighbor.feeFrequency ?? 'mensual');
      setQuotaAmount(neighbor.monthlyFee ?? 85);
      setSaveSuccess(false);
    }
  }, [neighbor, isOpen]);

  if (!isOpen || !neighbor) return null;

  // Handler to adjust balance
  const applyBalanceAdjustment = (isAddition: boolean) => {
    const val = parseFloat(balanceAdjustment);
    if (!isNaN(val) && val > 0) {
      const newBal = isAddition ? feeBalance + val : feeBalance - val;
      setFeeBalance(Math.round(newBal * 100) / 100);
      setBalanceAdjustment('');
    }
  };

  const handleFrequencyChange = (newFreq: 'mensual' | 'anual') => {
    if (newFreq === feeFrequency) return;
    setFeeFrequency(newFreq);
    // Optional smart conversion helper
    if (newFreq === 'anual' && quotaAmount <= 200) {
      setQuotaAmount(Math.round(quotaAmount * 12 * 100) / 100);
    } else if (newFreq === 'mensual' && quotaAmount >= 300) {
      setQuotaAmount(Math.round((quotaAmount / 12) * 100) / 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighbor) return;

    updateUser(neighbor.id, {
      feeBalance: Number(feeBalance),
      monthlyFee: Number(quotaAmount),
      feeFrequency,
      lastPaymentAmount: Number(lastPaymentAmount),
      lastPaymentDate,
      lastPaymentConcept: lastPaymentConcept.trim() || 'Cuota de comunidad',
      nextDueDate,
    });

    showToast('Cuenta actualizada', `Se guardó el saldo y las cuotas de ${neighbor.name}.`, 'success');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 700);
  };

  const isTechnician = currentUser.role === 'worker';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3.5">
            <img 
              src={neighbor.avatar} 
              alt={neighbor.name} 
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#16202E] leading-tight">
                  {neighbor.name}
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#128480]/15 text-[#128480] border border-[#128480]/30">
                  Vecino
                </span>
              </div>
              <p className="text-xs text-[#5A6B82] flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-[#0A2E6D]" />
                {neighbor.buildingName || 'Comunidad'} • {neighbor.unitOrArea || 'Vivienda'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Info Badge for Admin / Worker */}
        <div className="px-6 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-[#0A2E6D]">
          <span className="font-semibold flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#0A2E6D]" />
            Edición de Cuentas, Saldo y Cuotas del Vecino
          </span>
          <span className="text-[10px] font-mono bg-blue-100 text-[#0A2E6D] px-2 py-0.5 rounded-full font-bold">
            {isAdmin ? '🛡️ Administrador' : isTechnician ? '🛠️ Trabajador' : 'Gestión'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Saldo de la Cuenta */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0A2E6D]" />
                Saldo Actual de la Cuenta (€)
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                feeBalance >= 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {feeBalance >= 0 ? 'Al día / A favor' : 'Pendiente / Deudor'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[11px] text-[#5A6B82] font-semibold block mb-1">
                  Saldo establecido (€)
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={feeBalance}
                    onChange={(e) => setFeeBalance(Number(e.target.value))}
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-base font-bold outline-none border transition-colors ${
                      feeBalance >= 0 
                        ? 'bg-white border-green-300 text-green-700 focus:border-green-500' 
                        : 'bg-white border-red-300 text-red-700 focus:border-red-500'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#5A6B82]">€</span>
                </div>
              </div>

              {/* Quick balance modification widget */}
              <div>
                <span className="text-[11px] text-[#5A6B82] font-semibold block mb-1">
                  Añadir / Restar al saldo
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Importe..."
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#16202E] outline-none"
                  />
                  <button
                    type="button"
                    title="Añadir saldo (ingreso/abono)"
                    onClick={() => applyBalanceAdjustment(true)}
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Restar saldo (cargo/gasto)"
                    onClick={() => applyBalanceAdjustment(false)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFeeBalance(0)}
                className="text-[11px] text-[#0A2E6D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Poner saldo a 0,00 € (Sin deudas)
              </button>
            </div>
          </div>

          {/* Section 2: Configuración de Cuota y Menú de Periodicidad (Mensual o Anual) */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#0A2E6D]" />
                Periodicidad de la Cuota & Menú
              </label>
              <span className="text-[11px] text-[#5A6B82]">
                {feeFrequency === 'mensual' ? '12 cobros/año' : '1 cobro/año'}
              </span>
            </div>

            {/* Frequency Selector Menu */}
            <div className="grid grid-cols-2 gap-2 bg-[#E2E8F0]/60 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => handleFrequencyChange('mensual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  feeFrequency === 'mensual'
                    ? 'bg-white text-[#0A2E6D] shadow-sm'
                    : 'text-[#5A6B82] hover:text-[#16202E]'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#0A2E6D]" />
                <span>Cuota Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => handleFrequencyChange('anual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  feeFrequency === 'anual'
                    ? 'bg-white text-[#0A2E6D] shadow-sm'
                    : 'text-[#5A6B82] hover:text-[#16202E]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#128480]" />
                <span>Cuota Anual</span>
              </button>
            </div>

            {/* Quota Amount Input with Dynamic Unit Label */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                  Importe de la Cuota ({feeFrequency === 'mensual' ? '€/mes' : '€/año'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quotaAmount}
                    onChange={(e) => setQuotaAmount(Number(e.target.value))}
                    className="w-full pl-3 pr-16 py-2 bg-white border border-[#CBD5E1] focus:border-[#0A2E6D] rounded-xl text-sm font-bold text-[#16202E] outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-[#5A6B82]">
                    {feeFrequency === 'mensual' ? '€/mes' : '€/año'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#5A6B82]">
                <p className="font-semibold text-[#16202E] text-[11px]">Equivalencia estimada:</p>
                <p className="text-[11px] mt-0.5">
                  {feeFrequency === 'mensual' 
                    ? `Total anual: ${(quotaAmount * 12).toFixed(2).replace('.', ',')} €/año`
                    : `Promedio mensual: ${(quotaAmount / 12).toFixed(2).replace('.', ',')} €/mes`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Último Pago Realizado */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <label className="text-xs font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-600" />
              Editar Último Pago Registrado
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                  Importe del Último Pago (€)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={lastPaymentAmount}
                    onChange={(e) => setLastPaymentAmount(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-[#CBD5E1] focus:border-[#0A2E6D] rounded-xl text-sm font-bold text-green-700 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#5A6B82]">€</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                  Fecha del Último Pago
                </label>
                <input
                  type="date"
                  required
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                Concepto / Descripción del Pago
              </label>
              <input
                type="text"
                value={lastPaymentConcept}
                onChange={(e) => setLastPaymentConcept(e.target.value)}
                placeholder="Ej. Cuota Ordinaria de Mantenimiento - Agosto 2026"
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] outline-none"
              />
            </div>
          </div>

          {/* Section 4: Fecha de la Última Cuota / Próximo Vencimiento */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Fecha de Última / Próxima Cuota a Liquidar
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                  Fecha de Vencimiento / Emisión
                </label>
                <input
                  type="date"
                  required
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] outline-none"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#5A6B82]">
                <p className="font-semibold text-[#16202E] text-[11px]">Próximo cobro:</p>
                <p className="text-[11px] mt-0.5">
                  El vecino verá programada su cuota para el día{' '}
                  <strong className="text-[#0A2E6D]">
                    {nextDueDate
                      ? formatIsoDateEs(nextDueDate, { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'No definida'}
                  </strong>
                  .
                </p>
                {lastPaymentDate && (
                  <button
                    type="button"
                    className="mt-2 text-[11px] font-semibold text-[#0A2E6D] hover:underline cursor-pointer"
                    onClick={() => setNextDueDate(addPeriodToIso(lastPaymentDate, feeFrequency))}
                  >
                    Calcular desde el último pago ({feeFrequency === 'anual' ? '+1 año' : '+1 mes'})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-[#5A6B82] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                saveSuccess 
                  ? 'bg-green-600' 
                  : 'bg-[#0A2E6D] hover:bg-[#082456]'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado con Éxito!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios de Cuenta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
