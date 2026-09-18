import React, { useState } from 'react';
import {
  X,
  Euro,
  UserCheck,
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  Receipt,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

interface WorkerPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerPayoutModal: React.FC<WorkerPayoutModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, addWorkerPayout } = useApp();

  const workers = allUsers.filter((u) => u.role === 'worker');

  const [workerId, setWorkerId] = useState(workers[0]?.id || '');
  const [period, setPeriod] = useState('Nómina mensual 2 - Agosto 2026');
  const [amount, setAmount] = useState('');
  const [jobsCount, setJobsCount] = useState('3');
  const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState(`TRANS-NOM-${Date.now().toString().slice(-4)}`);
  const [status, setStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedWorker = workers.find((w) => w.id === workerId) || workers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor ingresa un importe válido.');
      return;
    }
    if (!selectedWorker) {
      setError('Selecciona un operario para registrar el pago.');
      return;
    }

    addWorkerPayout({
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      period,
      amount: numAmount,
      jobsCompletedCount: parseInt(jobsCount, 10) || 1,
      paymentDate: new Date().toISOString().slice(0, 10),
      date: new Date().toISOString().slice(0, 10),
      status,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-lg w-full text-[#16202E] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#191919]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-600">
              <Euro className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2E6D] bg-[#0A2E6D]/10 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                Acceso Exclusivo de Administrador
              </span>
              <h3 className="text-lg font-bold text-[#16202E] mt-0.5">
                Registrar Pago / Nómina a Operario
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
              Seleccionar Operario / Trabajador *
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] outline-none"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.specialty || 'Trabajador'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Período de Liquidación *
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Ej. Nómina mensual 2 - Agosto 2026"
                className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Importe de Pago (€) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-[#5A6B82] font-mono">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-6 pr-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] font-mono focus:ring-2 focus:ring-[#C2A05E] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Trabajos Incluidos
              </label>
              <input
                type="number"
                min="1"
                value={jobsCount}
                onChange={(e) => setJobsCount(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
              >
                <option value="transferencia">Transferencia Bancaria (SEPA)</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
              >
                <option value="pagado">Pagado / Finiquitado</option>
                <option value="pendiente">Pendiente de Pago</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
              Referencia / Referencia de Transferencia (Opcional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ej. SEPA-ES91-2100-998248192"
              className="w-full px-3.5 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
              Notas / Desglose de Servicios
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Liquidación de 3 incidencias de fontanería y electricidad..."
              className="w-full px-3.5 py-2 bg-[#F4F6FA] border border-[#2D2D2D] rounded-xl text-xs text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] outline-none"
            />
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Euro className="w-4 h-4" />
              Guardar Pago en Contabilidad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
