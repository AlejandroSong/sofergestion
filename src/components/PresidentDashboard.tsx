import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Wrench,
  Clock,
  CheckCircle2,
  Hourglass,
  Euro,
  TrendingDown,
  FileDown,
  FileSpreadsheet,
  AlertTriangle,
  MapPin,
  Tag,
  Search,
  Coins,
  ShieldCheck,
  Receipt,
  LayoutGrid,
  UserCheck,
  Home,
  ShoppingBag,
  Sparkles,
  Check,
  Download,
  FileText,
  Edit3,
  Calendar,
  Phone,
  ArrowRight,
  BadgePercent,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportBuildingFinancialStatementPDF, exportTicketsToExcel, exportNeighborReceiptPDF, formatCurrency } from '../utils/exportUtils';
import { TicketStatus, NeighborService } from '../types';
import { CommonAreasManager } from './CommonAreasManager';
import { InsuranceManager } from './InsuranceManager';
import { NeighborAccountEditModal } from './NeighborAccountEditModal';
import { ServiceRequestModal } from './ServiceRequestModal';

interface PresidentDashboardProps {
  onOpenCreateTicket: () => void;
  onOpenCreateTicketForArea?: (areaName: string, floor: string) => void;
}

export const PresidentDashboard: React.FC<PresidentDashboardProps> = ({ 
  onOpenCreateTicket, 
  onOpenCreateTicketForArea 
}) => {
  const {
    currentUser,
    buildings,
    tickets,
    transactions,
    allUsers,
    setSelectedTicketId,
    neighborServices,
    neighborRequests,
    activeTab: globalActiveTab,
    setActiveTab: setGlobalActiveTab,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'vivienda' | 'sofer_services' | 'common_areas' | 'insurance'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('todos');
  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<NeighborService | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  // Sync with navbar clicks
  useEffect(() => {
    if (globalActiveTab === 'vivienda') setActiveTab('vivienda');
    if (globalActiveTab === 'servicios') setActiveTab('sofer_services');
    if (globalActiveTab === 'tickets') setActiveTab('overview');
    if (globalActiveTab === 'dashboard') setActiveTab('overview');
    if (globalActiveTab === 'common_areas') setActiveTab('common_areas');
    if (globalActiveTab === 'insurance') setActiveTab('insurance');
  }, [globalActiveTab]);

  // Find the building assigned to this president
  const building =
    buildings.find((b) => b.id === currentUser.buildingId || b.presidentId === currentUser.id) ||
    buildings[0];

  const myTickets = tickets.filter((t) => t.buildingId === building?.id);
  const myTransactions = transactions.filter((t) => t.buildingId === building?.id);

  // Repair box stats for this building
  const repairFundAvailable = building?.repairFund || 0;
  const initialRepairFund = building?.initialRepairFund || 0;
  const repairFundSpent = Math.max(0, initialRepairFund - repairFundAvailable);
  const repairFundPercent = initialRepairFund > 0 ? Math.round((repairFundAvailable / initialRepairFund) * 100) : 100;

  // Filtered tickets
  const filteredTickets = myTickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.unitOrArea.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = myTickets.filter((t) => t.status === 'pendiente').length;
  const inProgressCount = myTickets.filter((t) => t.status === 'en_proceso').length;
  const resolvedCount = myTickets.filter((t) => t.status === 'resuelta').length;

  // Personal dwelling & payment data for President
  const presidentBalance = currentUser.feeBalance ?? 0;
  const presidentFee = currentUser.monthlyFee ?? 95;
  const presidentFrequency = currentUser.feeFrequency ?? 'mensual';
  const presidentLastPayment = currentUser.lastPaymentAmount ?? presidentFee;
  const presidentLastDate = currentUser.lastPaymentDate || '05/08/2026';
  const presidentNextDue = currentUser.nextDueDate || '05/09/2026';

  // Services available & filtering
  const availableServices = neighborServices.filter(s => s.available);
  const filteredServices = availableServices.filter(s => {
    const matchesCat = serviceCategoryFilter === 'todos' || s.category.toLowerCase().includes(serviceCategoryFilter.toLowerCase());
    const matchesSearch = !serviceSearchTerm || 
      s.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) || 
      s.description.toLowerCase().includes(serviceSearchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Requests by the president and in his building
  const myPersonalRequests = neighborRequests.filter(r => r.neighborId === currentUser.id);
  const buildingCommunityRequests = neighborRequests.filter(r => r.buildingId === building?.id && r.neighborId !== currentUser.id);

  const handleOpenServiceModal = (service: NeighborService) => {
    setSelectedServiceForModal(service);
    setIsRequestModalOpen(true);
  };

  const handleDownloadReceipt = (monthLabel: string, amount: number) => {
    exportNeighborReceiptPDF(currentUser, building?.name || 'Comunidad', monthLabel, amount);
    if (showToast) {
      showToast('Recibo Descargado', `Se ha generado el recibo oficial en PDF de ${monthLabel}`, 'success');
    }
  };

  const renderMiViviendaYPagos = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* President Dwelling Banner */}
      <div className="bg-white border border-[#CBD5E1] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0A2E6D] text-xs font-bold mb-2">
              <Home className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Titular: {currentUser.name} • Propietario Residente
            </div>
            <h2 className="text-2xl font-bold text-[#16202E]">
              Vivienda: {currentUser.unitOrArea || 'Planta 4ª Ático B'}
            </h2>
            <p className="text-xs text-[#5A6B82] mt-1">
              {building?.name} — Liquidación de cuotas, cuenta bancaria y justificantes oficiales
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              presidentBalance < 0 ? 'bg-[#C0392B]/10 text-[#C0392B]' : 'bg-[#1B7F5A]/10 text-[#1B7F5A]'
            }`}>
              {presidentBalance < 0 ? (
                <><AlertCircle className="w-4 h-4" /> Deuda pendiente</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Al corriente de pago</>
              )}
            </span>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#0A2E6D] rounded-xl text-xs font-bold border border-[#E2E8F0] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Domiciliación</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Cards for the President's Dwelling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
            <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase">
              <span>Saldo Actual</span>
              <Coins className="w-4 h-4 text-[#0A2E6D]" />
            </div>
            <p className={`text-2xl font-bold mt-2 ${presidentBalance < 0 ? 'text-[#C0392B]' : 'text-[#1B7F5A]'}`}>
              {formatCurrency(presidentBalance)}
            </p>
            <p className="text-[11px] text-[#5A6B82] mt-1">
              {presidentBalance >= 0 ? 'Sin cargos comunitarios pendientes' : 'Importe pendiente de regularizar'}
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-[#0A2E6D] font-semibold uppercase">
              <span>Cuota Asignada</span>
              <Tag className="w-4 h-4 text-[#0A2E6D]" />
            </div>
            <p className="text-2xl font-bold text-[#0A2E6D] mt-2">
              {formatCurrency(presidentFee)}
            </p>
            <p className="text-[11px] text-blue-800 font-medium mt-1">
              Periodicidad: <strong className="capitalize">{presidentFrequency}</strong>
            </p>
          </div>

          <div className="p-4 bg-green-50/60 border border-green-200 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-green-800 font-semibold uppercase">
              <span>Último Pago</span>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700 mt-2">
              {formatCurrency(presidentLastPayment)}
            </p>
            <p className="text-[11px] text-green-800 font-medium mt-1 truncate" title={currentUser.lastPaymentConcept || 'Cuota ordinaria'}>
              Abonado el {presidentLastDate}
            </p>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-purple-800 font-semibold uppercase">
              <span>Próximo Vencimiento</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-purple-900 mt-2">
              {presidentNextDue}
            </p>
            <p className="text-[11px] text-purple-700 font-medium mt-1">
              Domiciliación SEPA activa
            </p>
          </div>
        </div>

        {/* SOFER Exclusive Tax Benefit for President & Neighbors */}
        <div className="bg-gradient-to-r from-[#0A2E6D] via-[#123E87] to-[#1A4F9E] rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Beneficio Exclusivo SOFER
            </div>
            <h4 className="text-lg font-bold tracking-tight">Declaraciones de la Renta Gratuitas para tu Vivienda</h4>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Como presidente y propietario de este edificio, cuentas con <strong>2 declaraciones de la renta anuales incluidas</strong> gestionadas por el equipo fiscal colegiado de SOFER.
            </p>
          </div>
          <div className="z-10 bg-black/25 px-4 py-2 rounded-xl backdrop-blur-xs shrink-0 flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">{currentUser.taxReturnsRemaining ?? 2} disponibles</span>
          </div>
        </div>
      </div>

      {/* Official Community Receipts Download */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-lg font-bold text-[#16202E]">
              Recibos Oficiales de la Comunidad de Propietarios (PDF)
            </h3>
            <p className="text-xs text-[#5A6B82]">
              Justificantes de pago válidos emitidos por la Administración para tu vivienda ({currentUser.unitOrArea || 'Planta 4ª Ático B'}).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Emisión Bancaria SEPA Conforme
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { month: 'Agosto 2026', date: '05/08/2026' },
            { month: 'Julio 2026', date: '05/07/2026' },
            { month: 'Junio 2026', date: '05/06/2026' },
            { month: 'Mayo 2026', date: '05/05/2026' },
            { month: 'Abril 2026', date: '05/04/2026' },
            { month: 'Marzo 2026', date: '05/03/2026' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-[#E2E8F0] rounded-2xl p-4.5 flex items-center justify-between group hover:border-[#0A2E6D] hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#F4F6FA] group-hover:bg-[#0A2E6D] group-hover:text-white p-2.5 rounded-xl text-[#0A2E6D] transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-[#16202E] text-sm">{item.month}</p>
                  <p className="text-xs text-[#5A6B82] mt-0.5">{formatCurrency(presidentFee)} • Pagado</p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadReceipt(item.month, presidentFee)}
                className="bg-[#0A2E6D] hover:bg-[#174B96] text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Descargar Recibo en PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Neighbor Account Edit Modal for President */}
      <NeighborAccountEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        neighbor={currentUser}
      />
    </div>
  );

  const renderServiciosSOFER = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Official Header Banner - Highlighting SOFER Brand & Admin Supervision for the President */}
      <div className="bg-gradient-to-r from-[#0A2E6D] via-[#123E87] to-[#0A2E6D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Servicios SOFER Gestión • Prestados por la Administración
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Catálogo Oficial de Servicios Técnicos & Gestoría
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Como <strong>presidente y vecino</strong> de <strong>{building?.name}</strong>, tienes acceso directo al catálogo de intervenciones técnicas, mantenimiento y servicios de administración de SOFER. Todo coordinado desde el despacho con tarifas concertadas para tu vivienda o para la comunidad.
          </p>
        </div>

        {/* 4 Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Garantía Oficial SOFER</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
            <span>Supervisión Colegiada</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <BadgePercent className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Tarifa Concertada Edificio</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Factura Oficial con IVA</span>
          </div>
        </div>

        <Sparkles className="absolute -right-8 -bottom-8 w-44 h-44 text-white/5 pointer-events-none" />
      </div>

      {/* Mis Solicitudes de Servicio (President's personal requests) */}
      {myPersonalRequests.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0A2E6D]" />
              Mis Solicitudes Activas de Servicios SOFER ({myPersonalRequests.length})
            </h3>
            <span className="text-xs text-[#5A6B82]">Peticiones para tu vivienda o presidencia</span>
          </div>

          <div className="space-y-3">
            {myPersonalRequests.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-xl gap-4 hover:border-blue-300 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#16202E] text-base">{r.serviceName}</h4>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      r.status === 'completado' ? 'bg-green-100 text-green-700' :
                      r.status === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {r.status === 'pendiente' ? 'Pendiente de confirmación' : r.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6B82]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0A2E6D]" />
                      Solicitado: {new Date(r.createdAt).toLocaleDateString('es-ES')}
                    </span>
                    {r.scheduledDate && (
                      <span className="text-[#0A2E6D] flex items-center gap-1 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        <Clock className="w-3.5 h-3.5" />
                        Visita acordada: {new Date(r.scheduledDate).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-[#5A6B82]" />
                      {r.unitOrArea}
                    </span>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-[#5A6B82] italic mt-1 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      "{r.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-[#5A6B82] block">Tarifa concertada</span>
                  <span className="font-extrabold text-lg text-[#0A2E6D]">{formatCurrency(r.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Grid with Search and Category filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setServiceCategoryFilter('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                serviceCategoryFilter === 'todos'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Todos ({availableServices.length})
            </button>
            <button
              onClick={() => setServiceCategoryFilter('mantenimiento')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                serviceCategoryFilter === 'mantenimiento'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Mantenimiento & Averías
            </button>
            <button
              onClick={() => setServiceCategoryFilter('limpieza')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                serviceCategoryFilter === 'limpieza'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Limpieza & Cristales
            </button>
            <button
              onClick={() => setServiceCategoryFilter('gestoria')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                serviceCategoryFilter === 'gestoria'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Gestoría & Certificados
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-[#16202E] placeholder-[#5A6B82] focus:bg-white focus:border-[#0A2E6D] outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {filteredServices.map(service => (
            <div 
              key={service.id} 
              className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between hover:border-[#0A2E6D] hover:shadow-md transition-all bg-white group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A2E6D] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    SOFER Oficial
                  </span>
                  <span className="text-[10px] font-semibold text-[#5A6B82] bg-slate-100 px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-[#16202E] text-base leading-snug group-hover:text-[#0A2E6D] transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-xs text-[#5A6B82] mt-1 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tarifa fija concertada (IVA incluido)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Técnico con seguro de RC y garantía</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#5A6B82] uppercase font-bold block">Tarifa acordada</span>
                  <span className="text-xl font-extrabold text-[#16202E]">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenServiceModal(service)}
                  className="bg-[#0A2E6D] hover:bg-[#174B96] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Solicitar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Supervision: SOFER services requested by neighbors in this building */}
      {buildingCommunityRequests.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0A2E6D]" />
              Supervisión de Servicios SOFER en tu Edificio
            </h3>
            <p className="text-xs text-[#5A6B82]">
              Visitas técnicas y servicios concertados solicitados por vecinos de {building?.name} para control de accesos e incidencias.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] text-[#5A6B82] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Vecino / Vivienda</th>
                  <th className="px-4 py-3">Servicio Solicitado</th>
                  <th className="px-4 py-3">Fecha Prevista</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {buildingCommunityRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#16202E]">
                      {req.neighborName}
                      <span className="block text-[11px] font-normal text-[#5A6B82]">{req.unitOrArea}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#16202E]">{req.serviceName}</td>
                    <td className="px-4 py-3 text-[#5A6B82]">
                      {req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString('es-ES') : 'Pendiente'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        req.status === 'completado' ? 'bg-green-100 text-green-700' :
                        req.status === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Request Modal for President */}
      <ServiceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        service={selectedServiceForModal}
        currentUser={currentUser}
        buildingName={building?.name}
        onSuccess={() => {
          if (showToast) {
            showToast('Servicio Solicitado', 'Tu petición ha sido enviada al administrador.', 'success');
          }
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner specifically for President */}
      <div className="bg-[#F4F6FA] text-[#16202E] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/50 text-blue-600 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Presidente & Vecino • {building?.name} ({currentUser.unitOrArea || 'Planta 4ª Ático B'})
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16202E]">
              Gestión Integral del Edificio & Vivienda
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6B82] max-w-xl leading-relaxed">
              Bienvenido/a {currentUser.name}. Supervisa averías y la <strong>caja de reparaciones</strong> de tu comunidad, gestiona las cuotas y recibos de tu propia vivienda, y accede al catálogo de <strong>Servicios SOFER</strong> ofrecidos por la administración.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-3 bg-[#0A2E6D] hover:bg-[#174B96] text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Comunicar Avería
            </button>

            {building && (
              <button
                onClick={() =>
                  exportBuildingFinancialStatementPDF(
                    building,
                    myTransactions,
                    myTickets,
                    'Agosto 2026'
                  )
                }
                className="px-3.5 py-3 bg-white hover:bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4 text-[#0A2E6D]" />
                Estado de Caja (PDF)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (5 intuitive tabs covering community + resident duties) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Overview */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'overview'
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
              : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'overview' ? 'bg-white/20' : 'bg-blue-50 text-[#0A2E6D] group-hover:scale-110'}`}>
            <Wrench className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Incidencias & Caja</span>
        </button>

        {/* 2. Mi Vivienda & Pagos (Neighbor role of President) */}
        <button
          onClick={() => setActiveTab('vivienda')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'vivienda'
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
              : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'vivienda' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600 group-hover:scale-110'}`}>
            <Home className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Mi Vivienda & Pagos</span>
        </button>

        {/* 3. Servicios SOFER (Admin catalog) */}
        <button
          onClick={() => setActiveTab('sofer_services')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border relative overflow-hidden ${
            activeTab === 'sofer_services'
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D] ring-2 ring-amber-400'
              : 'bg-gradient-to-b from-blue-50/50 to-white text-[#0A2E6D] border-blue-200 hover:border-[#0A2E6D]'
          }`}
        >
          <div className="absolute top-1.5 right-1.5 bg-amber-400 text-[#0A0A0A] text-[9px] font-black uppercase px-1.5 py-0.2 rounded shadow-xs tracking-wider">
            ADMIN
          </div>
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'sofer_services' ? 'bg-white/20' : 'bg-blue-100 text-[#0A2E6D] group-hover:scale-110'}`}>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-xs font-extrabold text-center">Servicios SOFER</span>
        </button>

        {/* 4. Áreas Comunes */}
        <button
          onClick={() => setActiveTab('common_areas')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'common_areas'
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
              : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'common_areas' ? 'bg-white/20' : 'bg-green-50 text-green-600 group-hover:scale-110'}`}>
            <LayoutGrid className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Áreas Comunes</span>
        </button>

        {/* 5. Seguros y contratos */}
        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'insurance'
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
              : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'insurance' ? 'bg-white/20' : 'bg-purple-50 text-purple-600 group-hover:scale-110'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Seguros y Contratos</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Building Stats & Status Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Incidencias Generales DE DINERO PARA REPARACIONES */}
            <div className="bg-[#F4F6FA] p-5 rounded-2xl border border-[#2D2D2D] shadow-md relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
                <span>Incidencias Generales de Reparaciones</span>
                <Coins className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-green-600 mt-2">
                {formatCurrency(repairFundAvailable)}
              </p>
              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#5A6B82]">
                  <span>Disponible: {repairFundPercent}%</span>
                  <span>Base: {formatCurrency(initialRepairFund)}</span>
                </div>
                <div className="w-full bg-[#E8EFF9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(5, repairFundPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
                  <span>Pendientes</span>
                  <Clock className="w-4 h-4 text-[#5A6B82]" />
                </div>
                <p className="text-2xl font-bold text-[#16202E] mt-2">{pendingCount}</p>
              </div>
              <span className="text-[11px] text-[#5A6B82] mt-1 block">Esperando asignación técnica</span>
            </div>

            <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
                  <span>En Proceso</span>
                  <Hourglass className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{inProgressCount}</p>
              </div>
              <span className="text-[11px] text-[#5A6B82] mt-1 block">Trabajadors aplicando gastos y reparando</span>
            </div>

            <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5A6B82] font-semibold uppercase tracking-wider">
                  <span>Resueltas</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">{resolvedCount}</p>
              </div>
              <span className="text-[11px] text-[#5A6B82] mt-1 block">Solucionadas y finiquitadas</span>
            </div>
          </div>

          {/* Neighbor Payment Status Section */}
          <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-6 shadow-md space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0A2E6D]" />
                Estado de Pagos de Vecinos
              </h3>
              <p className="text-xs text-[#5A6B82]">
                Lista de vecinos de tu edificio y el estado de sus cuotas de comunidad.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] text-[#5A6B82] uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Vecino / Vivienda</th>
                    <th className="px-4 py-3">Cuota</th>
                    <th className="px-4 py-3">Último Pago</th>
                    <th className="px-4 py-3">Estado / Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {allUsers.filter(u => u.role === 'neighbor' && (u.buildingId === currentUser.buildingId || u.buildingId === building?.id)).length > 0 ? (
                    allUsers.filter(u => u.role === 'neighbor' && (u.buildingId === currentUser.buildingId || u.buildingId === building?.id)).map(neighbor => (
                      <tr key={neighbor.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img src={neighbor.avatar} alt={neighbor.name} className="w-6 h-6 rounded-full object-cover border border-[#E2E8F0]"/>
                            <div>
                              <p className="font-bold text-[#16202E]">{neighbor.name}</p>
                              <p className="text-[10px] text-[#5A6B82]">{neighbor.unitOrArea || 'Sin vivienda asignada'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#16202E]">{(neighbor.monthlyFee || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          <span className="text-[10px] text-[#5A6B82] block">{neighbor.feeFrequency === 'anual' ? 'Anual' : 'Mensual'}</span>
                        </td>
                        <td className="px-4 py-3 text-[#16202E]">
                          {neighbor.lastPaymentDate ? new Date(neighbor.lastPaymentDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No registrado'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`font-bold ${(neighbor.feeBalance || 0) < 0 ? 'text-red-600' : (neighbor.feeBalance || 0) > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                              {(neighbor.feeBalance || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                            <span className="text-[10px] font-medium text-[#5A6B82]">
                              {(neighbor.feeBalance || 0) < 0 ? 'Deuda' : (neighbor.feeBalance || 0) > 0 ? 'A favor' : 'Al corriente'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[#5A6B82]">
                        No hay vecinos registrados en este edificio aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#16202E]">Incidencias de {building?.name}</h3>
                <p className="text-xs text-[#5A6B82]">
                  Supervisa los partes de trabajo y el estado de reparación en tiempo real.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5A6B82] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar avería o zona..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-[#16202E] placeholder-[#5A6B82] focus:bg-white focus:border-[#0A2E6D] outline-hidden transition-all"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-[#16202E] outline-hidden cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelta">Resueltas</option>
                </select>

                <button
                  onClick={() => exportTicketsToExcel(filteredTickets, `Incidencias_${building?.name || 'Edificio'}`)}
                  className="px-3 py-1.5 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#0A2E6D] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-[#5A6B82]">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-green-600" />
                  <p className="text-sm font-semibold">No se encontraron incidencias en este edificio.</p>
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0A2E6D] transition-all bg-white hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-[#E2E8F0] px-2 py-0.5 rounded text-[#16202E] font-bold">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            t.status === 'resuelta'
                              ? 'bg-green-100 text-green-700'
                              : t.status === 'en_proceso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-[#5A6B82] bg-slate-100 px-2 py-0.5 rounded">
                          {t.unitOrArea}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#16202E]">{t.title}</h4>
                      <p className="text-xs text-[#5A6B82] line-clamp-1">{t.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#5A6B82] block">
                        {new Date(t.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      {t.assignedToName ? (
                        <span className="text-xs font-semibold text-[#0A2E6D] mt-0.5 block">
                          Técnico: {t.assignedToName}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 mt-0.5 block">Sin asignar</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Transactions / Repair Box History for President */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#16202E]">
                  Movimientos de la Caja de Reparaciones
                </h3>
                <p className="text-xs text-[#5A6B82]">
                  Gastos aplicados directamente por trabajadors y aportaciones de la comunidad.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] text-[#5A6B82] uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {myTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[#5A6B82]">
                        No hay movimientos registrados en la caja de este edificio.
                      </td>
                    </tr>
                  ) : (
                    myTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-[#5A6B82]">
                          {new Date(tx.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#16202E]">
                          {tx.concept}
                          {tx.ticketNumber && (
                            <span className="ml-1 text-[10px] text-[#0A2E6D] bg-blue-50 px-1.5 py-0.5 rounded">
                              {tx.ticketNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              tx.type === 'ingreso'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold font-mono ${
                            tx.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'ingreso' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MI VIVIENDA & PAGOS TAB */}
      {activeTab === 'vivienda' && renderMiViviendaYPagos()}

      {/* SERVICIOS SOFER TAB */}
      {activeTab === 'sofer_services' && renderServiciosSOFER()}

      {/* ÁREAS COMUNES TAB */}
      {activeTab === 'common_areas' && (
        <div className="pt-2">
          <CommonAreasManager 
            building={building} 
            onOpenCreateTicketForArea={onOpenCreateTicketForArea} 
          />
        </div>
      )}

      {/* SEGUROS Y CONTRATOS TAB */}
      {activeTab === 'insurance' && (
        <div className="pt-2">
          <InsuranceManager building={building} />
        </div>
      )}
    </div>
  );
};
