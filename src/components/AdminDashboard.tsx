import React, { useEffect, useState } from 'react';
import {
  Building2,
  Euro,
  TrendingUp,
  TrendingDown,
  Wrench,
  AlertCircle,
  Plus,
  ArrowRight,
  FileDown,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  ExternalLink,
  Coins,
  Receipt,
  UserCheck,
  CreditCard,
  Edit2,
  Clock,
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowUpRight,
  Filter,
  Hourglass,
  Tag,
  AlertTriangle,
  Sparkles,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAccountingToExcel, exportBuildingsPortfolioToExcel, exportTicketsToExcel, formatCurrency } from '../utils/exportUtils';
import { collectWorkerRoster, countResolvedJobs } from '../utils/workers';
import { canDeleteFinishedTicket } from '../utils/permissions';
import { Building, Ticket } from '../types';
import { WorkerPayoutModal } from './WorkerPayoutModal';
import { AdjustRepairFundModal } from './AdjustRepairFundModal';
import { UserManagementModal } from './UserManagementModal';
import { ExpirationAlerts } from './ExpirationAlerts';
import { AddBuildingModal } from './AddBuildingModal';
import { AssignPresidentModal } from './AssignPresidentModal';

interface AdminDashboardProps {
  onOpenAddBuilding: () => void;
  onOpenCreateTicket: () => void;
  onOpenAddTransaction: () => void;
  onOpenReports: () => void;
  onOpenSoferServices?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenAddBuilding,
  onOpenCreateTicket,
  onOpenAddTransaction,
  onOpenReports,
  onOpenSoferServices,
}) => {
  const {
    currentUser,
    activeTab,
    allUsers,
    buildings,
    tickets,
    transactions,
    workerPayouts,
    updateWorkerPayoutStatus,
    setSelectedBuildingId,
    setSelectedTicketId,
    deleteBuilding,
    resetBuildingOperations,
    deleteTicket,
    deleteTransaction,
    deleteWorkerPayout,
    resetAllOperations,
    simulateBuildingAlertWave,
    setTicketPriority,
    setTicketsPriority,
    adminInboxTarget,
    setAdminInboxTarget,
  } = useApp();

  const [buildingSearch, setBuildingSearch] = useState('');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  useEffect(() => {
    if (adminInboxTarget?.type === 'users') {
      setIsUserManagementOpen(true);
    }
  }, [adminInboxTarget]);
  const [alertWaveRunning, setAlertWaveRunning] = useState(false);
  const [selectedBuildingToAdjust, setSelectedBuildingToAdjust] = useState<Building | null>(null);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);
  const [buildingToAssign, setBuildingToAssign] = useState<Building | null>(null);

  useEffect(() => {
    if (activeTab === 'buildings') {
      document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // Incidents board filters
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'assigned_to_me' | 'pendiente' | 'en_proceso' | 'resuelta'>('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('all');
  const [ticketBuildingIds, setTicketBuildingIds] = useState<string[]>([]);
  const [selectedIncidentIds, setSelectedIncidentIds] = useState<string[]>([]);
  
  React.useEffect(() => {
    if (activeTab === 'buildings') {
      document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'accounting') {
      document.getElementById('accounting-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'tickets') {
      document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'servicios') {
      document.getElementById('sofer-services-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);


  // Global Financial calculations
  const totalIngresos = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGastos = transactions
    .filter((t) => t.type === 'gasto')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balanceGlobal = totalIngresos - totalGastos;
  const totalUnitsGlobal = buildings.reduce((acc, b) => acc + b.totalUnits, 0);
  const totalRepairBoxesGlobal = buildings.reduce((acc, b) => acc + (b.repairFund || 0), 0);
  const paidPayouts = workerPayouts.filter((p) => p.status === 'pagado');
  const totalWorkerPayoutsPaid = paidPayouts.reduce((acc, p) => acc + p.amount, 0);

  const workerRoster = collectWorkerRoster(allUsers, workerPayouts, tickets);
  const isWorker = currentUser.role === 'worker';
  const myWorkerTickets = tickets.filter(
    (t) => t.assignedWorkerId === currentUser.id || t.assignedWorkerName === currentUser.name
  );
  const pendingTicketsCount = tickets.filter((t) => t.status === 'pendiente').length;
  const inProgressTicketsCount = tickets.filter((t) => t.status === 'en_proceso').length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === 'resuelta').length;
  const urgentTicketsCount = tickets.filter((t) => t.priority === 'urgente' && t.status !== 'resuelta').length;

  const filteredIncidents = tickets.filter((t) => {
    if (ticketStatusFilter === 'assigned_to_me') {
      const isMine = t.assignedWorkerId === currentUser.id || t.assignedWorkerName === currentUser.name;
      if (!isMine) return false;
    } else if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) {
      return false;
    }
    if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false;
    if (ticketBuildingIds.length > 0 && !ticketBuildingIds.includes(t.buildingId)) return false;
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      return (
        (t.title?.toLowerCase() || '').includes(q) ||
        (t.ticketNumber?.toLowerCase() || '').includes(q) ||
        (t.buildingName?.toLowerCase() || '').includes(q) ||
        (t.unitOrArea?.toLowerCase() || '').includes(q) ||
        (t.description?.toLowerCase() || '').includes(q) ||
        (t.assignedWorkerName?.toLowerCase() || '').includes(q)
      );
    }
    return true;
  });

  const filteredBuildings = buildings.filter((b) => {
    if (!buildingSearch) return true;
    const q = buildingSearch.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q) ||
      (b.presidentName || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Global Actions */}
      <div className="bg-[#F4F6FA] text-[#16202E] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#C2A05E]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A2E6D]/15 border border-[#0A2E6D]/40 text-[#0A2E6D] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A2E6D]" />
              {isWorker
                ? `Panel de Operario / Técnico • ${currentUser.name} (${currentUser.specialty || 'Mantenimiento General'})`
                : 'Panel de Control Central • Administrador de fincas'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16202E]">
              {isWorker
                ? 'Gestión de Incidencias & Tareas de Mantenimiento'
                : 'Gestión Integral de Edificios & Finanzas'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6B82] max-w-2xl leading-relaxed">
              {isWorker
                ? `Bienvenido/a ${currentUser.name}. Visualiza y atiende tus incidencias asignadas, consulta el estado de las averías en los edificios y añade los gastos de repuestos empleados.`
                : `Supervisión de ${buildings.length} inmuebles, contabilidad de ingresos/gastos, control exclusivo de pagos a operarios y auditoría de incidencias generales.`}
            </p>
          </div>
        </div>
      </div>

      <ExpirationAlerts />

      {/* Acciones Rápidas (Role-Specific Menu) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isWorker ? (
          <>
            <button
              onClick={onOpenCreateTicket}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-[#0A2E6D]/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-blue-50 text-[#0A2E6D] rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Nueva Incidencia</span>
            </button>

            <button
              onClick={() => {
                setTicketStatusFilter('assigned_to_me');
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-green-600/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Mis Incidencias</span>
            </button>

            <button
              onClick={() => {
                setTicketStatusFilter('all');
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-amber-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Ver Todas Incidencias</span>
            </button>

            <button
              onClick={onOpenReports}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-purple-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Incidencias & Balances</span>
            </button>

            <button
              onClick={() => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-teal-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Edificios registrados</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onOpenAddBuilding}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-[#0A2E6D]/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-blue-50 text-[#0A2E6D] rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Nuevo Edificio</span>
            </button>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-green-600/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Pagar a Operario</span>
            </button>

            <button
              onClick={onOpenAddTransaction}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-yellow-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:scale-110 transition-transform">
                <Euro className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Asentar Movimiento</span>
            </button>

            <button
              onClick={onOpenReports}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-purple-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Incidencias & Balances</span>
            </button>

            <button
              onClick={() => setIsUserManagementOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-blue-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Gestión de Usuarios</span>
            </button>

            <button
              onClick={() => onOpenSoferServices?.()}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-amber-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Servicios SOFER</span>
            </button>

            <button
              onClick={() => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-teal-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">Mis edificios</span>
            </button>

            <button
              type="button"
              disabled={alertWaveRunning}
              onClick={() => {
                if (alertWaveRunning) return;
                setAlertWaveRunning(true);
                simulateBuildingAlertWave(24);
                window.setTimeout(() => setAlertWaveRunning(false), 24 * 160 + 800);
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-red-500/40 rounded-2xl transition-all cursor-pointer shadow-sm group disabled:opacity-60"
            >
              <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#16202E] text-center">
                {alertWaveRunning ? 'Enviando avisos…' : 'Simular avisos'}
              </span>
            </button>
          </>
        )}
      </div>

      {currentUser.role === 'admin' && buildings.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#16202E]">Acceso rápido a edificios</h3>
              <p className="text-[11px] text-[#5A6B82]">Pulsa un inmueble para abrirlo. También puedes ir a Mis edificios más abajo.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Eliminar todos los balances generales (movimientos, cajas y cuotas) y empezar de 0? Las incidencias no se borran.')) {
                  resetAllOperations();
                }
              }}
              className="shrink-0 px-3 py-2 text-[11px] font-bold rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
            >
              Borrar balances generales
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
          {buildings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBuildingId(b.id)}
              className="shrink-0 min-w-[180px] px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0A2E6D] hover:bg-white text-left cursor-pointer"
            >
              <p className="text-xs font-bold text-[#16202E] truncate">{b.name}</p>
              <p className="text-[10px] text-[#5A6B82]">{b.totalUnits} uds · {b.floors} pisos · {b.monthlyQuotaFee} €/mes</p>
              <p className="text-[10px] font-semibold text-[#0A2E6D] mt-1">Abrir finca →</p>
            </button>
          ))}
          </div>
        </div>
      )}

      {/* Global Operations & Metrics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isWorker ? (
          <>
            {/* Worker KPI 1: Mis Incidencias Asignadas */}
            <div
              onClick={() => {
                setTicketStatusFilter('assigned_to_me');
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-[#0A2E6D] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Mis Incidencias Asignadas
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0A2E6D]">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-[#16202E]">{myWorkerTickets.length}</p>
                <p className="text-xs text-[#5A6B82] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  {myWorkerTickets.filter((t) => t.status === 'resuelta').length} resueltas •{' '}
                  {myWorkerTickets.filter((t) => t.status === 'en_proceso').length} activas
                </p>
              </div>
            </div>

            {/* Worker KPI 2: Incidencias Pendientes */}
            <div
              onClick={() => {
                setTicketStatusFilter('pendiente');
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Incidencias Pendientes
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingTicketsCount}</p>
                <p className="text-xs text-[#5A6B82] mt-1">
                  En espera de intervención técnica
                </p>
              </div>
            </div>

            {/* Worker KPI 3: Incidencias En Proceso */}
            <div
              onClick={() => {
                setTicketStatusFilter('en_proceso');
                document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  En Proceso de Reparación
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Hourglass className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{inProgressTicketsCount}</p>
                <p className="text-xs text-[#5A6B82] mt-1">
                  Trabajos en curso y repuestos añadidos
                </p>
              </div>
            </div>

            {/* Worker KPI 4: Cajas Reparación */}
            <div
              onClick={() => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-yellow-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Total Cajas de Reparación
                </span>
                <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-600">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 font-mono">
                  {formatCurrency(totalRepairBoxesGlobal)}
                </p>
                <p className="text-xs text-[#5A6B82] mt-1">
                  Fondos para materiales en {buildings.length} edificios
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Admin KPI 1: Inmuebles */}
            <div
              onClick={() => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-[#0A2E6D]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Edificios Activos
                </span>
                <div className="p-2.5 rounded-xl bg-[#F4F6FA] border border-[#E2E8F0] text-[#0A2E6D]">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-[#16202E]">{buildings.length}</p>
                <p className="text-xs text-[#5A6B82] mt-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#5A6B82]" />
                  {totalUnitsGlobal} viviendas administradas
                </p>
              </div>
            </div>

            {/* Admin KPI 2: Balance Neto */}
            <div
              onClick={() => document.getElementById('accounting-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-50 border border-blue-200 text-blue-950 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Balance Neto
                </span>
                <div className="p-2.5 rounded-xl bg-white/80 border border-blue-200 text-blue-700">
                  <Euro className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-blue-900">
                  {balanceGlobal >= 0 ? '+' : ''}
                  {formatCurrency(balanceGlobal)}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{formatCurrency(totalIngresos)}
                  </span>
                  <span className="text-red-600 font-semibold flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> -{formatCurrency(totalGastos)}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin KPI 3: Cajas Reparación */}
            <div
              onClick={() => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-yellow-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Total Cajas Reparación
                </span>
                <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-600">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 font-mono">
                  {formatCurrency(totalRepairBoxesGlobal)}
                </p>
                <p className="text-xs text-[#5A6B82] mt-1">
                  Fondos asignados en los {buildings.length} edificios para averías
                </p>
              </div>
            </div>

            {/* Admin KPI 4: Pagos a Trabajadores (Nómina Liquidada) */}
            <div
              onClick={() => document.getElementById('payroll-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between cursor-pointer hover:border-purple-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                  Nómina Liquidada
                </span>
                <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-200 text-purple-700">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-purple-700 font-mono">
                  {formatCurrency(totalWorkerPayoutsPaid)}
                </p>
                <p className="text-xs text-[#5A6B82] mt-1">
                  {paidPayouts.length} liquidaciones a operarios
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Buildings Portfolio & Repair Boxes Section */}
      <div id="buildings-section" className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0A2E6D]" />
              Edificios registrados ({buildings.length})
            </h3>
            <p className="text-xs text-[#5A6B82]">
              Entra a cada finca para editar unidades, pisos, cuota o asignar presidente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                placeholder="Buscar edificio o presidente..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] bg-[#F4F6FA] text-[#16202E] placeholder-[#666666]"
              />
              <Search className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={() => exportBuildingsPortfolioToExcel(filteredBuildings, transactions, tickets)}
              className="p-2 border border-[#E2E8F0] hover:bg-slate-50 rounded-lg text-[#5A6B82] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Exportar portafolio de edificios a Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>

        {/* Buildings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredBuildings.length === 0 && (
            <p className="col-span-full text-sm text-[#5A6B82] text-center py-8">
              {buildingSearch
                ? `Ningún edificio coincide con “${buildingSearch}”.`
                : 'Aún no hay edificios registrados. Usa Nuevo Edificio para dar de alta el primero.'}
            </p>
          )}
          {filteredBuildings.map((bldg) => {
            const bldgTickets = tickets.filter((t) => t.buildingId === bldg.id);
            const bldgActive = bldgTickets.filter((t) => t.status !== 'resuelta');
            const bldgTx = transactions.filter((t) => t.buildingId === bldg.id);
            const bldgIncome = bldgTx.filter((t) => t.type === 'ingreso').reduce((a, c) => a + c.amount, 0);
            const bldgExpense = bldgTx.filter((t) => t.type === 'gasto').reduce((a, c) => a + c.amount, 0);
            const bldgBal = bldgIncome - bldgExpense;

            return (
              <div
                key={bldg.id}
                className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Building Image Cover */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={bldg.image}
                      alt={bldg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    <span className="absolute top-3 left-3 font-mono text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200">
                      {bldg.code}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de eliminar el edificio "${bldg.name}" del sistema?`)) {
                          deleteBuilding(bldg.id);
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-red-600 hover:text-white text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Edificio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <h4 className="font-bold text-base leading-tight truncate">{bldg.name}</h4>
                      <p className="text-[11px] text-white/80 truncate mt-0.5">{bldg.address}</p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">Caja Reparación</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="font-bold text-slate-800">{formatCurrency(bldg.repairFund || 0)}</p>
                          <button
                            onClick={() => setSelectedBuildingToAdjust(bldg)}
                            className="text-blue-600 hover:underline text-[10px] cursor-pointer"
                            title="Ajustar o recargar caja"
                          >
                            Ajustar
                          </button>
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">Balance General</span>
                        <p className={`font-bold ${bldgBal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(bldgBal)}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 mb-3">
                      <p className="text-slate-500 flex items-center justify-between">
                        <span className="font-medium">Presidente:</span>
                        <span className="font-semibold text-slate-800 truncate ml-2">{bldg.presidentName}</span>
                      </p>
                      <p className="text-slate-500 flex items-center justify-between">
                        <span className="font-medium">Incidencias:</span>
                        <span className="font-semibold">
                          {bldgActive.length > 0 ? (
                            <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              {bldgActive.length} activas
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Al día</span>
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBuildingToEdit(bldg)}
                        className="py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#0A2E6D] font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setBuildingToAssign(bldg)}
                        className="py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#0A2E6D] font-semibold rounded-lg text-xs cursor-pointer"
                      >
                        Presidente
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedBuildingId(bldg.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Abrir edificio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar los balances de ${bldg.name} y empezar de 0? Las incidencias no se borran.`)) {
                          resetBuildingOperations(bldg.id);
                        }
                      }}
                      className="w-full py-1.5 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg cursor-pointer"
                    >
                      Empezar balances de 0
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentUser.role === 'admin' && (
      <>
      {/* EXCLUSIVE ADMIN SECTION: WORKER DIRECTORY & PAYOUTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Workers Directory (Left) */}
        <div className="xl:col-span-1 bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Directorio de Trabajadores
              </h3>
              <p className="text-xs text-[#5A6B82]">
                Personal de mantenimiento activo.
              </p>
            </div>
            <button
              onClick={() => setIsUserManagementOpen(true)}
              className="text-xs text-[#0A2E6D] hover:text-[#0A2E6D] font-semibold hover:underline cursor-pointer"
            >
              Gestionar
            </button>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {workerRoster.map((worker) => {
              const workerTickets = tickets.filter(
                (t) => t.assignedWorkerId === worker.id || t.assignedWorkerName === worker.name
              );
              const activeTickets = workerTickets.filter((t) => t.status !== 'resuelta');
              return (
                <div key={worker.id} className="bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3">
                  {worker.avatar ? (
                    <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full bg-[#F4F6FA] border border-[#E2E8F0] shrink-0 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 text-green-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {worker.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#16202E] truncate">{worker.name}</p>
                    <p className="text-[11px] text-[#5A6B82] flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> {worker.specialty || 'Mantenimiento general'}
                    </p>
                    {!worker.fromAccount && (
                      <p className="text-[10px] text-amber-700">Sin cuenta de acceso todavía</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-xs font-bold text-[#16202E]">{activeTickets.length}</span>
                    <span className="text-[10px] text-[#5A6B82]">Activos</span>
                  </div>
                </div>
              );
            })}
            {workerRoster.length === 0 && (
              <p className="text-xs text-[#5A6B82] text-center py-4">No hay operarios registrados. Asigna el rol de trabajador o registra una nómina.</p>
            )}
          </div>
        </div>

        {/* Worker Payouts (Right) */}
        <div id="payroll-section" className="xl:col-span-2 bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 mb-1">
                <ShieldCheck className="w-3 h-3" />
                Gestión Exclusiva de Administrador
              </div>
              <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                Finanzas & Nómina de Pagos ({workerPayouts.length})
              </h3>
              <p className="text-xs text-[#5A6B82]">
                Control y liquidación de honorarios y jornales.
              </p>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Registrar Pago a Operario
            </button>
          </div>

          {/* Worker Payouts Table */}
          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-[#FFFFFF]">
            <table className="w-full text-left text-xs text-[#16202E]">
              <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Referencia</th>
                  <th className="py-2.5 px-3">Operario</th>
                  <th className="py-2.5 px-3">Período</th>
                  <th className="py-2.5 px-3">Trabajos</th>
                  <th className="py-2.5 px-3">Método / Ref.</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {workerPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#5A6B82]">
                      No hay liquidaciones a operarios registradas.
                    </td>
                  </tr>
                ) : (
                  workerPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F4F6FA]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#0A2E6D]">{p.code}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#16202E]">{p.workerName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#5A6B82]">{p.period}</td>
                      <td className="py-2.5 px-3">
                        {p.jobsCompletedCount ?? countResolvedJobs(tickets, { id: p.workerId, name: p.workerName })} tareas
                      </td>
                      <td className="py-2.5 px-3 text-[#5A6B82] capitalize">
                        {p.paymentMethod} {p.referenceNumber && `(${p.referenceNumber})`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            p.status === 'pagado'
                              ? 'bg-green-50 text-green-600 border-green-800/50'
                              : 'bg-yellow-50 text-yellow-600 border-yellow-800/50'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-green-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              updateWorkerPayoutStatus(
                                p.id,
                                p.status === 'pagado' ? 'pendiente' : 'pagado'
                              )
                            }
                            className="text-[11px] text-[#0A2E6D] hover:underline font-semibold cursor-pointer"
                          >
                            {p.status === 'pagado' ? 'Marcar Pendiente' : 'Pagar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar la nómina ${p.code}?`)) deleteWorkerPayout(p.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar nómina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

            </>
      )}

      {/* Incidents & Maintenance Oversight Board */}
      <div id="tickets-section" className="bg-[#F4F6FA] rounded-3xl border border-[#E2E8F0] p-6 shadow-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0A2E6D] uppercase tracking-wider bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 mb-2">
              <Wrench className="w-3.5 h-3.5" />
              Módulo de Incidencias & Asistencia Técnica
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#16202E] flex items-center gap-2">
              Gestión de Incidencias & Tareas de Mantenimiento
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6B82] mt-0.5">
              El administrador puede borrar un reporte en cualquier momento cuando esté resuelto o rechazado. Los abiertos no se eliminan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => exportTicketsToExcel(filteredIncidents, 'Incidencias_Mantenimiento')}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#16202E] border border-[#CBD5E1] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Exportar Excel
            </button>

            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-2.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-white hover:text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              Nueva Incidencia
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          {/* Quick status tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setTicketStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                ticketStatusFilter === 'all'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-slate-100'
              }`}
            >
              Todas ({tickets.length})
            </button>

            {isWorker && (
              <button
                onClick={() => setTicketStatusFilter('assigned_to_me')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  ticketStatusFilter === 'assigned_to_me'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Mis Asignadas ({myWorkerTickets.length})
              </button>
            )}

            <button
              onClick={() => setTicketStatusFilter('pendiente')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketStatusFilter === 'pendiente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pendientes ({pendingTicketsCount})
            </button>

            <button
              onClick={() => setTicketStatusFilter('en_proceso')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketStatusFilter === 'en_proceso'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              En Proceso ({inProgressTicketsCount})
            </button>

            <button
              onClick={() => setTicketStatusFilter('resuelta')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketStatusFilter === 'resuelta'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resueltas ({resolvedTicketsCount})
            </button>

            <button
              onClick={() => {
                setTicketPriorityFilter(ticketPriorityFilter === 'urgente' ? 'all' : 'urgente');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                ticketPriorityFilter === 'urgente'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Urgentes ({urgentTicketsCount})
            </button>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
            <p className="text-[11px] font-semibold text-[#5A6B82]">Fincas (puedes marcar varias)</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTicketBuildingIds([])}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  ticketBuildingIds.length === 0
                    ? 'bg-[#0A2E6D] text-white'
                    : 'bg-[#F4F6FA] text-[#5A6B82] border border-[#E2E8F0]'
                }`}
              >
                Todas ({buildings.length})
              </button>
              {buildings.map((b) => {
                const active = ticketBuildingIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setTicketBuildingIds((prev) =>
                        prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#F4F6FA] text-[#16202E] border border-[#E2E8F0]'
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t border-[#E2E8F0]">
            <div className="md:col-span-9 relative">
              <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por título, código (ej: TKT-), piso, zona, edificio o técnico..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F4F6FA] border border-[#CBD5E1] rounded-xl text-xs text-[#16202E] placeholder-[#5A6B82] focus:outline-none focus:border-[#0A2E6D]"
              />
              {ticketSearch && (
                <button
                  onClick={() => setTicketSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-[#5A6B82] hover:text-[#16202E]"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="w-full py-2 px-3 bg-[#F4F6FA] border border-[#CBD5E1] rounded-xl text-xs text-[#16202E] focus:outline-none focus:border-[#0A2E6D]"
              >
                <option value="all">Cualquier Prioridad</option>
                <option value="urgente">Solo Urgentes ({urgentTicketsCount})</option>
                <option value="alta">Prioridad Alta</option>
                <option value="media">Prioridad Media</option>
                <option value="baja">Prioridad Baja</option>
              </select>
            </div>
          </div>
        </div>

        {currentUser.role === 'admin' && selectedIncidentIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
            <span className="text-xs font-bold text-red-800">{selectedIncidentIds.length} seleccionadas</span>
            <button
              type="button"
              onClick={() => {
                setTicketsPriority(selectedIncidentIds, 'urgente');
                setSelectedIncidentIds([]);
              }}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 text-white cursor-pointer"
            >
              Marcar urgentes
            </button>
            <button
              type="button"
              onClick={() => {
                setTicketsPriority(selectedIncidentIds, 'alta');
                setSelectedIncidentIds([]);
              }}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-white border border-[#E2E8F0] text-[#16202E] cursor-pointer"
            >
              Quitar urgente
            </button>
            <button
              type="button"
              onClick={() => setSelectedIncidentIds([])}
              className="text-[11px] font-semibold text-[#5A6B82] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#5A6B82] px-1">
          <span>
            Mostrando <strong>{filteredIncidents.length}</strong> de <strong>{tickets.length}</strong> incidencias
          </span>
          {(ticketSearch || ticketStatusFilter !== 'all' || ticketPriorityFilter !== 'all' || ticketBuildingIds.length > 0) && (
            <button
              onClick={() => {
                setTicketSearch('');
                setTicketStatusFilter('all');
                setTicketPriorityFilter('all');
                setTicketBuildingIds([]);
              }}
              className="text-[#0A2E6D] hover:underline font-semibold cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        {currentUser.role === 'admin' && filteredIncidents.some((t) => t.status === 'resuelta' || t.status === 'rechazada') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const done = filteredIncidents.filter((t) => t.status === 'resuelta' || t.status === 'rechazada');
                if (!done.length) return;
                if (confirm(`¿Eliminar ${done.length} reportes ya resueltos o rechazados?`)) {
                  done.forEach((t) => deleteTicket(t.id));
                }
              }}
              className="px-3 py-2 text-[11px] font-bold rounded-xl bg-red-50 border border-red-200 text-red-700 cursor-pointer"
            >
              Eliminar reportes resueltos visibles
            </button>
          </div>
        )}

        {/* Tickets Grid */}
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-[#5A6B82]">
              <Wrench className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#16202E]">No se encontraron incidencias</h4>
            <p className="text-xs text-[#5A6B82] max-w-sm mx-auto">
              No hay tickets que coincidan con los filtros seleccionados. Modifica los criterios o crea una nueva incidencia.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setTicketSearch('');
                  setTicketStatusFilter('all');
                  setTicketPriorityFilter('all');
                  setTicketBuildingIds([]);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#16202E] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Limpiar filtros
              </button>
              <button
                onClick={onOpenCreateTicket}
                className="px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-white hover:text-[#0A0A0A] rounded-xl text-xs font-bold cursor-pointer"
              >
                Crear Incidencia
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredIncidents.map((tkt) => {
              const isAssignedToMe =
                tkt.assignedWorkerId === currentUser.id || tkt.assignedWorkerName === currentUser.name;

              return (
                <div
                  key={tkt.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isAssignedToMe
                      ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                      : tkt.priority === 'urgente' && tkt.status !== 'resuelta'
                      ? 'border-red-300 ring-1 ring-red-400/20'
                      : 'border-[#E2E8F0] hover:border-[#0A2E6D]/40'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Code, Priority, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {currentUser.role === 'admin' && tkt.status !== 'resuelta' && (
                          <input
                            type="checkbox"
                            checked={selectedIncidentIds.includes(tkt.id)}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setSelectedIncidentIds((prev) =>
                                on ? [...prev, tkt.id] : prev.filter((id) => id !== tkt.id)
                              );
                            }}
                            className="rounded border-[#CBD5E1]"
                            title="Seleccionar para marcar urgente"
                          />
                        )}
                        <span className="font-mono text-[11px] font-bold text-[#0A2E6D] bg-[#0A2E6D]/10 px-2 py-0.5 rounded-lg border border-[#0A2E6D]/20">
                          {tkt.ticketNumber}
                        </span>

                        {tkt.priority === 'urgente' && tkt.status !== 'resuelta' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Urgente
                          </span>
                        ) : tkt.priority === 'alta' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                            Alta
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          tkt.status === 'resuelta'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tkt.status === 'en_proceso'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {tkt.status === 'resuelta' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Resuelta
                          </>
                        ) : tkt.status === 'en_proceso' ? (
                          <>
                            <Hourglass className="w-3 h-3" />
                            En proceso
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </>
                        )}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h4 className="font-bold text-sm text-[#16202E] leading-snug line-clamp-1">
                        {tkt.title}
                      </h4>
                      <p className="text-xs text-[#5A6B82] line-clamp-2 mt-1 min-h-[2rem]">
                        {tkt.description || 'Sin descripción adicional facilitada.'}
                      </p>
                    </div>

                    {/* Building & Unit Location */}
                    <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-[#16202E] font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#0A2E6D] shrink-0" />
                        <span className="truncate">{tkt.buildingName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5A6B82]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Piso {tkt.floor || '-'}, {tkt.unitOrArea || 'Zonas Comunes'}
                        </span>
                      </div>
                    </div>

                    {/* Meta Footer: Worker & Date */}
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                      {isAssignedToMe ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          👤 Asignada a ti
                        </span>
                      ) : tkt.assignedWorkerName ? (
                        <span className="text-[#5A6B82] flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-[#5A6B82]" />
                          <span className="truncate max-w-[120px]">{tkt.assignedWorkerName}</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          ⚠️ Sin técnico
                        </span>
                      )}

                      <span className="text-[#5A6B82] font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(tkt.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    {/* Expense Badge if Materials Used */}
                    {(tkt.materialsCost || 0) > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 text-[10px] text-yellow-800 font-medium flex items-center justify-between">
                        <span>Gasto materiales cargado a caja:</span>
                        <span className="font-bold font-mono">-{formatCurrency(tkt.materialsCost || 0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    {currentUser.role === 'admin' && tkt.status !== 'resuelta' && (
                      <button
                        type="button"
                        onClick={() =>
                          setTicketPriority(
                            tkt.id,
                            tkt.priority === 'urgente' ? 'alta' : 'urgente'
                          )
                        }
                        className={`w-full py-1.5 rounded-xl text-[11px] font-bold cursor-pointer border ${
                          tkt.priority === 'urgente'
                            ? 'bg-white border-red-200 text-red-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        {tkt.priority === 'urgente' ? 'Quitar urgente' : 'Marcar urgente'}
                      </button>
                    )}
                    <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTicketId(tkt.id)}
                      className="flex-1 py-2 px-3 bg-[#0A2E6D] hover:bg-[#D4B370] text-white hover:text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Ver y Gestionar Incidencia
                    </button>
                    {canDeleteFinishedTicket(currentUser, tkt) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar el reporte ${tkt.ticketNumber}? Solo se pueden borrar partes ya resueltos o rechazados.`)) deleteTicket(tkt.id);
                        }}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                        title="Eliminar reporte resuelto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centralized Accounting Ledger Section (Admin Only) */}
      {currentUser.role === 'admin' && (
        <div id="accounting-section" className="bg-[#F4F6FA] rounded-3xl border border-[#E2E8F0] p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-700 uppercase tracking-wider bg-green-100 px-2.5 py-1 rounded-full border border-green-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Gestión Financiera Exclusiva de Administrador
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#16202E] flex items-center gap-2">
                <Euro className="w-5 h-5 text-green-600" />
                Libro Diario Contable Global ({transactions.length})
              </h3>
              <p className="text-xs text-[#5A6B82]">
                Registro cronológico consolidado de ingresos, cuotas comunitarias y gastos operativos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => exportAccountingToExcel(transactions, 'Libro Diario Consolidado', 'Historico')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#16202E] border border-[#CBD5E1] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Exportar Excel
              </button>

              <button
                onClick={onOpenAddTransaction}
                className="px-4 py-2.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-white hover:text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Asiento
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white">
            <table className="w-full text-left text-xs text-[#16202E]">
              <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left">Código</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Edificio</th>
                  <th className="py-3 px-4 text-left">Concepto / Descripción</th>
                  <th className="py-3 px-4 text-left">Categoría</th>
                  <th className="py-3 px-4 text-left">Método</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-[#5A6B82]">
                      No hay movimientos contables registrados.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#0A2E6D]">{tx.code}</td>
                      <td className="py-2.5 px-3 font-mono text-[#5A6B82]">{tx.date}</td>
                      <td className="py-2.5 px-3 font-medium">{tx.buildingName}</td>
                      <td className="py-2.5 px-3">{tx.description}</td>
                      <td className="py-2.5 px-3 capitalize text-[#5A6B82]">{tx.category}</td>
                      <td className="py-2.5 px-3 capitalize text-[#5A6B82]">{tx.paymentMethod}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'ingreso' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el asiento ${tx.code}?`)) deleteTransaction(tx.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Eliminar asiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worker Payout Modal */}
      <WorkerPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
      />

      {/* Adjust Building Repair Fund Modal */}
      <AdjustRepairFundModal
        building={selectedBuildingToAdjust}
        isOpen={!!selectedBuildingToAdjust}
        onClose={() => setSelectedBuildingToAdjust(null)}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          if (adminInboxTarget?.type === 'users') setAdminInboxTarget(null);
        }}
      />

      <AddBuildingModal
        isOpen={Boolean(buildingToEdit)}
        building={buildingToEdit}
        onClose={() => setBuildingToEdit(null)}
      />

      <AssignPresidentModal
        isOpen={Boolean(buildingToAssign)}
        building={buildingToAssign}
        onClose={() => setBuildingToAssign(null)}
      />
    </div>
  );
};
