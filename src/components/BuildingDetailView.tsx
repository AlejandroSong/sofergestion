import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Euro,
  TrendingUp,
  TrendingDown,
  FileDown,
  FileSpreadsheet,
  Plus,
  Wrench,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  PhoneCall,
  Search,
  Filter,
  Coins,
  Receipt,
  Layers,
  Flame,
    FileText,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  exportBuildingFinancialStatementPDF,
  exportAccountingToExcel,
  exportTicketsToExcel,
  formatCurrency,
} from '../utils/exportUtils';
import { TicketStatus } from '../types';
import { currentPeriodLabel } from '../utils/dates';
import { AdjustRepairFundModal } from './AdjustRepairFundModal';
import { CommonAreasManager } from './CommonAreasManager';
import { FloorUtilityBillsManager } from './FloorUtilityBillsManager';
import { InsuranceManager } from './InsuranceManager';
import { ExceptionalExpensesManager } from './ExceptionalExpensesManager';
import { AddBuildingModal } from './AddBuildingModal';
import { AssignPresidentModal } from './AssignPresidentModal';
import { canViewBuildingAccounting } from '../utils/permissions';

interface BuildingDetailViewProps {
  buildingId: string;
  onBack: () => void;
  onOpenCreateTicket: () => void;
  onOpenAddTransaction: () => void;
}

export const BuildingDetailView: React.FC<BuildingDetailViewProps> = ({
  buildingId,
  onBack,
  onOpenCreateTicket,
  onOpenAddTransaction,
}) => {
  const {
    getBuildingById,
    tickets,
    transactions,
    currentUser,
    setSelectedTicketId,
    resetBuildingOperations,
    deleteTicket,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'accounting' | 'tickets' | 'common_areas' | 'floor_utilities' | 'insurance' | 'exceptional_expenses'>('accounting');
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'gasto'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const building = getBuildingById(buildingId);
  if (!building) return null;
  const showAccounting = canViewBuildingAccounting(currentUser, building.id);

  const buildingTickets = tickets.filter((t) => t.buildingId === buildingId);
  const buildingTransactions = transactions.filter((t) => t.buildingId === buildingId);

  // Financial math
  const totalIngresos = buildingTransactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGastos = buildingTransactions
    .filter((t) => t.type === 'gasto')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIngresos - totalGastos;
  const potentialMonthlyIncome = building.totalUnits * building.monthlyQuotaFee;

  // Filtered transactions
  const filteredTransactions = buildingTransactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.code.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered tickets
  const filteredTickets = buildingTickets.filter((t) => {
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.unitOrArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Return button & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#E8EFF9] rounded-xl text-[#5A6B82] hover:text-[#16202E] transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#16202E]">{building.name}</h2>
              <span className="font-mono text-xs font-bold text-[#0A2E6D] bg-[#0A2E6D]/15 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                {building.code}
              </span>
            </div>
            <p className="text-xs text-[#5A6B82] flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#5A6B82]" />
              {building.address}, {building.city}
            </p>
          </div>
        </div>

        {/* Action / Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {showAccounting && (
            <>
            <button
              onClick={() =>
                exportBuildingFinancialStatementPDF(
                  building,
                  buildingTransactions,
                  buildingTickets,
                  currentPeriodLabel()
                )
              }
            className="px-3 py-2 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-[#0A2E6D]" />
            PDF Estado de Cuenta
          </button>

          <button
            onClick={() =>
              exportAccountingToExcel(buildingTransactions, building.name, currentPeriodLabel())
            }
            className="px-3 py-2 bg-green-950/40 hover:bg-green-900/40 text-green-600 border border-green-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            Excel Contable
          </button>
            </>
          )}

          {(currentUser.role === 'president' || currentUser.role === 'admin') && (
            <button
              onClick={onOpenCreateTicket}
              className="px-3 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Comunicar Incidencia
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenAddTransaction}
              className="px-3 py-2 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#16202E] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E2E8F0]"
            >
              <Euro className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Asentar Movimiento
            </button>
          )}
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar finca
              </button>
              <button
                onClick={() => {
                  if (confirm('Esto pondrá a cero balances, cuotas de vecinos e incidencias de este edificio. ¿Continuar?')) {
                    resetBuildingOperations(building.id);
                  }
                }}
                className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Empezar de 0
              </button>
            </>
          )}
        </div>
      </div>

      {/* Building Header Banner & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual & Core Data */}
        <div className="lg:col-span-2 bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-5 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <img
              src={building.image}
              alt={building.name}
              className="w-full sm:w-48 h-36 object-cover rounded-xl border border-[#E2E8F0] shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Viviendas</span>
                  <span className="text-sm font-bold text-[#16202E]">{building.totalUnits} Unidades</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0]">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Niveles / Pisos</span>
                  <span className="text-sm font-bold text-[#16202E]">{building.floors} Pisos</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#5A6B82] block">Cuota Mensual</span>
                  <span className="text-sm font-bold text-[#0A2E6D]">
                    {formatCurrency(building.monthlyQuotaFee, building.currency)} /mes
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-1 text-[#5A6B82]">
                <p className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#5A6B82]" />
                  <strong className="text-[#D1D5DB]">Cuenta Recaudadora:</strong> {building.bankAccount}
                </p>
                <p className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                  <strong className="text-[#D1D5DB]">Emergencias 24/7:</strong> {building.emergencyContact}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* President Contact Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#16202E] rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#0A2E6D] bg-[#0A2E6D]/15 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                Presidente
              </span>
              {currentUser.role === 'admin' && (
                <button type="button" onClick={() => setIsAssignOpen(true)} className="text-[11px] font-bold text-[#0A2E6D] hover:underline cursor-pointer">
                  Asignar
                </button>
              )}
            </div>

            <h3 className="text-lg font-bold text-[#16202E]">{building.presidentName}</h3>
            <p className="text-xs text-[#5A6B82] mt-0.5">
              {building.presidentUnitOrArea || 'Vivienda pendiente de registrar'}
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <a
                href={`tel:${building.presidentPhone}`}
                className="flex items-center gap-2 text-[#5A6B82] hover:text-[#0A2E6D] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#0A2E6D]" />
                {building.presidentPhone}
              </a>
              <a
                href={`mailto:${building.presidentEmail}`}
                className="flex items-center gap-2 text-[#5A6B82] hover:text-[#0A2E6D] transition-colors truncate"
              >
                <Mail className="w-3.5 h-3.5 text-[#0A2E6D] shrink-0" />
                <span className="truncate">{building.presidentEmail}</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5A6B82]">
            <span>Incidencias Reportadas:</span>
            <span className="font-bold text-[#16202E] bg-[#E8EFF9] px-2 py-0.5 rounded border border-[#E2E8F0]">
              {buildingTickets.length}
            </span>
          </div>
        </div>
      </div>

      {showAccounting && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos */}
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
              Ingresos Totales (Agosto)
            </span>
            <div className="p-2 rounded-xl bg-green-950/40 text-green-600 border border-green-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2 font-mono">
            {formatCurrency(totalIngresos, building.currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5A6B82]">
            <span>Meta mensual esperada:</span>
            <span className="font-semibold text-[#D1D5DB]">
              {formatCurrency(potentialMonthlyIncome, building.currency)}
            </span>
          </div>
        </div>

        {/* KPI 2: Gastos */}
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
              Gastos Mantenimiento & Servicios
            </span>
            <div className="p-2 rounded-xl bg-red-950/40 text-red-600 border border-red-800/40">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2 font-mono">
            {formatCurrency(totalGastos, building.currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#5A6B82]">
            <span>Operaciones de mantenimiento:</span>
            <span className="font-semibold text-[#D1D5DB]">
              {buildingTransactions.filter((t) => t.type === 'gasto').length} egresos
            </span>
          </div>
        </div>

        {/* KPI 3: Balance */}
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
              Estado de Cuenta / Balance
            </span>
            <div
              className={`p-2 rounded-xl border ${
                balance >= 0
                  ? 'bg-[#0A2E6D]/15 text-[#0A2E6D] border-[#0A2E6D]/30'
                  : 'bg-red-950/40 text-red-600 border-red-800/40'
              }`}
            >
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold mt-2 font-mono ${
              balance >= 0 ? 'text-[#0A2E6D]' : 'text-red-600'
            }`}
          >
            {formatCurrency(balance, building.currency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#5A6B82]">Salud Financiera:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded border ${
                balance >= 0
                  ? 'text-green-600 bg-green-950/40 border-green-800/50'
                  : 'text-red-600 bg-red-950/40 border-red-800/50'
              }`}
            >
              {balance >= 0 ? 'Superávit Operativo' : 'Déficit'}
            </span>
          </div>
        </div>

        {/* KPI 4: Caja Total de Reparaciones */}
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                Caja Reparaciones
              </span>
              <div className="p-2 rounded-xl bg-yellow-950/40 text-yellow-600 border border-yellow-200">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-2 font-mono">
              {formatCurrency(building.repairFund || 0, building.currency)}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#5A6B82] text-[11px]">
              Fondo base: {formatCurrency(building.initialRepairFund || 0, building.currency)}
            </span>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setIsAdjustModalOpen(true)}
                className="text-xs font-bold text-[#0A2E6D] hover:underline cursor-pointer"
              >
                Ajustar
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tabs Switcher: Accounting vs Tickets vs Common Areas vs Floor Utilities */}
      <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-md">
        <div className="border-b border-[#E2E8F0] px-4 py-3 bg-[#FFFFFF] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {showAccounting && (
            <button
              onClick={() => setActiveTab('accounting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'accounting'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <Euro className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Contabilidad & Libro Diario ({buildingTransactions.length})
            </button>
            )}
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tickets'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Incidencias & Mantenimiento ({buildingTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('common_areas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'common_areas'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Áreas Comunes ({building.commonAreas?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('floor_utilities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'floor_utilities'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Contratos ({building.floorUtilityBills?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'insurance'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Seguro del Edificio
            </button>
            <button
              onClick={() => setActiveTab('exceptional_expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exceptional_expenses'
                  ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              Gastos Excepcionales ({building.exceptionalExpenses?.length || 0})
            </button>
          </div>

          {/* Search bar (only visible for accounting and tickets tabs) */}
          {(activeTab === 'accounting' || activeTab === 'tickets') && (
            <div className="relative w-full lg:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar movimientos o tickets..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] bg-[#F4F6FA] text-[#16202E] placeholder-[#666666]"
              />
              <Search className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
            </div>
          )}
        </div>

        {/* Tab 1: Accounting Ledger */}
        {activeTab === 'accounting' && showAccounting && (
          <div className="p-4 space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6B82] font-medium mr-1">Filtrar:</span>
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                      : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-transparent'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('ingreso')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    filterType === 'ingreso'
                      ? 'bg-green-950/60 text-green-600 border border-green-800/60'
                      : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-transparent'
                  }`}
                >
                  Solo Ingresos
                </button>
                <button
                  onClick={() => setFilterType('gasto')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    filterType === 'gasto'
                      ? 'bg-red-950/60 text-red-600 border border-red-800/60'
                      : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-transparent'
                  }`}
                >
                  Solo Gastos
                </button>
              </div>

              <span className="text-xs text-[#5A6B82] font-medium">
                Mostrando {filteredTransactions.length} movimientos
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-xs text-[#D1D5DB]">
                <thead className="bg-[#FFFFFF] text-[#5A6B82] uppercase font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Tipo / Categoría</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-3">Registrado Por</th>
                    <th className="py-2.5 px-3">Método / Ref</th>
                    <th className="py-2.5 px-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#5A6B82]">
                        No hay movimientos registrados en este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F4F6FA] transition-colors">
                        <td className="py-3 px-3 font-mono text-[#5A6B82] whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#16202E]">
                          {tx.code}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              tx.type === 'ingreso'
                                ? 'bg-green-50 text-green-600 border-green-800/50'
                                : 'bg-red-50 text-red-600 border-red-800/50'
                            }`}
                          >
                            {tx.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#16202E]">{tx.description}</p>
                          {tx.ticketNumber && (
                            <span className="text-[11px] text-[#0A2E6D] font-mono">
                              Ticket: {tx.ticketNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#5A6B82]">
                          {tx.registeredBy} ({tx.registeredByRole})
                        </td>
                        <td className="py-3 px-3 text-[#5A6B82]">
                          <span className="capitalize">{tx.paymentMethod}</span>
                          {tx.referenceNumber && (
                            <span className="block text-[10px] text-[#5A6B82] font-mono">
                              {tx.referenceNumber}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-bold font-mono text-sm ${
                            tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'ingreso' ? '+' : '-'}
                          {formatCurrency(tx.amount, building.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Building Tickets */}
        {activeTab === 'tickets' && (
          <div className="p-4 space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A6B82] font-medium mr-1">Estado:</span>
                {['all', 'pendiente', 'en_proceso', 'resuelta'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer ${
                      ticketStatusFilter === st
                        ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                        : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-transparent'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <span className="text-xs text-[#5A6B82] font-medium">
                {filteredTickets.length} incidencias encontradas
              </span>
            </div>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTickets.length === 0 ? (
                <div className="col-span-2 py-10 text-center text-[#5A6B82] bg-[#FFFFFF] rounded-xl border border-dashed border-[#E2E8F0]">
                  <Wrench className="w-10 h-10 mx-auto text-[#444444] mb-2 stroke-1" />
                  <p className="text-sm font-medium text-[#D1D5DB]">No hay incidencias que coincidan</p>
                  <p className="text-xs mt-1 text-[#5A6B82]">Las solicitudes creadas por el presidente aparecerán aquí.</p>
                </div>
              ) : (
                filteredTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="p-4 rounded-xl border border-[#282828] hover:border-[#0A2E6D]/50 transition-all bg-[#171717] flex flex-col justify-between"
                  >
                    <div onClick={() => setSelectedTicketId(tkt.id)} className="cursor-pointer">
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono text-[11px] font-bold text-[#0A2E6D] bg-[#0A2E6D]/15 px-2 py-0.5 rounded border border-[#0A2E6D]/30">
                          {tkt.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            tkt.status === 'resuelta'
                              ? 'bg-green-50 text-green-600 border border-green-800/50'
                              : tkt.status === 'en_proceso'
                              ? 'bg-yellow-50 text-yellow-600 border border-yellow-800/50'
                              : 'bg-[#E8EFF9] text-[#5A6B82] border border-[#E2E8F0]'
                          }`}
                        >
                          {tkt.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-[#16202E] text-xs sm:text-sm leading-snug line-clamp-2">
                        {tkt.title}
                      </h4>
                      <p className="text-xs text-[#5A6B82] mt-1 line-clamp-2">{tkt.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#5A6B82]">
                      <span>Piso {tkt.floor} • {tkt.unitOrArea}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#D1D5DB]">
                          {tkt.assignedWorkerName || 'Sin asignar'}
                        </span>
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar la incidencia ${tkt.ticketNumber}?`)) deleteTicket(tkt.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Common Areas */}
        {activeTab === 'common_areas' && (
          <div className="p-4">
            <CommonAreasManager
              building={building}
              onOpenCreateTicketForArea={(areaName, floor) => {
                onOpenCreateTicket();
              }}
            />
          </div>
        )}

        {/* Tab 4: Floor Utility Bills (Gas, Agua, Internet, etc.) */}
        {activeTab === 'floor_utilities' && (
          <div className="p-4">
            <FloorUtilityBillsManager building={building} />
          </div>
        )}

        {/* Tab 5: Insurance */}
        {activeTab === 'insurance' && (
          <div className="p-4">
            <InsuranceManager building={building} />
          </div>
        )}

        {/* Tab 6: Exceptional Expenses */}
        {activeTab === 'exceptional_expenses' && (
          <div className="p-4">
            <ExceptionalExpensesManager building={building} />
          </div>
        )}
      </div>

      {/* Adjust Repair Fund Modal */}
      <AdjustRepairFundModal
        building={building}
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />
      <AddBuildingModal isOpen={isEditOpen} building={building} onClose={() => setIsEditOpen(false)} />
      <AssignPresidentModal isOpen={isAssignOpen} building={building} onClose={() => setIsAssignOpen(false)} />
    </div>
  );
};
