import React, { useState } from 'react';
import { Building, ExceptionalExpense } from '../types';
import { useApp } from '../context/AppContext';
import { AlertCircle, Plus, CheckCircle2, Trash2, Calendar, FileText, Info } from 'lucide-react';

interface ExceptionalExpensesManagerProps {
  building: Building;
}

export const ExceptionalExpensesManager: React.FC<ExceptionalExpensesManagerProps> = ({ building }) => {
  const { addExceptionalExpense, markExceptionalExpenseAsPaid, removeExceptionalExpense, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));

  const canEdit = currentUser.role === 'admin';
  const expenses = building.exceptionalExpenses || [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reason.trim() || !amount) return;

    addExceptionalExpense(building.id, {
      name: name.trim(),
      reason: reason.trim(),
      amount: parseFloat(amount),
      dateIncurred,
      dueDate,
    });

    setIsModalOpen(false);
    setName('');
    setReason('');
    setAmount('');
    setDateIncurred(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  };

  const handleMarkAsPaid = (id: string) => {
    if (window.confirm('¿Marcar este gasto excepcional como pagado? Esto registrará un egreso en la contabilidad general.')) {
      markExceptionalExpenseAsPaid(building.id, id, 'transferencia');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto excepcional?')) {
      removeExceptionalExpense(building.id, id);
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-[#16202E] font-bold text-lg">Gastos Excepcionales</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Añadir Gasto
          </button>
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-10 bg-[#FFFFFF] rounded-xl border border-dashed border-[#E2E8F0]">
          <FileText className="w-10 h-10 mx-auto text-[#444444] mb-3 stroke-1" />
          <p className="text-sm font-medium text-[#D1D5DB]">Sin gastos excepcionales registrados</p>
          {canEdit && (
            <p className="text-xs text-[#5A6B82] mt-1">Haz clic en "Añadir Gasto" para registrar uno.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F6FA] text-[#5A6B82] text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Gasto / Motivo</th>
                <th className="px-4 py-3 font-medium">Costo (€)</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Vencimiento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-[#FFFFFF] text-sm">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-[#F4F6FA] transition-colors group">
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-[#16202E]">{expense.name}</p>
                    <p className="text-xs text-[#5A6B82] mt-0.5">{expense.reason}</p>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium align-top">
                    {expense.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A6B82] align-top whitespace-nowrap">
                    {expense.dateIncurred}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A6B82] align-top whitespace-nowrap">
                    {expense.dueDate}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        expense.status === 'pagado'
                          ? 'bg-green-950/30 text-green-600 border border-green-800/30'
                          : 'bg-yellow-950/30 text-yellow-600 border border-yellow-800/30'
                      }`}
                    >
                      {expense.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex justify-end gap-2">
                      {expense.status === 'pendiente' && canEdit && (
                        <button
                          onClick={() => handleMarkAsPaid(expense.id)}
                          title="Marcar como pagado"
                          className="p-1.5 bg-[#E8EFF9] text-[#5A6B82] hover:text-green-600 hover:bg-[#E8EFF9] rounded transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(expense.id)}
                          title="Eliminar gasto"
                          className="p-1.5 bg-[#E8EFF9] text-[#5A6B82] hover:text-red-600 hover:bg-[#E8EFF9] rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] rounded-2xl w-full max-w-lg border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] bg-[#FFFFFF]">
              <h2 className="text-lg font-bold text-[#16202E]">
                Añadir Gasto Excepcional
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#5A6B82] hover:text-[#16202E] transition-colors rounded-lg hover:bg-[#E8EFF9]"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Nombre del Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Reparación de tubería rota"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#C2A05E] bg-[#FFFFFF] text-[#16202E]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  ¿Por qué se hizo este gasto? (Motivo) *
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica la razón del gasto excepcional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#C2A05E] bg-[#FFFFFF] text-[#16202E] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Costo (€) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#C2A05E] bg-[#FFFFFF] text-[#16202E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateIncurred}
                    onChange={(e) => setDateIncurred(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#C2A05E] bg-[#FFFFFF] text-[#16202E] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Fecha Límite de Pago *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:ring-2 focus:ring-[#C2A05E] bg-[#FFFFFF] text-[#16202E] [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#5A6B82] hover:text-[#16202E] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Añadir Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
