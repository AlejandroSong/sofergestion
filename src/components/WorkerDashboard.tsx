import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Hourglass,
  Euro,
  TrendingUp,
  FileDown,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  MapPin,
  Tag,
  Search,
  PlusCircle,
  Receipt,
  UserCheck,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Edit2,
  Calendar,
  CreditCard,
  Users,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportWorkerExpenseReportPDF,
  exportTicketsToExcel,
  formatCurrency,
} from '../utils/exportUtils';
import { currentPeriodLabel, formatIsoDateEs } from '../utils/dates';
import { Ticket, Building, User } from '../types';
import { WorkerRepairFundModal } from './WorkerRepairFundModal';
import { WorkerServiceModal } from './WorkerServiceModal';
import { ExpirationAlerts } from './ExpirationAlerts';
import { WorkerExceptionalExpensesModal } from './WorkerExceptionalExpensesModal';
import { WorkerVisitCalendar } from './WorkerVisitCalendar';
import { NeighborAccountEditModal } from './NeighborAccountEditModal';

export const WorkerDashboard: React.FC = () => {
  const {
    currentUser,
    buildings,
    tickets,
    transactions,
    updateTicketStatus,
    scheduleTicketVisit,
    setSelectedTicketId,
    allUsers,
  } = useApp();

  const [workerMainTab, setWorkerMainTab] = useState<'tickets_funds' | 'neighbor_accounts'>('tickets_funds');
  const [selectedNeighborForEdit, setSelectedNeighborForEdit] = useState<User | null>(null);
  const [neighborSearch, setNeighborSearch] = useState('');
  const [workerDebtFilter, setWorkerDebtFilter] = useState<'all' | 'debtor' | 'non_debtor'>('all');

  const [filterView, setFilterView] = useState<'assigned' | 'all' | 'in_process'>('assigned');
  const [selectedTicketForRepair, setSelectedTicketForRepair] = useState<Ticket | null>(null);
  const [selectedTicketForService, setSelectedTicketForService] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');
  const [selectedBuildingForExpenses, setSelectedBuildingForExpenses] = useState<Building | null>(null);

  // Tickets assigned to this worker
  const myAssignedTickets = tickets.filter(
    (t) => t.assignedWorkerId === currentUser.id || t.assignedWorkerName === currentUser.name
  );

  const displayTickets = (
    filterView === 'assigned'
      ? myAssignedTickets
      : filterView === 'in_process'
      ? tickets.filter((t) => t.status === 'en_proceso')
      : tickets
  ).filter((t) => {
    if (selectedBuildingFilter !== 'all' && t.buildingId !== selectedBuildingFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (t.title?.toLowerCase() || '').includes(q) ||
      (t.ticketNumber?.toLowerCase() || '').includes(q) ||
      (t.buildingName?.toLowerCase() || '').includes(q) ||
      (t.unitOrArea?.toLowerCase() || '').includes(q)
    );
  });

  // Calculate worker stats
  const completedJobs = myAssignedTickets.filter((t) => t.status === 'resuelta');
  const inProgressJobs = myAssignedTickets.filter((t) => t.status === 'en_proceso');
  const totalLaborEarned = myAssignedTickets.reduce((acc, t) => acc + (t.serviceCost || 0), 0);
  const totalMaterialsUsed = myAssignedTickets.reduce((acc, t) => acc + (t.materialsCost || 0), 0);
  const grandTotal = totalLaborEarned + totalMaterialsUsed;

  // Total repair funds across all buildings visible to worker
  const totalAvailableFundsAllBuildings = buildings.reduce((acc, b) => acc + (b.repairFund || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner for Worker */}
      <div className="bg-[#F4F6FA] text-[#16202E] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-950/40 border border-green-800/50 text-green-600 text-xs font-semibold">
              <Wrench className="w-3.5 h-3.5 text-green-600" />
              Trabajador / Operario de Mantenimiento • {currentUser.specialty || 'Servicios Generales'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16202E]">
              Gestión de Incidencias & Cajas de Reparación
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6B82] max-w-xl leading-relaxed">
              Hola {currentUser.name}. Tienes acceso para visualizar las <strong>cajas de dinero de todos los edificios</strong>.
              Durante el proceso de reparación puedes añadir gastos de repuestos y materiales hasta finalizar el trabajo y marcar la incidencia como resuelta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() =>
                exportWorkerExpenseReportPDF(
                  currentUser,
                  myAssignedTickets,
                  transactions,
                  currentPeriodLabel()
                )
              }
              className="px-4 py-3 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <FileDown className="w-4 h-4" />
              Informe de Gastos Mensual (PDF)
            </button>

            <button
              onClick={() => exportTicketsToExcel(myAssignedTickets, `Trabajos_${currentUser.name}`)}
              className="px-3.5 py-3 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Worker: Incidencias vs Cuentas de Vecinos */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setWorkerMainTab('tickets_funds')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            workerMainTab === 'tickets_funds'
              ? 'bg-[#0A2E6D] text-white shadow-md'
              : 'bg-white text-[#5A6B82] border border-[#CBD5E1] hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Incidencias & Cajas de Reparación ({myAssignedTickets.length})</span>
        </button>
      </div>

      {false && workerMainTab === 'neighbor_accounts' ? (
        /* Worker Neighbor Accounts Management View */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#16202E] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0A2E6D]" />
                  Gestión de Cuentas de Vecinos por Trabajador
                </h3>
                <p className="text-xs text-[#5A6B82] mt-0.5">
                  Como trabajador autorizado, puedes consultar y editar el saldo, registrar pagos anteriores, fechas de cuota y periodicidad (mensual o anual).
                </p>
              </div>

              {/* Neighbor Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por vecino, edificio o piso..."
                  value={neighborSearch}
                  onChange={(e) => setNeighborSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F4F6FA] border border-[#CBD5E1] rounded-xl text-xs text-[#16202E] outline-none"
                />
              </div>
            </div>

            {/* Quick Metrics with Click to Filter */}
            {(() => {
              const neighborsList = allUsers.filter(u => u.role === 'neighbor');
              const withDebt = neighborsList.filter(u => (u.feeBalance ?? 0) < 0).length;
              const upToDate = neighborsList.length - withDebt;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setWorkerDebtFilter('all')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      workerDebtFilter === 'all'
                        ? 'bg-blue-50/80 border-[#0A2E6D] shadow-xs ring-2 ring-[#0A2E6D]/20'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#5A6B82] font-semibold uppercase flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#0A2E6D]" />
                        Total Vecinos
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#CBD5E1] text-[#0A2E6D]">
                        {neighborsList.length}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#16202E] mt-1">{neighborsList.length}</p>
                    <p className="text-[10px] text-[#5A6B82] mt-0.5">Todos los vecinos registrados</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkerDebtFilter('non_debtor')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      workerDebtFilter === 'non_debtor'
                        ? 'bg-green-50/90 border-green-600 shadow-xs ring-2 ring-green-500/30'
                        : 'bg-green-50/50 border-green-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-green-800 font-semibold uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Al Día / No Deudores
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-800">
                        {upToDate}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mt-1">{upToDate}</p>
                    <p className="text-[10px] text-green-700 font-medium mt-0.5">Sin saldos pendientes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkerDebtFilter('debtor')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      workerDebtFilter === 'debtor'
                        ? 'bg-red-50/90 border-red-500 shadow-xs ring-2 ring-red-400/30'
                        : 'bg-red-50/50 border-red-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-red-800 font-semibold uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Deudores (Saldo Pendiente)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-800">
                        {withDebt}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 mt-1">{withDebt}</p>
                    <p className="text-[10px] text-red-700 font-medium mt-0.5">Con saldo negativo por pagar</p>
                  </button>
                </div>
              );
            })()}

            {/* Filter Tabs & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-2 rounded-2xl border border-[#E2E8F0] mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#5A6B82] flex items-center gap-1 pl-2 pr-1">
                  <Filter className="w-3.5 h-3.5 text-[#0A2E6D]" />
                  Filtro:
                </span>
                <button
                  type="button"
                  onClick={() => setWorkerDebtFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    workerDebtFilter === 'all'
                      ? 'bg-[#0A2E6D] text-white shadow-xs'
                      : 'bg-white text-[#5A6B82] hover:text-[#16202E] border border-[#CBD5E1]'
                  }`}
                >
                  Todos ({allUsers.filter(u => u.role === 'neighbor').length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerDebtFilter('debtor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    workerDebtFilter === 'debtor'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Deudores ({allUsers.filter(u => u.role === 'neighbor' && (u.feeBalance ?? 0) < 0).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerDebtFilter('non_debtor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    workerDebtFilter === 'non_debtor'
                      ? 'bg-green-700 text-white shadow-xs'
                      : 'bg-white text-green-700 hover:bg-green-50 border border-green-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No Deudores / Al Día ({allUsers.filter(u => u.role === 'neighbor' && (u.feeBalance ?? 0) >= 0).length})</span>
                </button>
              </div>

              {(() => {
                const neighborsList = allUsers.filter(u => u.role === 'neighbor');
                const filteredCount = neighborsList.filter(n => {
                  const b = n.feeBalance ?? 0;
                  if (workerDebtFilter === 'debtor' && b >= 0) return false;
                  if (workerDebtFilter === 'non_debtor' && b < 0) return false;
                  if (!neighborSearch) return true;
                  const q = neighborSearch.toLowerCase();
                  return (
                    n.name.toLowerCase().includes(q) ||
                    (n.buildingName?.toLowerCase() || '').includes(q) ||
                    (n.unitOrArea?.toLowerCase() || '').includes(q) ||
                    n.email.toLowerCase().includes(q)
                  );
                }).length;
                return (
                  <span className="text-xs text-[#5A6B82] pr-2">
                    Mostrando <strong>{filteredCount}</strong> de {neighborsList.length} vecinos
                  </span>
                );
              })()}
            </div>

            {/* Neighbor List */}
            <div className="space-y-3">
              {(() => {
                const neighborsList = allUsers.filter(u => u.role === 'neighbor');
                const filtered = neighborsList.filter(n => {
                  const b = n.feeBalance ?? 0;
                  if (workerDebtFilter === 'debtor' && b >= 0) return false;
                  if (workerDebtFilter === 'non_debtor' && b < 0) return false;

                  if (!neighborSearch) return true;
                  const q = neighborSearch.toLowerCase();
                  return (
                    n.name.toLowerCase().includes(q) ||
                    (n.buildingName?.toLowerCase() || '').includes(q) ||
                    (n.unitOrArea?.toLowerCase() || '').includes(q) ||
                    n.email.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 border border-dashed border-[#CBD5E1] rounded-2xl text-[#5A6B82] bg-[#F8FAFC]">
                      <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-80" />
                      <p className="font-semibold text-sm text-[#16202E]">
                        {workerDebtFilter === 'debtor'
                          ? 'No se encontraron vecinos deudores con los criterios de búsqueda.'
                          : workerDebtFilter === 'non_debtor'
                          ? 'No se encontraron vecinos al día con los criterios de búsqueda.'
                          : 'No se encontraron vecinos coincidentes.'}
                      </p>
                      {workerDebtFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setWorkerDebtFilter('all')}
                          className="mt-3 px-3 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#082456] transition-colors"
                        >
                          Ver todos los vecinos
                        </button>
                      )}
                    </div>
                  );
                }

                return filtered.map(neighbor => {
                  const balance = neighbor.feeBalance ?? 0;
                  const quota = neighbor.monthlyFee ?? 85;
                  const frequency = neighbor.feeFrequency ?? 'mensual';
                  const lastPay = neighbor.lastPaymentAmount ?? quota;
                  const lastDate = formatIsoDateEs(neighbor.lastPaymentDate);
                  const nextDue = formatIsoDateEs(neighbor.nextDueDate);
                  const isDebtor = balance < 0;

                  return (
                    <div 
                      key={neighbor.id}
                      className={`border bg-white p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all shadow-xs ${
                        isDebtor 
                          ? 'border-red-300 hover:border-red-500 bg-red-50/10' 
                          : 'border-[#CBD5E1] hover:border-[#0A2E6D]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={neighbor.avatar} 
                            alt={neighbor.name} 
                            className={`w-12 h-12 rounded-full object-cover border-2 shrink-0 ${
                              isDebtor ? 'border-red-400' : 'border-[#E2E8F0]'
                            }`} 
                            referrerPolicy="no-referrer"
                          />
                          {isDebtor && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold" title="Deudor">
                              !
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-[#16202E] truncate">{neighbor.name}</p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isDebtor
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}>
                              {isDebtor ? '⚠️ Deudor' : '✅ No Deudor / Al Día'}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0A2E6D] border border-blue-200">
                              {frequency === 'anual' ? '📅 Cuota Anual' : '🗓️ Cuota Mensual'}
                            </span>
                          </div>
                          <p className="text-xs text-[#5A6B82] flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-[#0A2E6D]" />
                            <span className="font-medium text-[#16202E]">{neighbor.buildingName || 'Comunidad'}</span>
                            <span>•</span>
                            <span>{neighbor.unitOrArea || 'Sin Vivienda Asignada'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E2E8F0]">
                        {/* Saldo Actual */}
                        <div className={`p-2.5 rounded-xl border ${
                          isDebtor ? 'bg-red-50/80 border-red-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                        }`}>
                          <p className={`text-[10px] font-semibold uppercase ${isDebtor ? 'text-red-800' : 'text-[#5A6B82]'}`}>
                            Saldo Actual
                          </p>
                          <p className={`text-base font-bold ${balance < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {formatCurrency(balance)}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                            balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {balance >= 0 ? 'Al día' : 'Deudor'}
                          </span>
                        </div>

                        {/* Cuota Configurada */}
                        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                          <p className="text-[10px] text-[#5A6B82] font-semibold uppercase">
                            Cuota ({frequency})
                          </p>
                          <p className="text-base font-bold text-[#0A2E6D]">
                            {formatCurrency(quota)}
                          </p>
                          <p className="text-[10px] text-[#5A6B82]">
                            {frequency === 'anual' ? 'Por año' : 'Por mes'}
                          </p>
                        </div>

                        {/* Último Pago */}
                        <div className="bg-green-50/70 p-2.5 rounded-xl border border-green-200">
                          <p className="text-[10px] text-green-800 font-semibold uppercase">Último Pago</p>
                          <p className="text-base font-bold text-green-700">
                            {formatCurrency(lastPay)}
                          </p>
                          <p className="text-[10px] text-green-800 font-medium truncate">
                            {lastDate}
                          </p>
                        </div>

                        {/* Próxima Cuota / Vencimiento */}
                        <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
                          <p className="text-[10px] text-[#0A2E6D] font-semibold uppercase">Próx. Cuota</p>
                          <p className="text-xs font-bold text-[#0A2E6D] mt-1">
                            {nextDue}
                          </p>
                          <p className="text-[10px] text-blue-700">Liquidación</p>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button 
                        onClick={() => setSelectedNeighborForEdit(neighbor)}
                        className="px-3.5 py-2 bg-[#0A2E6D] hover:bg-[#082456] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                        title="Editar cuentas, saldo, último pago y régimen de cuota del vecino"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Editar Cuenta</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ExpirationAlerts />

      {/* Worker Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
            <span>Mis Tareas Asignadas</span>
            <Wrench className="w-4 h-4 text-[#5A6B82]" />
          </div>
          <p className="text-2xl font-bold text-[#16202E] mt-2">{myAssignedTickets.length}</p>
          <span className="text-[11px] text-[#5A6B82] mt-1 block">
            {inProgressJobs.length} en progreso • {completedJobs.length} resueltas
          </span>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
            <span>Mano de Obra Acumulada</span>
            <Euro className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2 font-mono">
            {formatCurrency(totalLaborEarned)}
          </p>
          <span className="text-[11px] text-[#5A6B82] mt-1 block">Honorarios trabajadors devengados</span>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
            <span>Refacciones & Materiales</span>
            <Receipt className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-2 font-mono">
            {formatCurrency(totalMaterialsUsed)}
          </p>
          <span className="text-[11px] text-[#5A6B82] mt-1 block">Cargados a cajas de edificios</span>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
            <span>Total Facturado</span>
            <TrendingUp className="w-4 h-4 text-[#0A2E6D]" />
          </div>
          <p className="text-2xl font-bold text-[#0A2E6D] mt-2 font-mono">
            {formatCurrency(grandTotal)}
          </p>
          <span className="text-[11px] text-[#5A6B82] mt-1 block">Total liquidado en incidencias</span>
        </div>
      </div>

      <WorkerVisitCalendar tickets={myAssignedTickets} onOpenTicket={setSelectedTicketId} />

      {/* Main Jobs & Maintenance Requests List */}
      <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#16202E]">
              Solicitudes de Mantenimiento & Reparación ({displayTickets.length})
            </h3>
            <p className="text-xs text-[#5A6B82]">
              Inicia la reparación, añade los gastos a la caja del edificio en tiempo real y marca la incidencia como resuelta.
            </p>
          </div>

          {/* Filter Views */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar incidencia..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] bg-[#F4F6FA] text-[#16202E] placeholder-[#666666]"
              />
              <Search className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center bg-[#FFFFFF] p-1 rounded-xl text-xs font-semibold border border-[#E2E8F0]">
              <button
                onClick={() => setFilterView('assigned')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterView === 'assigned'
                    ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                    : 'text-[#5A6B82] hover:text-[#16202E]'
                }`}
              >
                Mis Asignadas ({myAssignedTickets.length})
              </button>
              <button
                onClick={() => setFilterView('in_process')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterView === 'in_process'
                    ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                    : 'text-[#5A6B82] hover:text-[#16202E]'
                }`}
              >
                En Progreso ({tickets.filter((t) => t.status === 'en_proceso').length})
              </button>
              <button
                onClick={() => setFilterView('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterView === 'all'
                    ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                    : 'text-[#5A6B82] hover:text-[#16202E]'
                }`}
              >
                Todas ({tickets.length})
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {displayTickets.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-[#5A6B82] bg-[#FFFFFF] rounded-2xl border border-dashed border-[#E2E8F0]">
              <Wrench className="w-10 h-10 mx-auto text-[#444444] mb-2 stroke-1" />
              <p className="text-sm font-medium text-[#D1D5DB]">No hay tareas en este filtro</p>
              <p className="text-xs mt-1 text-[#5A6B82]">Selecciona "Todas" para explorar solicitudes de otros edificios.</p>
            </div>
          ) : (
            displayTickets.map((tkt) => {
              const bldg = buildings.find((b) => b.id === tkt.buildingId);
              const repairExpensesCount = (tkt.repairExpenses || []).length;
              const isResolved = tkt.status === 'resuelta';
              const isInProcess = tkt.status === 'en_proceso';

              return (
                <div
                  key={tkt.id}
                  className="p-4 rounded-xl border border-[#282828] hover:border-[#0A2E6D]/50 transition-all bg-[#171717] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#0A2E6D] bg-[#0A2E6D]/15 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                          {tkt.ticketNumber || 'TKT-PENDIENTE'}
                        </span>
                        <span className="text-[11px] font-mono text-green-600 bg-green-950/30 px-2 py-0.5 rounded border border-green-800/30">
                          Caja: {formatCurrency(bldg?.repairFund || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            isResolved
                              ? 'bg-green-50 text-green-600 border-green-800/50'
                              : isInProcess
                              ? 'bg-yellow-50 text-yellow-600 border-yellow-800/50'
                              : 'bg-[#E8EFF9] text-[#5A6B82] border border-[#E2E8F0]'
                          }`}
                        >
                          {(tkt.status || 'pendiente').replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            tkt.priority === 'urgente'
                              ? 'bg-red-950/60 text-red-600 border-red-800/60'
                              : 'bg-[#E8EFF9] text-[#5A6B82] border border-[#E2E8F0]'
                          }`}
                        >
                          {tkt.priority || 'baja'}
                        </span>
                      </div>
                    </div>

                    <h4
                      onClick={() => setSelectedTicketId(tkt.id)}
                      className="font-bold text-[#16202E] text-sm leading-snug cursor-pointer hover:text-[#0A2E6D] transition-colors"
                    >
                      {tkt.title || 'Incidencia de Mantenimiento'}
                    </h4>
                    <p className="text-xs text-[#5A6B82] mt-1 line-clamp-2">{tkt.description || 'Sin descripción.'}</p>

                    <div className="mt-3 p-2.5 bg-[#FFFFFF] rounded-lg border border-[#E2E8F0] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#5A6B82]">
                        <span className="flex items-center gap-1 font-semibold text-[#16202E]">
                          <Building2 className="w-3.5 h-3.5 text-[#5A6B82]" />
                          {tkt.buildingName || 'Edificio no asignado'}
                        </span>
                        <span className="text-[#5A6B82]">Piso {tkt.floor || '-'} • {tkt.unitOrArea || 'General'}</span>
                      </div>
                      {tkt.scheduledVisitDate && (
                        <p className="text-[11px] font-semibold text-[#0A2E6D] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          El {formatIsoDateEs(tkt.scheduledVisitDate)} ir a {tkt.buildingName} a hacer este trabajo
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-[#5A6B82] pt-0.5">
                        <span>Reportó: {tkt.createdBy?.name || 'Sistema'}</span>
                        {repairExpensesCount > 0 && (
                          <span className="text-yellow-600 font-semibold font-mono">
                            {repairExpensesCount} gastos aplicados a caja (-{formatCurrency(tkt.materialsCost || 0)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Worker Action Bar */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-2">
                    {/* Status quick switcher */}
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1 flex-wrap">
                        <input
                          type="date"
                          value={tkt.scheduledVisitDate || ''}
                          onChange={(e) => scheduleTicketVisit(tkt.id, e.target.value)}
                          className="px-2 py-1 rounded-lg text-[11px] border border-[#E2E8F0] bg-white text-[#16202E]"
                          title="Día de la visita"
                        />
                        <button
                          onClick={() =>
                            updateTicketStatus(
                              tkt.id,
                              'en_proceso',
                              'Trabajador inició la revisión y reparación en sitio',
                              undefined,
                              tkt.scheduledVisitDate
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            isInProcess
                              ? 'bg-yellow-600 text-[#16202E] font-bold'
                              : 'bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] border border-[#E2E8F0]'
                          }`}
                        >
                          En Progreso
                        </button>
                        <button
                          onClick={() =>
                            updateTicketStatus(tkt.id, 'resuelta', 'Incidencia resuelta por el operario')
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                            isResolved
                              ? 'bg-green-600 text-[#16202E] font-bold'
                              : 'bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] border border-[#E2E8F0]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Resuelto
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedTicketId(tkt.id)}
                        className="text-xs font-semibold text-[#0A2E6D] hover:text-[#D4B370] cursor-pointer"
                      >
                        Ver Historial
                      </button>
                    </div>

                    {/* MAIN BUTTON: Modify Repair Box & Add Expenses */}
                    <button
                      onClick={() => {
                        // Ensure ticket is in process when adding expenses
                        if (tkt.status === 'pendiente') {
                          updateTicketStatus(tkt.id, 'en_proceso', 'Trabajador inició reparación');
                        }
                        setSelectedTicketForRepair(tkt);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        isResolved
                          ? 'bg-[#1C1C1C] hover:bg-[#E8EFF9] text-[#5A6B82] border border-[#303030]'
                          : 'bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] hover:scale-[1.01]'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                      {isResolved
                        ? `Incidencia Resuelto (Ver o Agregar Más Gastos a Caja)`
                        : `Modificar Caja & Añadir Gasto de Reparación`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* ALL BUILDINGS REPAIR MONEY BOXES (Crucial feature requested) */}
      <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#0A2E6D]" />
              Incidencias Generales (Todos los {buildings.length} Edificios)
            </h3>
            <p className="text-xs text-[#5A6B82]">
              Fondos de reserva disponibles en cada inmueble para cubrir repuestos, materiales y reparaciones de incidencias.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#5A6B82]">Fondo Total Global en Cajas:</span>
            <p className="text-lg font-bold font-mono text-green-600">
              {formatCurrency(totalAvailableFundsAllBuildings)}
            </p>
          </div>
        </div>

        {/* Buildings Money Boxes Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-1">
          {buildings.map((bldg) => {
            const bldgActiveTickets = tickets.filter(
              (t) => t.buildingId === bldg.id && (t.status === 'en_proceso' || t.status === 'pendiente')
            );
            const percentageLeft = bldg.initialRepairFund > 0
              ? Math.round((bldg.repairFund / bldg.initialRepairFund) * 100)
              : 100;

            return (
              <div
                key={bldg.id}
                onClick={() => setSelectedBuildingFilter(selectedBuildingFilter === bldg.id ? 'all' : bldg.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedBuildingFilter === bldg.id
                    ? 'bg-[#F4F6FA] border-[#0A2E6D] shadow-md ring-1 ring-[#C2A05E]/40'
                    : 'bg-[#171717] border-[#282828] hover:border-[#E2E8F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-[10px] text-[#0A2E6D] bg-[#0A2E6D]/10 px-1.5 py-0.5 rounded border border-[#0A2E6D]/20">
                      {bldg.code}
                    </span>
                    <span className="text-[10px] text-green-600 bg-green-950/40 px-1.5 py-0.5 rounded font-semibold">
                      {percentageLeft}% fondo
                    </span>
                  </div>

                  <h4 className="font-bold text-[#16202E] text-xs line-clamp-1">
                    {bldg.name}
                  </h4>
                  <p className="text-[11px] text-[#5A6B82] mt-0.5 truncate">
                    Presidente: {bldg.presidentName}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-[#5A6B82]">Caja Disponible:</span>
                    <span className="font-mono font-bold text-sm text-green-600">
                      {formatCurrency(bldg.repairFund || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-[#E8EFF9] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, percentageLeft))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#5A6B82] pt-0.5">
                    <span>{bldgActiveTickets.length} incidencias activos</span>
                    <span className="text-[#5A6B82]">Base: {formatCurrency(bldg.initialRepairFund)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedBuildingFilter !== 'all' && (
          <div className="flex items-center justify-between text-xs bg-[#1C1C1C] p-2.5 rounded-xl border border-[#E2E8F0]">
            <span className="text-[#16202E]">
              Filtrando incidencias para: <strong>{buildings.find((b) => b.id === selectedBuildingFilter)?.name}</strong>
            </span>
            <button
              onClick={() => setSelectedBuildingFilter('all')}
              className="text-[#0A2E6D] hover:underline font-semibold cursor-pointer"
            >
              Ver todos los edificios
            </button>
          </div>
        )}
      </div>

      
</>
      )}

      {/* Neighbor Account Edit Modal for Workers */}
      {selectedNeighborForEdit && (
        <NeighborAccountEditModal
          isOpen={!!selectedNeighborForEdit}
          onClose={() => setSelectedNeighborForEdit(null)}
          neighbor={selectedNeighborForEdit}
        />
      )}

      {/* Worker Repair Fund Modification Modal */}
      {selectedTicketForRepair && (
        <WorkerRepairFundModal
          ticket={selectedTicketForRepair}
          isOpen={!!selectedTicketForRepair}
          onClose={() => setSelectedTicketForRepair(null)}
        />
      )}

      {/* Service Settlement Modal */}
      {selectedTicketForService && (
        <WorkerServiceModal
          ticket={selectedTicketForService}
          isOpen={!!selectedTicketForService}
          onClose={() => setSelectedTicketForService(null)}
        />
      )}

      {/* Exceptional Expenses Modal */}
      <WorkerExceptionalExpensesModal
        building={selectedBuildingForExpenses}
        isOpen={!!selectedBuildingForExpenses}
        onClose={() => setSelectedBuildingForExpenses(null)}
      />
    </div>
  );
};
