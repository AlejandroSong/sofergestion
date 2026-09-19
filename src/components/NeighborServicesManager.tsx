import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/exportUtils';
import { 
  Settings, 
  Wrench, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Edit2, 
  Trash2,
  Calendar,
  CreditCard,
  Building2,
  UserCheck,
  AlertTriangle,
  Filter,
  Users
} from 'lucide-react';
import { NeighborService, NeighborServiceRequest, User } from '../types';
import { NeighborAccountEditModal } from './NeighborAccountEditModal';
import { formatIsoDateEs } from '../utils/dates';

export const NeighborServicesManager: React.FC = () => {
  const { 
    neighborServices, 
    addNeighborService, 
    updateNeighborService, 
    removeNeighborService,
    neighborRequests,
    updateNeighborRequest
  } = useApp();

  const [activeTab, setActiveTab] = useState<'requests' | 'catalog' | 'cuentas'>('requests');

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#16202E]">Gestión de Vecinos (SOFER)</h2>
          <p className="text-sm text-[#5A6B82]">Solicitudes de servicios y catálogo</p>
        </div>
        <div className="flex bg-[#F4F6FA] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'requests' 
                ? 'bg-white text-[#0A2E6D] shadow-sm' 
                : 'text-[#5A6B82] hover:text-[#16202E]'
            }`}
          >
            Solicitudes
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'catalog' 
                ? 'bg-white text-[#0A2E6D] shadow-sm' 
                : 'text-[#5A6B82] hover:text-[#16202E]'
            }`}
          >
            Catálogo
          </button>
          <button
            onClick={() => setActiveTab('cuentas')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'cuentas' 
                ? 'bg-white text-[#0A2E6D] shadow-sm' 
                : 'text-[#5A6B82] hover:text-[#16202E]'
            }`}
          >
            Cuentas Vecinos
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'requests' ? (
           <RequestsTab requests={neighborRequests} updateRequest={updateNeighborRequest} />
        ) : activeTab === 'catalog' ? (
           <CatalogTab 
              services={neighborServices} 
              addService={addNeighborService} 
              updateService={updateNeighborService} 
              removeService={removeNeighborService} 
           />
        ) : (
           <NeighborAccountsManager />
        )}
      </div>
    </div>
  );
};

const RequestsTab = ({ requests, updateRequest }: { 
  requests: NeighborServiceRequest[], 
  updateRequest: (id: string, status: NeighborServiceRequest['status'], date?: string) => void 
}) => {
  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-10 text-[#5A6B82]">No hay solicitudes pendientes.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#5A6B82] uppercase tracking-wider">
                <th className="pb-3 px-4">Fecha</th>
                <th className="pb-3 px-4">Vecino / Vivienda</th>
                <th className="pb-3 px-4">Servicio</th>
                <th className="pb-3 px-4">Importe</th>
                <th className="pb-3 px-4">Estado</th>
                <th className="pb-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-b border-[#E2E8F0] hover:bg-[#F4F6FA] transition-colors group">
                  <td className="py-3 px-4 text-sm text-[#16202E]">
                    {new Date(r.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-sm text-[#16202E]">{r.neighborName}</p>
                    <p className="text-xs text-[#5A6B82]">{r.unitOrArea}</p>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-[#16202E]">{r.serviceName}</td>
                  <td className="py-3 px-4 text-sm text-[#16202E]">{formatCurrency(r.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      r.status === 'completado' ? 'bg-green-100 text-green-700' :
                      r.status === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select 
                      value={r.status}
                      onChange={(e) => updateRequest(r.id, e.target.value as any)}
                      className="text-xs bg-white border border-[#E2E8F0] rounded p-1 outline-none"
                    >
                      <option value="solicitado">Solicitado</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CatalogTab = ({ services, addService, updateService, removeService }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: 0, category: 'limpieza', available: true });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || newService.price <= 0) return;
    addService(newService as any);
    setIsAdding(false);
    setNewService({ name: '', description: '', price: 0, category: 'limpieza', available: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#0A2E6D] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#174B96] transition-colors"
        >
          {isAdding ? 'Cancelar' : 'Añadir Servicio'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#F4F6FA] border border-[#E2E8F0] p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Nombre y Descripción</label>
            <input 
              type="text" 
              required
              placeholder="Nombre del servicio" 
              className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-t-lg text-sm text-[#16202E] outline-none"
              value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Breve descripción..." 
              className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] border-t-0 rounded-b-lg text-sm text-[#16202E] outline-none"
              value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})}
            />
          </div>
          <div>
             <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Categoría</label>
             <select 
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#16202E] outline-none"
                value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})}
             >
                <option value="mantenimiento">Mantenimiento</option>
                <option value="limpieza">Limpieza</option>
                <option value="gestoria">Gestoría</option>
                <option value="otros">Otros</option>
             </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Precio (€)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="0.1" step="0.1" required
                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#16202E] outline-none"
                value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})}
              />
              <button type="submit" className="bg-[#128480] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#0f6b67] transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s: any) => (
          <div key={s.id} className={`border p-4 rounded-xl flex flex-col justify-between ${!s.available ? 'opacity-50 bg-gray-50 border-gray-200' : 'bg-white border-[#E2E8F0] hover:border-[#0A2E6D]/30 transition-colors'}`}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[#16202E] leading-tight">{s.name}</h3>
                <span className="bg-[#0A2E6D]/10 text-[#0A2E6D] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{s.category}</span>
              </div>
              <p className="text-xs text-[#5A6B82] mb-4">{s.description}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              <span className="font-bold text-[#16202E]">{formatCurrency(s.price)}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateService(s.id, { available: !s.available })}
                  className={`text-xs px-2 py-1 rounded font-semibold ${s.available ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
                >
                  {s.available ? 'Pausar' : 'Activar'}
                </button>
                <button onClick={() => removeService(s.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const NeighborAccountsManager: React.FC = () => {
  const { allUsers } = useApp();
  const neighbors = allUsers.filter(u => u.role === 'neighbor');
  
  const [selectedNeighborForEdit, setSelectedNeighborForEdit] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'debtor' | 'non_debtor'>('all');

  const debtorNeighbors = neighbors.filter(n => (n.feeBalance ?? 0) < 0);
  const nonDebtorNeighbors = neighbors.filter(n => (n.feeBalance ?? 0) >= 0);
  const totalDebtAmount = debtorNeighbors.reduce((acc, curr) => acc + Math.abs(curr.feeBalance ?? 0), 0);

  const filteredNeighbors = neighbors.filter(n => {
    const balance = n.feeBalance ?? 0;
    if (debtFilter === 'debtor' && balance >= 0) return false;
    if (debtFilter === 'non_debtor' && balance < 0) return false;

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      n.name.toLowerCase().includes(q) ||
      (n.buildingName?.toLowerCase() || '').includes(q) ||
      (n.unitOrArea?.toLowerCase() || '').includes(q) ||
      n.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0A2E6D]" />
            Cuentas y Cuotas de Vecinos
          </h3>
          <p className="text-xs text-[#5A6B82] mt-0.5">
            Administradores y trabajadors pueden gestionar saldos, consultar deudores y registrar pagos o vencimientos.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar vecino, piso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F4F6FA] border border-[#CBD5E1] rounded-xl text-xs text-[#16202E] outline-none"
          />
        </div>
      </div>

      {/* Summary KPI Cards with Click-to-Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => setDebtFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            debtFilter === 'all'
              ? 'bg-blue-50/80 border-[#0A2E6D] shadow-sm ring-2 ring-[#0A2E6D]/20'
              : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#5A6B82] uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0A2E6D]" />
              Todos los Vecinos
            </span>
            <span className="text-[10px] font-bold text-[#0A2E6D] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded-full">
              {neighbors.length}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#16202E] mt-1">{neighbors.length}</p>
          <p className="text-[11px] text-[#5A6B82] mt-0.5">Padrón total de la comunidad</p>
        </button>

        <button
          type="button"
          onClick={() => setDebtFilter('debtor')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            debtFilter === 'debtor'
              ? 'bg-red-50/90 border-red-500 shadow-sm ring-2 ring-red-400/30'
              : 'bg-red-50/40 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-red-800 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Vecinos Deudores
            </span>
            <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
              {debtorNeighbors.length} {debtorNeighbors.length === 1 ? 'deudor' : 'deudores'}
            </span>
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {debtorNeighbors.length}
            <span className="text-xs font-normal text-red-600 ml-2">
              (Total deuda: {formatCurrency(totalDebtAmount)})
            </span>
          </p>
          <p className="text-[11px] text-red-700 font-medium mt-0.5">Saldo pendiente o en descubierto</p>
        </button>

        <button
          type="button"
          onClick={() => setDebtFilter('non_debtor')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            debtFilter === 'non_debtor'
              ? 'bg-green-50/90 border-green-600 shadow-sm ring-2 ring-green-500/30'
              : 'bg-green-50/40 border-green-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-green-800 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              No Deudores (Al Día)
            </span>
            <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded-full">
              {nonDebtorNeighbors.length}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-1">{nonDebtorNeighbors.length}</p>
          <p className="text-[11px] text-green-700 font-medium mt-0.5">Sin deudas o con saldo positivo</p>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-2 rounded-2xl border border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#5A6B82] flex items-center gap-1 pl-2 pr-1">
            <Filter className="w-3.5 h-3.5 text-[#0A2E6D]" />
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setDebtFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              debtFilter === 'all'
                ? 'bg-[#0A2E6D] text-white shadow-sm'
                : 'bg-white text-[#5A6B82] hover:text-[#16202E] border border-[#CBD5E1]'
            }`}
          >
            Todos ({neighbors.length})
          </button>
          <button
            type="button"
            onClick={() => setDebtFilter('debtor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              debtFilter === 'debtor'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-red-700 hover:bg-red-50 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deudores ({debtorNeighbors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDebtFilter('non_debtor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              debtFilter === 'non_debtor'
                ? 'bg-green-700 text-white shadow-sm'
                : 'bg-white text-green-700 hover:bg-green-50 border border-green-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>No Deudores / Al Día ({nonDebtorNeighbors.length})</span>
          </button>
        </div>

        <span className="text-xs text-[#5A6B82] pr-2">
          Mostrando <strong>{filteredNeighbors.length}</strong> de {neighbors.length} vecinos
        </span>
      </div>

      <div className="space-y-3">
        {filteredNeighbors.length === 0 ? (
          <div className="p-8 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[#5A6B82]">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm text-[#16202E]">
              {debtFilter === 'debtor'
                ? '¡Buenas noticias! No hay vecinos deudores registrados con el filtro actual.'
                : debtFilter === 'non_debtor'
                ? 'No se encontraron vecinos al día con los criterios especificados.'
                : 'No se encontraron vecinos registrados.'}
            </p>
            <p className="text-xs mt-1">
              {searchTerm ? 'Prueba a borrar o cambiar el término de búsqueda.' : 'Puedes cambiar el filtro para ver otros registros.'}
            </p>
            {debtFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setDebtFilter('all')}
                className="mt-3 px-3 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#082456] transition-colors"
              >
                Ver todos los vecinos
              </button>
            )}
          </div>
        ) : (
          filteredNeighbors.map(neighbor => {
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
                      className={`w-11 h-11 rounded-full object-cover border-2 shrink-0 ${
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
                        {isDebtor ? '⚠️ Deudor' : '✅ No deudor / Al día'}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0A2E6D] border border-blue-200">
                        {frequency === 'anual' ? '📅 Anual' : '🗓️ Mensual'}
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
                    isDebtor 
                      ? 'bg-red-50/80 border-red-200' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <p className={`text-[10px] font-semibold uppercase ${isDebtor ? 'text-red-800' : 'text-[#5A6B82]'}`}>
                      Saldo Actual
                    </p>
                    <p className={`text-base font-bold ${isDebtor ? 'text-red-700' : 'text-green-700'}`}>
                      {formatCurrency(balance)}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                      isDebtor ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-700'
                    }`}>
                      {isDebtor ? 'Deuda activa' : 'Al día'}
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
                      {frequency === 'anual' ? 'Cobro anual' : 'Cobro mensual'}
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
          })
        )}
      </div>

      {/* Account Edit Modal */}
      {selectedNeighborForEdit && (
        <NeighborAccountEditModal
          isOpen={!!selectedNeighborForEdit}
          onClose={() => setSelectedNeighborForEdit(null)}
          neighbor={selectedNeighborForEdit}
        />
      )}
    </div>
  );
};
