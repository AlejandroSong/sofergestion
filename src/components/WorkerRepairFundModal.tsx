import React, { useState } from 'react';
import {
  X,
  Euro,
  Wrench,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tag,
  FileText,
  TrendingDown,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Ticket } from '../types';
import { formatCurrency } from '../utils/exportUtils';

interface WorkerRepairFundModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerRepairFundModal: React.FC<WorkerRepairFundModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const { buildings, addRepairExpenseToTicket, currentUser } = useApp();

  const building = buildings.find((b) => b.id === ticket.buildingId);

  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'repuestos' | 'materiales' | 'mano_obra' | 'emergencia' | 'otro'>('repuestos');
  const [categoryOther, setCategoryOther] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsResolved, setMarkAsResolved] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !building) return null;

  const currentBoxBalance = building.repairFund || 0;
  const numAmount = parseFloat(amount) || 0;
  const resultingBoxBalance = Math.max(0, currentBoxBalance - numAmount);
  const existingExpenses = ticket.repairExpenses || [];
  const totalExpensesLogged = existingExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      setError('Por favor describe el concepto o repuesto adquirido.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresa un importe válido mayor a 0.');
      return;
    }

    addRepairExpenseToTicket({
      ticketId: ticket.id,
      concept: concept.trim(),
      amount: numAmount,
      category,
      categoryOther: category === 'otro' ? categoryOther.trim() : undefined,
      notes: notes.trim(),
      markAsResolved,
      resolutionNotes: resolutionNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-2xl w-full text-[#16202E] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#191919]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0A2E6D] bg-[#0A2E6D]/10 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                  {ticket.ticketNumber}
                </span>
                <span className="text-xs text-yellow-600 bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-200 font-semibold uppercase">
                  En Proceso de Reparación
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#16202E] mt-0.5">
                Modificar Caja & Añadir Gasto de Reparación
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#E8EFF9] rounded-xl text-[#5A6B82] hover:text-[#16202E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Building & Money Box Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-[#F4F6FA] rounded-2xl border border-[#2D2D2D] space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#5A6B82] font-semibold">
                <Building2 className="w-3.5 h-3.5 text-[#0A2E6D]" />
                <span>Edificio Asignado</span>
              </div>
              <p className="font-bold text-[#16202E] text-sm">{building.name}</p>
              <p className="text-xs text-[#5A6B82]">
                Piso {ticket.floor} • {ticket.unitOrArea}
              </p>
            </div>

            <div className="p-4 bg-[#F4F6FA] rounded-2xl border border-[#2D2D2D] space-y-1">
              <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold">
                <span>Incidencias Generales Disponible</span>
                <Euro className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold font-mono text-green-600">
                  {formatCurrency(currentBoxBalance)}
                </p>
                <span className="text-[11px] text-[#5A6B82]">
                  (Inicial: {formatCurrency(building.initialRepairFund)})
                </span>
              </div>
              <p className="text-[11px] text-[#5A6B82]">
                Fondo activo para cubrir repuestos, materiales e incidencias
              </p>
            </div>
          </div>

          {/* Ticket context summary */}
          <div className="p-3.5 bg-[#0F0F0F] rounded-xl border border-[#E2E8F0] text-xs">
            <span className="font-bold text-[#0A2E6D] block mb-1">Incidencia Reportada:</span>
            <p className="text-[#16202E] font-medium">{ticket.title}</p>
            <p className="text-[#5A6B82] mt-1 text-[11px]">{ticket.description}</p>
          </div>

          {/* Existing expenses list for this ticket if any */}
          {existingExpenses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#16202E] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#0A2E6D]" />
                  Gastos Ya Aplicados a Este Incidencia ({existingExpenses.length})
                </span>
                <span className="font-mono font-bold text-yellow-600">
                  Total Acumulado: {formatCurrency(totalExpensesLogged)}
                </span>
              </div>
              <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] divide-y divide-[#202020] overflow-hidden text-xs">
                {existingExpenses.map((exp) => (
                  <div key={exp.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#16202E]">{exp.concept}</p>
                      <p className="text-[11px] text-[#5A6B82]">
                        {exp.date} • {exp.workerName} • <span className="capitalize">{exp.category}</span>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-red-600">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Expense Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A2E6D] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Nuevo Gasto a Descontar de la Caja del Edificio
            </h4>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Concepto / Pieza / Material Requerido *
                </label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => {
                    setConcept(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej. Cerradura Yale mod. 505 + 2 juegos de llaves"
                  className="w-full px-3.5 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Importe a Descontar de la Caja (€) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-[#5A6B82] font-mono">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] font-mono focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Categoría de Gasto
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
                  >
                    <option value="repuestos">Repuestos & Piezas</option>
                    <option value="materiales">Materiales e Insumos</option>
                    <option value="mano_obra">Mano de Obra Especializada</option>
                    <option value="emergencia">Atención de Emergencia</option>
                    <option value="otro">Otro Gasto</option>
                  </select>
                </div>
              </div>

              {category === 'otro' && (
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Especificar Otro *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    placeholder="Ej. Herramienta especial..."
                    className="w-full px-3 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Notas / Referencia de Factura o Ticket de Compra (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Comprado en Ferretería Central con ticket #8841"
                  className="w-full px-3.5 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
                />
              </div>

              {/* Impact on Building Box Preview */}
              {numAmount > 0 && (
                <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#2B2B2B] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[#5A6B82]">Saldo Anterior en Caja:</span>
                    <p className="font-mono font-semibold text-[#16202E]">{formatCurrency(currentBoxBalance)}</p>
                  </div>
                  <div className="text-center font-bold text-red-600">
                    <span className="text-[10px] block text-[#5A6B82]">Deducción:</span>
                    -{formatCurrency(numAmount)}
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[#5A6B82]">Nuevo Saldo de Caja:</span>
                    <p className="font-mono font-bold text-green-600">{formatCurrency(resultingBoxBalance)}</p>
                  </div>
                </div>
              )}

              {/* Checkbox to Mark as Resuelto */}
              <div className="p-4 bg-[#191919] rounded-2xl border border-[#E2E8F0] space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={markAsResolved}
                    onChange={(e) => setMarkAsResolved(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] bg-[#FFFFFF] text-[#0A2E6D] focus:ring-[#C2A05E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#16202E] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Finalizar Proceso y Marcar Incidencia como RESUELTO
                    </span>
                    <p className="text-[11px] text-[#5A6B82] mt-0.5 leading-relaxed">
                      Al marcar esta casilla, la incidencia se dará por solucionada, se notificará al Administrador y al Presidente del edificio, y se cerrará el ciclo de reparación.
                    </p>
                  </div>
                </label>

                {markAsResolved && (
                  <div className="pl-7 pt-2">
                    <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                      Descripción de la Solución Final Realizada
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describe el trabajo final efectuado para cerrar la incidencia..."
                      className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-[#5A6B82] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                  markAsResolved
                    ? 'bg-green-600 hover:bg-green-500 text-[#16202E]'
                    : 'bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A]'
                }`}
              >
                {markAsResolved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Asentar Gasto & Marcar como Resuelto
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Asentar Gasto y Modificar Caja
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
