import React, { useEffect, useState } from 'react';
import { X, Euro, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkerPayout } from '../types';
import { collectWorkerRoster } from '../utils/workers';
import { currentPeriodLabel } from '../utils/dates';

interface WorkerPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerPayoutModal: React.FC<WorkerPayoutModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, workerPayouts, tickets, customRoles, addWorkerPayout, currentUser } = useApp();
  const workers = collectWorkerRoster(allUsers, workerPayouts, tickets, customRoles);

  const [workerId, setWorkerId] = useState('manual');
  const [manualName, setManualName] = useState('');
  const [manualSpecialty, setManualSpecialty] = useState('');
  const [period, setPeriod] = useState(`Nómina mensual - ${currentPeriodLabel()}`);
  const [amount, setAmount] = useState('');
  const [jobsCount, setJobsCount] = useState('3');
  const [paymentMethod, setPaymentMethod] = useState<WorkerPayout['paymentMethod']>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState(`TRANS-NOM-${Date.now().toString().slice(-4)}`);
  const [status, setStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const roster = collectWorkerRoster(allUsers, workerPayouts, tickets, customRoles);
    setWorkerId(roster[0]?.id || 'manual');
    setPeriod(`Nómina mensual - ${currentPeriodLabel()}`);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedWorker = workers.find((w) => w.id === workerId);
  const isManual = workerId === 'manual' || workers.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Introduce un importe válido.');
      return;
    }

    const name = isManual ? manualName.trim() : selectedWorker?.name || '';
    if (!name) {
      setError('Selecciona o escribe el nombre del operario.');
      return;
    }

    addWorkerPayout({
      workerId: isManual ? `manual-${Date.now()}` : selectedWorker?.id || name,
      workerName: name,
      workerSpecialty: isManual ? manualSpecialty.trim() || undefined : selectedWorker?.specialty,
      period,
      amount: numAmount,
      jobsCompletedCount: parseInt(jobsCount, 10) || 1,
      date: new Date().toISOString().slice(0, 10),
      status,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || '-',
      notes: notes.trim() || undefined,
      approvedByAdmin: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-lg w-full text-[#16202E] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#16202E]">Registrar pago / nómina a operario</h3>
            <p className="text-xs text-[#5A6B82] mt-0.5">Puedes elegir un trabajador existente o escribirlo a mano.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[#E8EFF9] rounded-xl cursor-pointer">
            <X className="w-5 h-5 text-[#5A6B82]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Operario *</label>
            <select
              value={isManual && workers.length === 0 ? 'manual' : workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs outline-none"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.specialty ? `(${w.specialty})` : ''}
                </option>
              ))}
              <option value="manual">Otro operario (escribir nombre)</option>
            </select>
          </div>

          {isManual && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Nombre y apellidos"
                className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              />
              <input
                value={manualSpecialty}
                onChange={(e) => setManualSpecialty(e.target.value)}
                placeholder="Especialidad"
                className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Período *</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Importe (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Trabajos incluidos</label>
              <input
                type="number"
                min="0"
                value={jobsCount}
                onChange={(e) => setJobsCount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Método</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as WorkerPayout['paymentMethod'])}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pagado' | 'pendiente')}
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
              >
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Referencia SEPA"
            className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
          />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas / desglose"
            className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs font-semibold cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-[#0A2E6D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Euro className="w-4 h-4" />
              Guardar pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
