import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  User,
  Building2,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Euro,
  FileDown,
  FileSpreadsheet,
  Send,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Wrench,
  Receipt,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { canUpdateTicketStatus, canChargeRepairFund, canDeleteFinishedTicket, canAssignWorkers, canSetTicketPriority, canScheduleTicketVisit } from '../utils/permissions';
import { TicketPriority, TicketStatus } from '../types';
import { exportTicketDetailPDF, formatCurrency } from '../utils/exportUtils';
import { WorkerServiceModal } from './WorkerServiceModal';
import { WorkerRepairFundModal } from './WorkerRepairFundModal';
import { collectWorkerRoster } from '../utils/workers';

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
  isOpen?: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticketId, onClose, isOpen = true }) => {
  const {
    tickets,
    buildings,
    currentUser,
    allUsers,
    workerPayouts,
    customRoles,
    updateTicketStatus,
    assignWorkerToTicket,
    scheduleTicketVisit,
    deleteTicket,
    setTicketPriority,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRepairFundModalOpen, setIsRepairFundModalOpen] = useState(false);

  const ticket = tickets.find((t) => t.id === ticketId);

  useEffect(() => {
    if (isOpen && ticketId && !ticket) {
      onClose();
    }
  }, [isOpen, ticketId, ticket, onClose]);

  if (!isOpen || !ticket) return null;

  const building = buildings.find((b) => b.id === ticket.buildingId);
  const workers = collectWorkerRoster(allUsers, workerPayouts, tickets, customRoles);
  const existingExpenses = ticket.repairExpenses || [];

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgente':
        return 'bg-red-950/40 text-red-600 border-red-800/40';
      case 'alta':
        return 'bg-yellow-950/40 text-[#0A2E6D] border-[#0A2E6D]/40';
      case 'media':
        return 'bg-blue-950/40 text-blue-600 border-blue-200';
      default:
        return 'bg-[#E8EFF9] text-[#5A6B82] border-[#E2E8F0]';
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'resuelta':
        return {
          bg: 'bg-green-950/40 text-green-600 border-green-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Resuelto',
        };
      case 'en_proceso':
        return {
          bg: 'bg-yellow-950/40 text-yellow-600 border-yellow-200',
          icon: <Hourglass className="w-3.5 h-3.5" />,
          label: 'En Progreso',
        };
      case 'rechazada':
        return {
          bg: 'bg-red-950/40 text-red-600 border-red-800/40',
          icon: <X className="w-3.5 h-3.5" />,
          label: 'Rechazada',
        };
      default:
        return {
          bg: 'bg-[#E8EFF9] text-[#5A6B82] border-[#E2E8F0]',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Pendiente',
        };
    }
  };

  const statusInfo = getStatusBadge(ticket.status);

  const handleAddCommentOrProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Use current status with notes
    updateTicketStatus(ticket.id, ticket.status, commentText.trim());
    setCommentText('');
  };

  return (
    <>
      <AnimatePresence>
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
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-3xl w-full p-6 z-10 my-8 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0A2E6D] bg-[#E8EFF9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                    {ticket.ticketNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}
                  >
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                  {canSetTicketPriority(currentUser, ticket) && ticket.status !== 'resuelta' && (
                    <select
                      value={ticket.priority}
                      onChange={(e) => setTicketPriority(ticket.id, e.target.value as TicketPriority)}
                      className="text-[11px] font-bold border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white text-[#16202E] cursor-pointer"
                    >
                      <option value="urgente">Urgente</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  )}
                  {building && (
                    <span className="font-mono text-xs font-semibold text-green-600 bg-green-950/30 px-2 py-0.5 rounded border border-green-200">
                      Caja Edificio: {formatCurrency(building.repairFund || 0)}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#16202E] leading-snug">
                  {ticket.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {canDeleteFinishedTicket(currentUser, ticket) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar el reporte resuelto ${ticket.ticketNumber}? Esta acción no se puede deshacer.`)) {
                        deleteTicket(ticket.id);
                        onClose();
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 flex items-center gap-1 text-xs font-medium cursor-pointer"
                    title="Eliminar incidencia"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar reporte</span>
                  </button>
                )}
                <button
                  onClick={() => exportTicketDetailPDF(ticket)}
                  className="p-2 text-[#16202E] hover:text-[#0A2E6D] hover:bg-[#E8EFF9] rounded-lg transition-colors border border-[#E2E8F0] flex items-center gap-1 text-xs font-medium cursor-pointer"
                  title="Descargar Hoja de Ticket en PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto space-y-5 py-4 pr-1">
              {/* Location & Metadata Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Edificio</span>
                  <span className="font-semibold text-[#16202E] truncate block">{ticket.buildingName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Ubicación</span>
                  <span className="font-semibold text-[#16202E]">Piso {ticket.floor} - {ticket.unitOrArea}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Reportó</span>
                  <span className="font-semibold text-[#16202E] truncate block">{ticket.createdBy.name}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Categoría</span>
                  <span className="font-semibold text-[#0A2E6D] capitalize">{ticket.category}</span>
                </div>
              </div>

              {/* Description & Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#16202E] uppercase tracking-wider">
                  Descripción del Problema
                </h4>
                <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] text-xs text-[#D1D5DB] leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Incident Photos if any */}
              {ticket.photos && ticket.photos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#16202E] uppercase tracking-wider">
                    Fotografías del Incidencia
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ticket.photos.map((ph, idx) => (
                      <div key={idx} className="relative h-28 rounded-xl overflow-hidden border border-[#E2E8F0]">
                        <img
                          src={ph}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worker Assignment & Operational Controls */}
              <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">
                      Trabajador / Operario Asignado
                    </span>
                    <p className="text-xs font-semibold text-[#16202E] mt-0.5">
                      {ticket.assignedWorkerName
                        ? `${ticket.assignedWorkerName} (${ticket.assignedWorkerSpecialty || 'Especialista'})`
                        : 'Aún no se ha asignado un operario para atender esta solicitud.'}
                    </p>
                  </div>

                  {canAssignWorkers(currentUser) && (
                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.assignedWorkerId || ''}
                        onChange={(e) => assignWorkerToTicket(ticket.id, e.target.value)}
                        className="text-xs border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 bg-[#F4F6FA] text-[#16202E] font-medium focus:ring-2 focus:ring-[#C2A05E]"
                      >
                        <option value="">-- Asignar Trabajador --</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.specialty || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {canScheduleTicketVisit(currentUser, ticket) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-[#0A2E6D]" />
                    <label className="font-semibold text-[#16202E]">
                      Día de visita
                      <input
                        type="date"
                        value={ticket.scheduledVisitDate || ''}
                        onChange={(e) => scheduleTicketVisit(ticket.id, e.target.value)}
                        className="ml-2 px-2 py-1.5 border border-[#E2E8F0] rounded-lg bg-[#F4F6FA]"
                      />
                    </label>
                    {ticket.scheduledVisitDate && (
                      <span className="text-[#5A6B82]">
                        Ir a {ticket.buildingName} a hacer: {ticket.title}
                      </span>
                    )}
                  </div>
                )}

                {/* Worker / Admin State Transitions Controls & Modifying Money Box */}
                {canUpdateTicketStatus(currentUser, ticket) && (
                  <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#5A6B82] mr-1">Cambiar Estado:</span>
                      {ticket.status !== 'pendiente' && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'pendiente', 'Reabierto a estado pendiente')}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0] cursor-pointer"
                        >
                          Pendiente
                        </button>
                      )}
                      {ticket.status !== 'en_proceso' && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'en_proceso', 'Trabajador inició los trabajos de mantenimiento')}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 hover:bg-yellow-900/50 text-yellow-300 border border-yellow-800/50 cursor-pointer"
                        >
                          En Proceso
                        </button>
                      )}
                      {ticket.status !== 'resuelta' && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'resuelta', 'Incidencia resuelta y validada por el trabajador')}
                          className="px-2.5 py-1 rounded-md text-xs font-bold bg-green-600 hover:bg-green-500 text-[#16202E] shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marcar Resuelta
                        </button>
                      )}
                    </div>

                    {/* Button to Open Repair Fund Modal (Requested) */}
                    {canChargeRepairFund(currentUser, ticket) && (
                    <button
                      onClick={() => setIsRepairFundModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Modificar Caja & Añadir Gasto
                    </button>
                    )}
                  </div>
                )}
              </div>

              {/* Itemized Repair Expenses Charged to Building Box */}
              {existingExpenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#0A2E6D]" />
                      Gastos Descontados de la Incidencias Generales ({existingExpenses.length})
                    </h4>
                    <span className="font-mono font-bold text-yellow-600">
                      Total: {formatCurrency(ticket.materialsCost || 0)}
                    </span>
                  </div>

                  <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] divide-y divide-[#202020] overflow-hidden text-xs">
                    {existingExpenses.map((exp) => (
                      <div key={exp.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#16202E]">{exp.concept}</p>
                          <p className="text-[11px] text-[#5A6B82]">
                            {exp.date} • {exp.workerName} • <span className="capitalize">{exp.category}</span>
                            {exp.notes && ` (${exp.notes})`}
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

              {/* Resolution Notes if Resolved */}
              {ticket.status === 'resuelta' && (
                <div className="p-3.5 bg-green-950/30 rounded-xl border border-green-200 text-xs text-green-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Incidencia Solucionada Satisfactoriamente
                  </div>
                  <p className="text-[11px] text-[#D1D5DB]">
                    {ticket.resolutionNotes || 'Trabajos de mantenimiento concluidos conforme a especificaciones.'}
                  </p>
                </div>
              )}

              {/* Comprehensive Audit Trail / Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#16202E] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#5A6B82]" />
                    Historial Completo de Seguimiento ({(ticket.timeline || []).length} Registros)
                  </h4>
                  <span className="text-[11px] text-[#5A6B82]">Trazabilidad auditada</span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8EFF9]">
                  {(ticket.timeline || []).map((evt, idx) => (
                    <div key={evt.id || idx} className="relative group">
                      {/* Timeline marker */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#F4F6FA] border-2 border-[#0A2E6D] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0A2E6D]" />
                      </div>

                      <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0] text-xs">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#16202E]">{evt.authorName}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                                evt.authorRole === 'admin'
                                  ? 'bg-yellow-950/40 text-[#0A2E6D] border-[#0A2E6D]/40'
                                  : evt.authorRole === 'president'
                                  ? 'bg-blue-950/40 text-blue-600 border-blue-200'
                                  : 'bg-green-950/40 text-green-600 border-green-200'
                              }`}
                            >
                              {evt.authorRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#5A6B82] font-mono">
                            {new Date(evt.timestamp).toLocaleString('es-ES', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <p className="font-semibold text-[#16202E]">{evt.action}</p>
                        {evt.notes && (
                          <p className="text-[#5A6B82] mt-1 text-[11px] bg-[#161616] p-2 rounded-lg border border-[#E2E8F0]">
                            "{evt.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Note or Progress Form */}
              <form onSubmit={handleAddCommentOrProgress} className="pt-3 border-t border-[#E2E8F0]">
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1.5">
                  Agregar Bitácora o Mensaje de Seguimiento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario sobre el avance o repuestos..."
                    className="flex-1 px-3.5 py-2 text-xs bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl text-[#16202E] placeholder-[#666666] focus:ring-2 focus:ring-[#C2A05E] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Repair Fund Expense Modal */}
      {isRepairFundModalOpen && (
        <WorkerRepairFundModal
          ticket={ticket}
          isOpen={isRepairFundModalOpen}
          onClose={() => setIsRepairFundModalOpen(false)}
        />
      )}

      {/* Service Settlement Modal */}
      {isServiceModalOpen && (
        <WorkerServiceModal
          ticket={ticket}
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
        />
      )}
    </>
  );
};
