import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Euro, Calculator, Receipt, CheckCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Ticket, Transaction } from '../types';

interface WorkerServiceModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerServiceModal: React.FC<WorkerServiceModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  const { registerServiceAccounting, updateTicketStatus } = useApp();

  const [serviceCost, setServiceCost] = useState<number>(ticket?.serviceCost || 450);
  const [materialsCost, setMaterialsCost] = useState<number>(ticket?.materialsCost || 180);
  const [notes, setNotes] = useState<string>(
    'Servicio trabajador completado satisfactoriamente. Mano de obra calificada y cambio de piezas con garantía.'
  );
  const [paymentMethod, setPaymentMethod] = useState<Transaction['paymentMethod']>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    `REC-TEC-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [markAsResolved, setMarkAsResolved] = useState<boolean>(true);

  if (!ticket) return null;

  const total = Number(serviceCost || 0) + Number(materialsCost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    registerServiceAccounting({
      ticketId: ticket.id,
      serviceCost: Number(serviceCost),
      materialsCost: Number(materialsCost),
      notes,
      paymentMethod,
      referenceNumber,
    });

    if (markAsResolved && ticket.status !== 'resuelta') {
      updateTicketStatus(
        ticket.id,
        'resuelta',
        `Servicio concluido por el operario. Costo total de €${total} asentado a la contabilidad del edificio.`
      );
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 z-10 my-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-green-950/40 text-green-600 border border-green-200">
                  <Euro className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#16202E]">
                    Asentar Cobro / Gasto en Contabilidad
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    Ticket {ticket.ticketNumber || 'Pendiente'} • {ticket.buildingName || 'Edificio'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary of issue */}
            <div className="my-3.5 p-3 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-xs">
              <p className="font-semibold text-[#16202E] line-clamp-1">{ticket.title || 'Mantenimiento'}</p>
              <p className="text-[#5A6B82] mt-0.5">
                Ubicación: Piso {ticket.floor || '-'}, {ticket.unitOrArea || 'General'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Mano de Obra (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={serviceCost}
                      onChange={(e) => setServiceCost(Number(e.target.value))}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                    />
                    <Euro className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Materiales / Repuestos (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={materialsCost}
                      onChange={(e) => setMaterialsCost(Number(e.target.value))}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                    />
                    <Euro className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="p-3 bg-[#161616] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-[#16202E]">
                  <Calculator className="w-4 h-4 text-[#0A2E6D]" />
                  <span>Total a Registrar en Contabilidad:</span>
                </div>
                <span className="text-base font-bold text-[#0A2E6D]">
                  €${(Number(total) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Forma de Pago / Liquidación
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as Transaction['paymentMethod'])
                    }
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo / Caja Chica</option>
                    <option value="tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    N° Recibo / Comprobante
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                    />
                    <Receipt className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Notas de Trabajo / Desglose de Reparación
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalla qué repuestos o materiales se adquirieron y qué tareas se completaron..."
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                />
              </div>

              {/* Checkbox to mark as resolved */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#161616] cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={markAsResolved}
                  onChange={(e) => setMarkAsResolved(e.target.checked)}
                  className="rounded text-[#0A2E6D] focus:ring-[#C2A05E] h-4 w-4 bg-[#F4F6FA] border-[#E2E8F0]"
                />
                <span className="text-[#16202E] font-medium">
                  Marcar simultáneamente la incidencia como <strong className="text-green-600">RESUELTA</strong>
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-[#0A0A0A] bg-[#0A2E6D] hover:bg-[#D4B370] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Guardar en Libro Contable
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
