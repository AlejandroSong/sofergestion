import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  FileDown,
  Building2,
  Calendar,
  Euro,
  Wrench,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportAccountingToExcel,
  exportTicketsToExcel,
  exportBuildingFinancialStatementPDF,
  exportWorkerExpenseReportPDF,
  formatCurrency,
} from '../utils/exportUtils';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const {
    buildings,
    tickets,
    transactions,
    currentUser,
    allUsers,
    resetBuildingOperations,
    resetAllOperations,
    deleteTicket,
    deleteTransaction,
    deleteNeighborRequest,
    neighborRequests,
  } = useApp();

  const [reportType, setReportType] = useState<'financial' | 'maintenance' | 'worker' | 'docs'>('financial');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [copiedDocs, setCopiedDocs] = useState(false);

  if (!isOpen) return null;

  const inPeriod = (iso?: string) => {
    if (!period) return true;
    return String(iso || '').slice(0, 7) === period;
  };

  const targetBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const buildingName = targetBuilding ? targetBuilding.name : 'Todos los Edificios';
  const periodLabel = period
    ? new Date(`${period}-01T12:00:00`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Histórico';

  const relevantTransactions = transactions.filter((t) => {
    if (selectedBuildingId !== 'all' && t.buildingId !== selectedBuildingId) return false;
    return inPeriod(t.date);
  });

  const relevantTickets = tickets.filter((t) => {
    if (selectedBuildingId !== 'all' && t.buildingId !== selectedBuildingId) return false;
    return inPeriod(t.createdAt);
  });

  const totalIngresos = relevantTransactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGastos = relevantTransactions
    .filter((t) => t.type === 'gasto')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIngresos - totalGastos;

  // Google Docs Formatted text generation
  const docsContent = `===============================================================
INFORME OFICIAL DE GESTIÓN Y MANTENIMIENTO DE EDIFICIOS
===============================================================
Alcance: ${buildingName}
Período: ${periodLabel}
Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}
Generado por: ${currentUser.name} (${currentUser.role.toUpperCase()})

---------------------------------------------------------------
1. RESUMEN FINANCIERO Y CONTABLE
---------------------------------------------------------------
* Total Ingresos Recaudados (Cuotas y Servicios): ${formatCurrency(totalIngresos)}
* Total Gastos de Mantenimiento y Servicios:       ${formatCurrency(totalGastos)}
* Balance Operativo Disponible:                  ${formatCurrency(balance)}
* Total de Movimientos Asentados:                 ${relevantTransactions.length}

---------------------------------------------------------------
2. GESTIÓN DE INCIDENCIAS Y SOLICITUDES DE MANTENIMIENTO
---------------------------------------------------------------
* Total Incidencias Registradas:                  ${relevantTickets.length}
* Incidencias Resueltas:                          ${relevantTickets.filter((t) => t.status === 'resuelta').length}
* Incidencias en Proceso:                         ${relevantTickets.filter((t) => t.status === 'en_proceso').length}
* Incidencias Pendientes:                         ${relevantTickets.filter((t) => t.status === 'pendiente').length}

---------------------------------------------------------------
3. DETALLE DE SOLICITUDES ATENDIDAS POR LOS TRABAJADORES:
---------------------------------------------------------------
${relevantTickets
  .map(
    (t, idx) =>
      `${idx + 1}. [${t.ticketNumber}] ${t.title}
   - Edificio: ${t.buildingName} (Piso ${t.floor}, ${t.unitOrArea})
   - Estado: ${t.status.toUpperCase()} | Prioridad: ${t.priority.toUpperCase()}
   - Trabajador Asignado: ${t.assignedWorkerName || 'Sin asignar'}
   - Costo Mano de Obra: €${t.serviceCost || 0} | Materiales: €${t.materialsCost || 0} | Total: €${t.totalCharged || 0}
   - Historial de Seguimiento: ${(t.timeline || []).length} eventos registrados
`
  )
  .join('\n')}

===============================================================
Documento auditado y generado automáticamente para Google Docs.
`;

  const handleCopyDocs = () => {
    navigator.clipboard.writeText(docsContent);
    setCopiedDocs(true);
    setTimeout(() => setCopiedDocs(false), 3000);
  };

  const handleDownloadExcel = () => {
    if (reportType === 'maintenance' || reportType === 'worker') {
      exportTicketsToExcel(relevantTickets, buildingName);
      return;
    }
    exportAccountingToExcel(relevantTransactions, buildingName, periodLabel);
  };

  const handleDownloadPDF = () => {
    if (reportType === 'worker') {
      const worker =
        allUsers.find((u) => u.role === 'worker') ||
        (currentUser.role === 'worker' ? currentUser : undefined);
      if (worker) {
        exportWorkerExpenseReportPDF(worker, relevantTickets, relevantTransactions, periodLabel);
        return;
      }
    }

    const scopeBuilding = targetBuilding || {
      ...(buildings[0] || {
        id: 'all',
        name: 'Todos los Edificios',
        code: 'CONS',
        address: '',
        city: '',
        totalUnits: buildings.reduce((a, b) => a + b.totalUnits, 0),
        floors: 0,
        presidentId: '',
        presidentName: 'Administración',
        presidentPhone: '',
        presidentEmail: '',
        image: '',
        monthlyQuotaFee: 0,
        repairFund: buildings.reduce((a, b) => a + (b.repairFund || 0), 0),
        initialRepairFund: 0,
        currency: '€',
        emergencyContact: '',
        bankAccount: '',
        createdAt: new Date().toISOString().slice(0, 10),
      }),
      name: buildingName,
      code: targetBuilding?.code || 'CONS',
    };

    exportBuildingFinancialStatementPDF(scopeBuilding, relevantTransactions, relevantTickets, periodLabel);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-3xl w-full p-6 z-10 my-8 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#E8EFF9] text-[#0A2E6D] border border-[#E2E8F0]">
                <FileSpreadsheet className="w-5 h-5 text-[#0A2E6D]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#16202E]">
                  Centro de Incidencias Financieros & Mantenimiento
                </h3>
                <p className="text-xs text-[#5A6B82]">
                  Exportación automática a PDF, Excel y Google Docs.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selectors Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0] shrink-0">
            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                Tipo de Incidencia
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as typeof reportType)}
                className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs bg-[#F4F6FA] text-[#16202E] focus:ring-2 focus:ring-[#C2A05E]"
              >
                <option value="financial">1. Estado de Cuenta & Finanzas</option>
                <option value="maintenance">2. Incidencias & Mantenimiento</option>
                <option value="worker">3. Liquidación Mensual de Trabajadors</option>
                <option value="docs">4. Formato para Google Docs</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                Edificio
              </label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs bg-[#F4F6FA] text-[#16202E] focus:ring-2 focus:ring-[#C2A05E]"
              >
                <option value="all">Todos los Edificios (Consolidado)</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                Período
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs bg-[#F4F6FA] text-[#16202E] focus:ring-2 focus:ring-[#C2A05E]"
              />
            </div>
          </div>

          {currentUser.role === 'admin' && (
            <div className="mb-4 p-3 rounded-xl border border-red-100 bg-red-50/60 space-y-2 shrink-0">
              <p className="text-[11px] font-bold text-red-800 uppercase">Control de administrador</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBuildingId === 'all') {
                      if (confirm('Esto eliminará TODOS los balances generales, movimientos, cajas de reparación y saldos de cuota. Las incidencias no se borran. ¿Continuar?')) {
                        resetAllOperations();
                      }
                      return;
                    }
                    if (confirm('¿Eliminar los balances de este edificio y empezar de 0? Las incidencias no se borran.')) {
                      resetBuildingOperations(selectedBuildingId);
                    }
                  }}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-red-200 text-red-700 cursor-pointer"
                >
                  Borrar balances {selectedBuildingId === 'all' ? '(todos)' : '(edificio)'}
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {relevantTickets.filter((t) => t.status === 'resuelta' || t.status === 'rechazada').slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] bg-white rounded-lg px-2 py-1 border border-[#E2E8F0]">
                    <span className="truncate">{t.ticketNumber} · {t.title}</span>
                    <button type="button" onClick={() => { if (confirm(`¿Eliminar el reporte terminado ${t.ticketNumber}?`)) deleteTicket(t.id); }} className="text-red-600 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {relevantTransactions.slice(0, 8).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-[11px] bg-white rounded-lg px-2 py-1 border border-[#E2E8F0]">
                    <span className="truncate">{tx.description || tx.code} · {formatCurrency(tx.amount)}</span>
                    <button type="button" onClick={() => { if (confirm('¿Eliminar este movimiento?')) deleteTransaction(tx.id); }} className="text-red-600 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {neighborRequests.filter((r) => selectedBuildingId === 'all' || r.buildingId === selectedBuildingId).slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[11px] bg-white rounded-lg px-2 py-1 border border-[#E2E8F0]">
                    <span className="truncate">Solicitud · {r.serviceName || r.id}</span>
                    <button type="button" onClick={() => deleteNeighborRequest(r.id)} className="text-red-600 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Preview Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* KPI preview cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-950/30 rounded-xl border border-green-200">
                <span className="text-[10px] uppercase font-bold text-green-600 block">Total Ingresos</span>
                <span className="text-base font-bold text-green-600 font-mono">
                  {formatCurrency(totalIngresos)}
                </span>
              </div>
              <div className="p-3 bg-red-950/30 rounded-xl border border-red-800/40">
                <span className="text-[10px] uppercase font-bold text-red-600 block">Total Gastos</span>
                <span className="text-base font-bold text-red-600 font-mono">
                  {formatCurrency(totalGastos)}
                </span>
              </div>
              <div className="p-3 bg-[#161616] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#0A2E6D] block">Balance Neto</span>
                <span className="text-base font-bold text-[#16202E] font-mono">
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            {/* Google Docs Text Preview or Summary */}
            {reportType === 'docs' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#16202E] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0A2E6D]" />
                    Vista Previa de Documento (Compatible con Google Docs)
                  </span>
                  <button
                    onClick={handleCopyDocs}
                    className="px-3 py-1 bg-[#E8EFF9] hover:bg-[#282828] text-[#0A2E6D] border border-[#0A2E6D]/40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedDocs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedDocs ? '¡Copiado al Portapapeles!' : 'Copiar Texto Formateado'}
                  </button>
                </div>
                <pre className="p-4 bg-[#F4F6FA] text-[#16202E] rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-[#E2E8F0]">
                  {docsContent}
                </pre>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#16202E] uppercase tracking-wider">
                  Muestra de {periodLabel} ({relevantTransactions.length} movimientos • {relevantTickets.length} incidencias)
                </h4>
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left text-[#16202E]">
                    <thead className="bg-[#161616] text-[#5A6B82] uppercase text-[10px] font-semibold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-2 px-3">{reportType === 'maintenance' || reportType === 'worker' ? 'Ticket' : 'Fecha'}</th>
                        <th className="py-2 px-3">Edificio</th>
                        <th className="py-2 px-3">Concepto</th>
                        <th className="py-2 px-3 text-right">{reportType === 'maintenance' || reportType === 'worker' ? 'Estado' : 'Importe'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202020]">
                      {reportType === 'maintenance' || reportType === 'worker'
                        ? relevantTickets.slice(0, 8).map((t) => (
                            <tr key={t.id} className="hover:bg-[#F4F6FA]">
                              <td className="py-2 px-3 font-mono text-[#5A6B82]">{t.ticketNumber}</td>
                              <td className="py-2 px-3 font-semibold text-[#16202E]">{t.buildingName}</td>
                              <td className="py-2 px-3 text-[#5A6B82]">{t.title}</td>
                              <td className="py-2 px-3 text-right font-bold">{t.status.replace('_', ' ')}</td>
                            </tr>
                          ))
                        : relevantTransactions.slice(0, 8).map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#F4F6FA]">
                          <td className="py-2 px-3 font-mono text-[#5A6B82]">{tx.date}</td>
                          <td className="py-2 px-3 font-semibold text-[#16202E]">{tx.buildingName}</td>
                          <td className="py-2 px-3 text-[#5A6B82]">{tx.description}</td>
                          <td
                            className={`py-2 px-3 text-right font-bold font-mono ${
                              tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {tx.type === 'ingreso' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Download Triggers */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <span className="text-xs text-[#5A6B82]">
              Generador oficial compatible con PDF, XLSX y Google Workspace.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Descargar Excel (.xlsx)
              </button>

              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Descargar PDF Oficial
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
