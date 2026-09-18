import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Receipt, 
  Wrench, 
  Download, 
  FileText, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Edit3,
  CreditCard,
  ShieldCheck,
  Search,
  Check,
  Phone,
  Tag,
  BadgePercent
} from 'lucide-react';
import { NeighborAccountEditModal } from './NeighborAccountEditModal';
import { ServiceRequestModal } from './ServiceRequestModal';
import { exportNeighborReceiptPDF } from '../utils/exportUtils';
import { NeighborService } from '../types';

interface NeighborDashboardProps {
  onOpenCreateTicket: () => void;
}

export const NeighborDashboard: React.FC<NeighborDashboardProps> = ({ onOpenCreateTicket }) => {
  const { 
    currentUser, 
    buildings, 
    tickets, 
    neighborServices, 
    neighborRequests,
    activeTab: globalActiveTab,
    setActiveTab: setGlobalActiveTab,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cuentas' | 'incidencias' | 'recibos' | 'servicios'>('cuentas');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<NeighborService | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  
  // Sync when navbar buttons are clicked
  useEffect(() => {
    if (globalActiveTab === 'servicios') setActiveTab('servicios');
    if (globalActiveTab === 'tickets') setActiveTab('incidencias');
    if (globalActiveTab === 'dashboard') setActiveTab('cuentas');
    if (globalActiveTab === 'recibos') setActiveTab('recibos');
  }, [globalActiveTab]);

  const building = buildings.find(b => b.id === currentUser.buildingId);
  const balance = currentUser.feeBalance ?? 0;
  
  const myTickets = tickets.filter(t => 
    t.createdBy.id === currentUser.id || 
    (t.buildingId === currentUser.buildingId && t.unitOrArea === currentUser.unitOrArea)
  );
  
  const myRequests = neighborRequests.filter(r => r.neighborId === currentUser.id);

  if (!building) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5A6B82]">
        <Building2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-semibold">No tienes un edificio asignado.</p>
        <p className="text-sm">Contacta con el administrador para que te asigne tu vivienda.</p>
      </div>
    );
  }

  const handleOpenServiceModal = (service: NeighborService) => {
    setSelectedServiceForModal(service);
    setIsRequestModalOpen(true);
  };

  const handleDownloadReceipt = (monthLabel: string, amount: number) => {
    exportNeighborReceiptPDF(currentUser, building.name, monthLabel, amount);
    if (showToast) {
      showToast('Recibo Descargado', `Se ha generado el recibo oficial en PDF para ${monthLabel}`, 'success');
    }
  };

  // Filtered SOFER services
  const availableServices = neighborServices.filter(s => s.available);
  const filteredServices = availableServices.filter(s => {
    const matchesCat = selectedCategory === 'todos' || s.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categoryCounts = {
    todos: availableServices.length,
    mantenimiento: availableServices.filter(s => s.category.toLowerCase().includes('mantenimiento') || s.category.toLowerCase().includes('técnico')).length,
    limpieza: availableServices.filter(s => s.category.toLowerCase().includes('limpieza')).length,
    gestoria: availableServices.filter(s => s.category.toLowerCase().includes('gestoría') || s.category.toLowerCase().includes('fiscal') || s.category.toLowerCase().includes('certificados')).length,
  };

  const renderCuentas = () => {
    const cuota = currentUser.monthlyFee ?? building.monthlyQuotaFee ?? 85;
    const frequency = currentUser.feeFrequency ?? 'mensual';
    const balance = currentUser.feeBalance ?? 0;
    const lastPayment = currentUser.lastPaymentAmount ?? cuota;
    const lastDate = currentUser.lastPaymentDate 
      ? new Date(currentUser.lastPaymentDate).toLocaleDateString('es-ES') 
      : '05/08/2026';
    const nextDue = currentUser.nextDueDate 
      ? new Date(currentUser.nextDueDate).toLocaleDateString('es-ES') 
      : '05/09/2026';

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Prominent Banner for SOFER Services in resident overview */}
        <div className="bg-gradient-to-r from-[#0A2E6D] via-[#123E87] to-[#1A4F9E] text-white p-6 rounded-3xl shadow-lg border border-blue-900/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Servicios Oficiales SOFER • Ofrecidos por tu Administrador
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              ¿Necesitas fontanería, revisión de caldera, o pintura para tu casa?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Tu comunidad cuenta con la red de técnicos concertados de <strong>SOFER Gestión</strong>. Tarifas fijas transparentes sin sorpresas, seguro de responsabilidad civil y supervisión colegiada.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('servicios')}
            className="z-10 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-[#0A0A0A] font-bold text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Catálogo SOFER ({availableServices.length} servicios)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Sparkles className="absolute -right-6 -bottom-6 w-36 h-36 text-white/5 pointer-events-none" />
        </div>

        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-xl font-bold text-[#16202E]">
                Extracto de Cuenta • {currentUser.unitOrArea || 'Vivienda'}
              </h2>
              <p className="text-xs text-[#5A6B82] mt-0.5">
                {building.name} — Estado financiero y liquidación de cuotas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5A6B82]">Régimen de cuota:</span>
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0A2E6D] text-xs font-bold rounded-lg uppercase">
                {frequency === 'anual' ? '📅 Anual' : '🗓️ Mensual'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[#5A6B82] text-xs font-semibold uppercase">Saldo Actual</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {balance >= 0 ? 'Al día' : 'Pendiente'}
                </span>
              </div>
              <p className={`text-2xl font-bold ${balance < 0 ? 'text-[#C0392B]' : 'text-[#1B7F5A]'}`}>
                {balance.toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-[11px] text-[#5A6B82] mt-1">
                {balance >= 0 ? 'Cuenta sin cargos pendientes' : 'Existe deuda acumulada'}
              </p>
            </div>

            <div className="p-4 bg-green-50/70 border border-green-200 rounded-xl">
              <p className="text-green-800 text-xs font-semibold uppercase mb-1">Último Pago</p>
              <p className="text-2xl font-bold text-green-700">
                {lastPayment.toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-[11px] text-green-800 font-medium mt-1">
                Abonado el {lastDate}
              </p>
              {currentUser.lastPaymentConcept && (
                <p className="text-[10px] text-green-700 truncate mt-0.5" title={currentUser.lastPaymentConcept}>
                  {currentUser.lastPaymentConcept}
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[#0A2E6D] text-xs font-semibold uppercase">
                  {frequency === 'anual' ? 'Cuota Anual' : 'Próxima Cuota'}
                </p>
                <span className="text-[10px] font-bold text-[#0A2E6D] bg-blue-100 px-1.5 py-0.5 rounded">
                  {frequency === 'anual' ? 'Anual' : 'Mensual'}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#0A2E6D]">
                {cuota.toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-[11px] text-blue-800 font-medium mt-1">
                Vencimiento: <strong>{nextDue}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#16202E]">Histórico de recibos y liquidaciones</h3>
            <button
              onClick={() => setActiveTab('recibos')}
              className="text-xs text-[#0A2E6D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos los recibos (PDF)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {['Agosto 2026', 'Julio 2026', 'Junio 2026'].map((periodStr, idx) => {
              return (
                <div key={idx} className="flex items-center justify-between p-4 border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl transition-colors bg-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#16202E]">
                        Cuota de comunidad ({frequency === 'anual' ? 'Anual' : 'Mensual'}) - {periodStr}
                      </p>
                      <p className="text-xs text-[#5A6B82]">
                        Liquidado el 05/{idx === 0 ? '08/2026' : idx === 1 ? '07/2026' : '06/2026'} • Recibo oficial verificado
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#16202E]">{cuota.toFixed(2).replace('.', ',')} €</span>
                    <button
                      onClick={() => handleDownloadReceipt(periodStr, cuota)}
                      className="px-3 py-1.5 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#0A2E6D] rounded-lg text-xs font-bold border border-[#E2E8F0] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Descargar Recibo en PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for editing neighbor accounts */}
        <NeighborAccountEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          neighbor={currentUser}
        />
      </div>
    );
  };

  const renderIncidencias = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#16202E]">Incidencias de mi Vivienda y Edificio</h2>
          <p className="text-xs text-[#5A6B82]">Comunica cualquier avería para que el administrador asigne al técnico adecuado.</p>
        </div>
        <button
          onClick={onOpenCreateTicket}
          className="bg-[#0A2E6D] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#174B96] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Wrench className="w-4 h-4" />
          <span>Comunicar Avería</span>
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        {myTickets.length === 0 ? (
          <div className="text-center py-10 text-[#5A6B82]">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-base">No has comunicado ninguna incidencia.</p>
            <p className="text-xs text-[#5A6B82] mt-1">Si detectas alguna avería en zonas comunes o en tu vivienda, pulsa en "Comunicar Avería".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTickets.map(t => (
              <div key={t.id} className="border border-[#E2E8F0] hover:border-blue-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 bg-[#F4F6FA]/40 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-[#E2E8F0] px-2 py-0.5 rounded text-[#16202E] font-bold">{t.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      t.status === 'resuelta' ? 'bg-[#1B7F5A]/10 text-[#1B7F5A]' :
                      t.status === 'en_proceso' ? 'bg-[#B76E00]/10 text-[#B76E00]' :
                      'bg-[#C0392B]/10 text-[#C0392B]'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#5A6B82] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {t.unitOrArea}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#16202E] text-base">{t.title}</h3>
                  <p className="text-sm text-[#5A6B82] line-clamp-2 mt-1">{t.description}</p>
                </div>
                <div className="text-right whitespace-nowrap text-xs text-[#5A6B82] flex flex-col justify-between">
                  <p>Creada: {new Date(t.createdAt).toLocaleDateString('es-ES')}</p>
                  {t.assignedToName && (
                    <p className="text-blue-700 font-medium">Asignado: {t.assignedToName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRecibos = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-xl font-bold text-[#16202E]">Mis Recibos Oficiales (Descarga en PDF)</h2>
            <p className="text-xs text-[#5A6B82] mt-0.5">
              Descarga los recibos oficiales emitidos por el Administrador de Fincas para justificar tus pagos de comunidad.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Certificado Oficial SEPA
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
          ].map((rec, i) => {
            const cuota = currentUser.monthlyFee ?? 85;
            return (
              <div 
                key={i} 
                className="border border-[#E2E8F0] rounded-2xl p-4.5 flex items-center justify-between group hover:border-[#0A2E6D] hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#F4F6FA] group-hover:bg-[#0A2E6D] group-hover:text-white p-2.5 rounded-xl text-[#0A2E6D] transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-[#16202E] text-sm">{rec.month}</p>
                    <p className="text-xs text-[#5A6B82] mt-0.5">{cuota.toFixed(2).replace('.', ',')} € • Cobrado</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadReceipt(rec.month, cuota)}
                  className="bg-[#0A2E6D] hover:bg-[#174B96] text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Descargar Recibo en PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderServicios = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Official Header Banner - Highlighting SOFER Brand & Admin Supervision */}
      <div className="bg-gradient-to-r from-[#0A2E6D] via-[#123E87] to-[#0A2E6D] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Catálogo Oficial de Servicios SOFER • Ofrecido por tu Administrador
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Servicios Profesionales para tu Hogar
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Tu administración de fincas te garantiza técnicos homologados, seguro de responsabilidad civil y <strong>precios cerrados concertados</strong> para los vecinos de <strong>{building.name}</strong>. Olvídate de presupuestos desorbitados o técnicos desconocidos.
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
            <span>Tarifa Especial Vecinal</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Factura Oficial con IVA</span>
          </div>
        </div>

        <Sparkles className="absolute -right-8 -bottom-8 w-44 h-44 text-white/5 pointer-events-none" />
      </div>

      {/* Active Requests Progress Tracker (if any) */}
      {myRequests.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0A2E6D]" />
              Mis Solicitudes de Servicios SOFER ({myRequests.length})
            </h2>
            <span className="text-xs text-[#5A6B82]">Gestionadas por el despacho de administración</span>
          </div>

          <div className="space-y-3">
            {myRequests.map(r => (
              <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-xl gap-4 hover:border-blue-300 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#16202E] text-base">{r.serviceName}</h3>
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
                        Visita concertada: {new Date(r.scheduledDate).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {r.unitOrArea && (
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-[#5A6B82]" />
                        {r.unitOrArea}
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="text-xs text-[#5A6B82] italic mt-1 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      "{r.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-[#5A6B82] block">Tarifa acordada</span>
                  <span className="font-extrabold text-lg text-[#0A2E6D]">{r.price.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Search & Category Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'todos'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Todos ({categoryCounts.todos})
            </button>
            <button
              onClick={() => setSelectedCategory('mantenimiento')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'mantenimiento'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Mantenimiento & Hogar ({categoryCounts.mantenimiento})
            </button>
            <button
              onClick={() => setSelectedCategory('limpieza')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'limpieza'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Limpieza ({categoryCounts.limpieza})
            </button>
            <button
              onClick={() => setSelectedCategory('gestoria')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'gestoria'
                  ? 'bg-[#0A2E6D] text-white shadow-xs'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:bg-[#E8EFF9]'
              }`}
            >
              Gestoría & Certificados ({categoryCounts.gestoria})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-[#16202E] placeholder-[#5A6B82] focus:bg-white focus:border-[#0A2E6D] outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Services Grid */}
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
                  <h3 className="font-bold text-[#16202E] text-base leading-snug group-hover:text-[#0A2E6D] transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#5A6B82] mt-1 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tarifa fija con IVA incluido</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Técnico con seguro de RC y garantía</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#5A6B82] uppercase font-bold block">Tarifa vecinal</span>
                  <span className="text-xl font-extrabold text-[#16202E]">
                    {service.price.toFixed(2)} €
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

        {filteredServices.length === 0 && (
          <div className="text-center py-12 text-[#5A6B82]">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No se encontraron servicios con ese término.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('todos'); }}
              className="mt-2 text-xs text-[#0A2E6D] font-bold underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Reusable Modal for requesting services */}
      <ServiceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        service={selectedServiceForModal}
        currentUser={currentUser}
        buildingName={building.name}
        onSuccess={() => {
          if (showToast) {
            showToast('Servicio Solicitado', 'Tu petición ha sido enviada al administrador.', 'success');
          }
        }}
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#E2E8F0]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A2E6D] text-xs font-semibold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            {building.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16202E] tracking-tight">
            Hola, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-[#5A6B82] text-xs sm:text-sm mt-0.5 flex items-center gap-2">
            <Home className="w-4 h-4 text-[#0A2E6D]" />
            <span>Vivienda: <strong className="text-[#16202E]">{currentUser.unitOrArea || 'Sin vivienda asignada'}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-[#5A6B82] uppercase font-bold">Estado de cuenta</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 mt-0.5 rounded-full text-xs font-bold ${
              balance < 0 ? 'bg-[#C0392B]/10 text-[#C0392B]' : 'bg-[#1B7F5A]/10 text-[#1B7F5A]'
            }`}>
              {balance < 0 ? (
                <><AlertCircle className="w-3.5 h-3.5" /> Deuda pendiente</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Al corriente de pago</>
              )}
            </span>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2.5 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#0A2E6D] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Editar datos de cuenta o domiciliación"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Intuitive Menu with Prominent SOFER Services) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => setActiveTab('cuentas')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'cuentas' ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]' : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'cuentas' ? 'bg-white/20' : 'bg-blue-50 text-[#0A2E6D] group-hover:scale-110'}`}>
            <Receipt className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Mis Cuentas</span>
        </button>

        <button 
          onClick={() => setActiveTab('incidencias')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'incidencias' ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]' : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'incidencias' ? 'bg-white/20' : 'bg-orange-50 text-orange-600 group-hover:scale-110'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Incidencias</span>
        </button>

        <button 
          onClick={() => setActiveTab('recibos')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-xs group border ${
            activeTab === 'recibos' ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]' : 'bg-white text-[#5A6B82] border-[#E2E8F0] hover:border-[#0A2E6D]/40'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'recibos' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600 group-hover:scale-110'}`}>
            <Download className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-center">Recibos Oficiales</span>
        </button>

        {/* Enhanced Prominent Button for SOFER Services */}
        <button 
          onClick={() => setActiveTab('servicios')}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all cursor-pointer shadow-sm group border relative overflow-hidden ${
            activeTab === 'servicios' 
              ? 'bg-[#0A2E6D] text-white border-[#0A2E6D] ring-2 ring-amber-400' 
              : 'bg-gradient-to-b from-blue-50/60 to-white text-[#0A2E6D] border-blue-200 hover:border-[#0A2E6D]'
          }`}
        >
          <div className="absolute top-1.5 right-1.5 bg-amber-400 text-[#0A0A0A] text-[9px] font-black uppercase px-1.5 py-0.2 rounded shadow-xs tracking-wider">
            ADMIN
          </div>
          <div className={`p-3 rounded-xl transition-transform ${activeTab === 'servicios' ? 'bg-white/20' : 'bg-blue-100 text-[#0A2E6D] group-hover:scale-110'}`}>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-xs font-extrabold text-center">Servicios SOFER</span>
        </button>
      </div>

      {currentUser.taxReturnsRemaining !== undefined && (
        <div className="bg-gradient-to-br from-[#0A2E6D] to-[#174B96] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <Sparkles className="absolute -right-4 -top-4 w-32 h-32 text-white/10" />
          <h3 className="text-xl font-bold mb-1">Declaración de la Renta Gratuita</h3>
          <p className="text-blue-100 text-xs sm:text-sm mb-4 max-w-md">Como propietario del edificio gestionado por SOFER, tienes declaraciones de la renta anuales sin coste.</p>
          <div className="flex items-center gap-3 bg-black/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base">{currentUser.taxReturnsRemaining} declaraciones disponibles este ejercicio</span>
          </div>
        </div>
      )}

      {activeTab === 'cuentas' && renderCuentas()}
      {activeTab === 'incidencias' && renderIncidencias()}
      {activeTab === 'recibos' && renderRecibos()}
      {activeTab === 'servicios' && renderServicios()}
    </div>
  );
};
